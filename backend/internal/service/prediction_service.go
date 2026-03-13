package service

import (
	"csbs/backend/pkg/gemini"
	"csbs/backend/pkg/logger"
	"fmt"
	"strings"
)

type PredictionService interface {
	GetWorkloadPrediction(dayOfWeek string) (string, error)
}

type PredictionServiceImpl struct {
	geminiClient *gemini.GeminiClient
}

func NewPredictionService(geminiClient *gemini.GeminiClient) PredictionService {
	return &PredictionServiceImpl{
		geminiClient: geminiClient,
	}
}

func (s *PredictionServiceImpl) GetWorkloadPrediction(dayOfWeek string) (string, error) {
	logger.Info.Printf("Service: Requesting workload prediction for day: %s", dayOfWeek)
	// 1. Формируем контекст (промпт) для Gemini
	// В реальном проекте тут был бы запрос в БД, например s.reservationRepo.GetStatsFunc()
	prompt := fmt.Sprintf(`
Привет! Ты AI-ассистент системы бронирования мест в коворкинге "COW".
Тебе нужно проанализировать загруженность коворкинга и дать рекомендацию цены.

Исторические данные загрузки по дням недели:
- Понедельник: 85%%
- Вторник: 80%%
- Среда: 90%%
- Четверг: 75%%
- Пятница: 60%%
- Суббота: 30%%
- Воскресенье: 20%%

Стандартная цена за день: 1000 руб.

Задача:
Клиент запрашивает прогноз на следующий день: %s.
Основываясь на исторических данных, ответь в формате JSON:
{
  "day": "запрошенный день",
  "expected_workload_percent": число (прогнозируемая загрузка),
  "recommended_price_rub": число (если спрос высокий (>80%%), повышай цену на 10-20%%. Если низкий (<40%%) делай скидку 10-20%%),
  "reasoning": "короткое объяснение на 1-2 предложения, почему такая цена"
}

Выведи ТОЛЬКО валидный JSON, без маркдауна (без кавычек с "json") и без лишнего текста.
	`, strings.ToLower(dayOfWeek))

	// 2. Отправляем запрос через наш клиент
	response, err := s.geminiClient.GenerateContent(prompt)
	if err != nil {
		logger.Error.Printf("Service: Gemini prediction error for %s: %v", dayOfWeek, err)
		return "", fmt.Errorf("ошибка получения ответа от Gemini: %w", err)
	}
	logger.Info.Printf("Service: Successfully received prediction for %s", dayOfWeek)

	// 3. Возвращаем результат
	// Так как мы явно попросили JSON без маркдауна, ответ должен быть готов к отправке
	return response, nil
}
