package handlers

import (
	"csbs/backend/internal/service"
	"csbs/backend/pkg/gemini"
	"csbs/backend/pkg/logger"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/golang-jwt/jwt/v5"
)

const (
	chatHistoryCookieName = "chat_history"
	chatHistoryMaxMessages = 20
)

type ChatHandler struct {
	geminiClient       *gemini.GeminiClient
	predictionService  service.PredictionService
	reservationService service.ReservationService
	workspaceService   service.WorkspaceService
	tariffService      service.TariffService
}

func NewChatHandler(
	geminiClient *gemini.GeminiClient,
	predictionService service.PredictionService,
	reservationService service.ReservationService,
	workspaceService service.WorkspaceService,
	tariffService service.TariffService,
) *ChatHandler {
	return &ChatHandler{
		geminiClient:       geminiClient,
		predictionService:  predictionService,
		reservationService: reservationService,
		workspaceService:   workspaceService,
		tariffService:      tariffService,
	}
}

func (h *ChatHandler) Routes() http.Handler {
	r := chi.NewRouter()
	// Чат доступен всем, авторизация опциональная (для бронирования)
	r.Post("/", h.handleChat)
	r.Get("/history", h.getHistory)
	r.Delete("/history", h.clearHistory)
	return r
}

// readHistoryCookie декодирует base64+JSON историю из HttpOnly куки
func readHistoryCookie(r *http.Request) []chatMessage {
	cookie, err := r.Cookie(chatHistoryCookieName)
	if err != nil || cookie.Value == "" {
		return nil
	}
	raw, err := base64.StdEncoding.DecodeString(cookie.Value)
	if err != nil {
		return nil
	}
	var msgs []chatMessage
	if err := json.Unmarshal(raw, &msgs); err != nil {
		return nil
	}
	return msgs
}

// writeHistoryCookie кодирует и записывает историю в HttpOnly куку (с обрезкой до chatHistoryMaxMessages)
func writeHistoryCookie(w http.ResponseWriter, history []chatMessage) {
	if len(history) > chatHistoryMaxMessages {
		history = history[len(history)-chatHistoryMaxMessages:]
	}
	data, err := json.Marshal(history)
	if err != nil {
		logger.Error.Printf("Chat: failed to marshal history: %v", err)
		return
	}
	encoded := base64.StdEncoding.EncodeToString(data)
	http.SetCookie(w, &http.Cookie{
		Name:     chatHistoryCookieName,
		Value:    encoded,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		MaxAge:   3600 * 24 * 7, // 7 дней
	})
}

func (h *ChatHandler) getHistory(w http.ResponseWriter, r *http.Request) {
	history := readHistoryCookie(r)
	if history == nil {
		history = []chatMessage{}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

func (h *ChatHandler) clearHistory(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     chatHistoryCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1,
	})
	w.WriteHeader(http.StatusNoContent)
}

// --- Структуры запроса/ответа ---

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Message string        `json:"message"`
	History []chatMessage `json:"history"`
}

type bookingInfo struct {
	WorkspaceName string `json:"workspace_name"`
	Date          string `json:"date"`
	TimeFrom      string `json:"time_from"`
	TimeTo        string `json:"time_to"`
	Price         string `json:"price"`
}

type chatResponse struct {
	Reply   string       `json:"reply"`
	Action  string       `json:"action,omitempty"`
	Booking *bookingInfo `json:"booking,omitempty"`
}

// --- Структура для парсинга ответа Gemini ---
type geminiAction struct {
	Action      string `json:"action"`
	Reply       string `json:"reply"`
	WorkspaceID uint   `json:"workspace_id,omitempty"`
	TariffID    uint   `json:"tariff_id,omitempty"`
	Date        string `json:"date,omitempty"`
	TimeFrom    string `json:"time_from,omitempty"`
	TimeTo      string `json:"time_to,omitempty"`
}

// tryExtractUserID — опциональная авторизация: пытаемся достать user_id из куки,
// но НЕ возвращаем ошибку, если куки нет. Возвращает 0 если не авторизован.
func tryExtractUserID(r *http.Request) uint {
	cookie, err := r.Cookie("auth_token")
	if err != nil {
		// Нет куки — проверяем заголовок
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			return 0
		}
		cookie = &http.Cookie{Value: strings.TrimPrefix(authHeader, "Bearer ")}
	}

	token, err := jwt.Parse(cookie.Value, func(token *jwt.Token) (interface{}, error) {
		return []byte("my-secret-key"), nil
	})
	if err != nil || !token.Valid {
		return 0
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0
	}

	return uint(userIDFloat)
}

func (h *ChatHandler) handleChat(w http.ResponseWriter, r *http.Request) {
	var req chatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	userID := tryExtractUserID(r)

	// Собираем контекст для Gemini: загрузка, воркспейсы, тарифы
	workload := h.predictionService.GetWeeklyWorkload()

	var workloadStrings []string
	daysOrder := []string{"понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"}
	for _, day := range daysOrder {
		if val, exists := workload[day]; exists {
			workloadStrings = append(workloadStrings, fmt.Sprintf("%s: %.0f%%", day, val))
		}
	}
	formattedWorkload := strings.Join(workloadStrings, ", ")

	// Получаем доступные воркспейсы
	workspacesInfo := h.getWorkspacesInfo()
	tariffsInfo := h.getTariffsInfo()

	todayStr := time.Now().Format("2006-01-02")
	weekdayRu := russianWeekday(time.Now().Weekday())

	authStatus := "Пользователь НЕ авторизован. Если он просит забронировать — используй action: \"need_auth\" и вежливо попроси его войти в аккаунт."
	if userID > 0 {
		authStatus = fmt.Sprintf("Пользователь авторизован (ID: %d). Ты можешь создавать бронирования.", userID)
	}

	systemPrompt := fmt.Sprintf(`Ты дружелюбный ИИ-менеджер коворкинга 'COW'. Твоя цель — помогать пользователям с бронированием.

Сегодня: %s (%s).
%s

Базовая стоимость места: 175 руб/час или 1400 руб/день.
Актуальный прогноз загруженности на эту неделю: %s.

Доступные рабочие места:
%s

Доступные тарифы:
%s

ПРАВИЛА ОТВЕТА:
1. Отвечай ТОЛЬКО валидным JSON (без маркдауна, без обёртки в тройные кавычки).
2. Формат ответа:
{
  "action": "chat",
  "reply": "Текст ответа пользователю"
}

3. Если пользователь ЯВНО просит забронировать место и он авторизован, используй:
{
  "action": "book",
  "reply": "Текст подтверждения для пользователя",
  "workspace_id": числовой_ID_места,
  "tariff_id": числовой_ID_тарифа,
  "date": "YYYY-MM-DD",
  "time_from": "HH:MM",
  "time_to": "HH:MM"
}

4. Если пользователь просит забронировать, но НЕ авторизован:
{
  "action": "need_auth",
  "reply": "Для бронирования необходимо войти в аккаунт. Пожалуйста, авторизуйтесь и попробуйте снова!"
}

5. Если пользователь хочет забронировать, но не указал конкретное место или дату — уточни у него, НЕ бронируй.
6. Если загрузка на запрошенный день >75%%, предупреди о повышении цены на 10-20%%. Если <45%% — предложи скидку.
7. Не здоровайся в ответах — сразу переходи к сути.
8. Всегда используй workspace_id и tariff_id из списков выше, НЕ выдумывай ID.`, todayStr, weekdayRu, authStatus, formattedWorkload, workspacesInfo, tariffsInfo)

	// Формируем историю сообщений для контекста
	var conversationParts []string
	conversationParts = append(conversationParts, systemPrompt)

	// Берём последние 10 сообщений из истории
	history := req.History
	if len(history) > 10 {
		history = history[len(history)-10:]
	}
	for _, msg := range history {
		if msg.Role == "user" {
			conversationParts = append(conversationParts, "Пользователь: "+msg.Content)
		} else {
			conversationParts = append(conversationParts, "Ассистент: "+msg.Content)
		}
	}

	conversationParts = append(conversationParts, "Пользователь: "+req.Message)

	fullMessage := strings.Join(conversationParts, "\n\n")

	// Отправляем в Gemini
	rawReply, err := h.geminiClient.GenerateContent(fullMessage)
	if err != nil {
		logger.Error.Printf("Chat API Error: %v", err)
		http.Error(w, "Failed to generate content: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Пытаемся распарсить JSON-ответ от Gemini
	cleanedReply := cleanJSON(rawReply)
	var action geminiAction
	if err := json.Unmarshal([]byte(cleanedReply), &action); err != nil {
		// Gemini вернул обычный текст вместо JSON — отдаём как есть
		logger.Warn.Printf("Chat: Gemini returned non-JSON, falling back to plain text: %v", err)
		res := chatResponse{Reply: rawReply}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
		return
	}

	// Обрабатываем action
	switch action.Action {
	case "book":
		h.handleBookAction(w, r, userID, action)
	case "need_auth":
		res := chatResponse{Reply: action.Reply, Action: "need_auth"}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	default:
		// Просто чат
		res := chatResponse{Reply: action.Reply}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	}
}

func (h *ChatHandler) handleBookAction(w http.ResponseWriter, r *http.Request, userID uint, action geminiAction) {
	if userID == 0 {
		res := chatResponse{
			Reply:  "Для бронирования необходимо войти в аккаунт. Пожалуйста, авторизуйтесь!",
			Action: "need_auth",
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
		return
	}

	// Парсим дату и время
	startTimeStr := fmt.Sprintf("%sT%s:00+03:00", action.Date, action.TimeFrom)
	endTimeStr := fmt.Sprintf("%sT%s:00+03:00", action.Date, action.TimeTo)

	startTime, err := time.Parse("2006-01-02T15:04:05-07:00", startTimeStr)
	if err != nil {
		logger.Error.Printf("Chat: Failed to parse start time: %v", err)
		res := chatResponse{Reply: "Не удалось разобрать дату/время. Попробуйте указать точнее, например: «забронируй A1 на 2026-04-15 с 10:00 до 14:00»."}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
		return
	}
	endTime, err := time.Parse("2006-01-02T15:04:05-07:00", endTimeStr)
	if err != nil {
		logger.Error.Printf("Chat: Failed to parse end time: %v", err)
		res := chatResponse{Reply: "Не удалось разобрать время окончания. Попробуйте ещё раз."}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
		return
	}

	// Создаём бронирование через сервис
	reservation, err := h.reservationService.CreateReservation(
		userID,
		action.WorkspaceID,
		action.TariffID,
		startTime,
		endTime,
	)
	if err != nil {
		logger.Error.Printf("Chat: Failed to create reservation: %v", err)
		res := chatResponse{Reply: fmt.Sprintf("К сожалению, не удалось создать бронирование: %s. Попробуйте выбрать другое время или место.", err.Error())}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
		return
	}

	// Получаем данные для красивой карточки
	_ = reservation
	workspaceName := fmt.Sprintf("Место #%d", action.WorkspaceID)
	// Попробуем получить настоящее имя из БД
	workspaces, wsErr := h.workspaceService.GetAllWorkspaces()
	if wsErr == nil {
		for _, ws := range workspaces {
			if ws.ID == action.WorkspaceID {
				workspaceName = ws.NameOrNumber
				break
			}
		}
	}

	// Формируем цену из тарифа
	priceStr := ""
	tariffs, tErr := h.tariffService.GetAll()
	if tErr == nil {
		for _, t := range tariffs {
			if t.ID == action.TariffID {
				priceStr = fmt.Sprintf("%.0f ₽", t.Price)
				break
			}
		}
	}

	logger.Info.Printf("Chat: Successfully booked workspace %d for user %d via AI assistant", action.WorkspaceID, userID)

	res := chatResponse{
		Reply:  action.Reply,
		Action: "booked",
		Booking: &bookingInfo{
			WorkspaceName: workspaceName,
			Date:          action.Date,
			TimeFrom:      action.TimeFrom,
			TimeTo:        action.TimeTo,
			Price:         priceStr,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

// --- Вспомогательные функции ---

func (h *ChatHandler) getWorkspacesInfo() string {
	workspaces, err := h.workspaceService.GetAllWorkspaces()
	if err != nil {
		return "Не удалось загрузить список мест"
	}

	var lines []string
	for _, ws := range workspaces {
		categoryName := ""
		if ws.Category.Name != "" {
			categoryName = ws.Category.Name
		}
		lines = append(lines, fmt.Sprintf("- ID:%d, Название: %s, Тип: %s, Вместимость: %d, Локация ID:%d",
			ws.ID, ws.NameOrNumber, categoryName, ws.Capacity, ws.LocationID))
	}

	if len(lines) > 50 {
		lines = lines[:50]
		lines = append(lines, "... (и ещё места)")
	}

	return strings.Join(lines, "\n")
}

func (h *ChatHandler) getTariffsInfo() string {
	tariffs, err := h.tariffService.GetAll()
	if err != nil {
		return "Не удалось загрузить тарифы"
	}

	var lines []string
	for _, t := range tariffs {
		lines = append(lines, fmt.Sprintf("- ID:%d, Название: %s, Цена: %.0f руб, Длительность: %d мин, Локация ID:%d",
			t.ID, t.Name, t.Price, t.DurationMinutes, t.LocationID))
	}

	return strings.Join(lines, "\n")
}

// cleanJSON убирает маркдаун-обёртку вокруг JSON (```json...```)
func cleanJSON(raw string) string {
	s := strings.TrimSpace(raw)
	// Убираем ```json ... ```
	if strings.HasPrefix(s, "```") {
		// Отрезаем первую строку (```json)
		if idx := strings.Index(s, "\n"); idx != -1 {
			s = s[idx+1:]
		}
		// Убираем завершающие ```
		if idx := strings.LastIndex(s, "```"); idx != -1 {
			s = s[:idx]
		}
	}
	return strings.TrimSpace(s)
}

func russianWeekday(wd time.Weekday) string {
	switch wd {
	case time.Monday:
		return "понедельник"
	case time.Tuesday:
		return "вторник"
	case time.Wednesday:
		return "среда"
	case time.Thursday:
		return "четверг"
	case time.Friday:
		return "пятница"
	case time.Saturday:
		return "суббота"
	case time.Sunday:
		return "воскресенье"
	default:
		return ""
	}
}
