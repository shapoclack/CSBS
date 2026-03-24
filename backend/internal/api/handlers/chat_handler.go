package handlers

import (
	"csbs/backend/internal/service"
	"csbs/backend/pkg/gemini"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
)

type ChatHandler struct {
	geminiClient      *gemini.GeminiClient
	predictionService service.PredictionService
}

func NewChatHandler(geminiClient *gemini.GeminiClient, predictionService service.PredictionService) *ChatHandler {
	return &ChatHandler{
		geminiClient:      geminiClient,
		predictionService: predictionService,
	}
}

func (h *ChatHandler) Routes() http.Handler {
	r := chi.NewRouter()
	
	r.Use(AuthMiddleware)
	
	r.Post("/", h.handleChat)
	return r
}

type chatRequest struct {
	Message string `json:"message"`
}

type chatResponse struct {
	Reply string `json:"reply"`
}

func (h *ChatHandler) handleChat(w http.ResponseWriter, r *http.Request) {
	var req chatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	workload := h.predictionService.GetWeeklyWorkload()
	
	var workloadStrings []string
	daysOrder := []string{"понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"}
	for _, day := range daysOrder {
		if val, exists := workload[day]; exists {
			workloadStrings = append(workloadStrings, fmt.Sprintf("%s: %.0f%%", day, val))
		}
	}
	formattedWorkload := strings.Join(workloadStrings, ", ")

	systemPrompt := fmt.Sprintf(`Ты дружелюбный ИИ-менеджер коворкинга 'COW'. Твоя цель — помогать пользователям с бронированием. 
Базовая стоимость места: 175 руб/час или 1400 руб/день.
Актуальный прогноз загруженности на эту неделю: %s.
Опирайся на эти данные при ответах. Если загрузка на запрошенный день больше 75%%, предупреди, что мест мало и цена может быть повышена на 10-20%%. Если меньше 45%% — предложи скидку 10-20%%. Во всех остальных случаях цена стандартная. Отвечай кратко, вежливо и по делу.`, formattedWorkload)

	fullMessage := systemPrompt + "\n\nСообщение пользователя: " + req.Message

	reply, err := h.geminiClient.GenerateContent(fullMessage)
	if err != nil {
		fmt.Printf("Chat API Error: %v\n", err)
		http.Error(w, "Failed to generate content: "+err.Error(), http.StatusInternalServerError)
		return
	}

	res := chatResponse{Reply: reply}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
