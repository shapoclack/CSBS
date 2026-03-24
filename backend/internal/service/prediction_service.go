package service

import (
	"csbs/backend/pkg/gemini"
	"csbs/backend/pkg/logger"
	"fmt"
	"strings"

	"github.com/dmitryikh/leaves"
)

type PredictionService interface {
	GetWorkloadPrediction(dayOfWeek string) (string, error)
}

type PredictionServiceImpl struct {
	geminiClient *gemini.GeminiClient
	model        *leaves.Ensemble // Указатель на загруженную ML-модель
}

// Конструктор теперь принимает путь к файлу модели
func NewPredictionService(geminiClient *gemini.GeminiClient, modelPath string) (PredictionService, error) {
	// Загружаем LightGBM модель при старте сервера
	model, err := leaves.LGEnsembleFromFile(modelPath, true)
	if err != nil {
		return nil, fmt.Errorf("ошибка загрузки ML модели LightGBM: %w", err)
	}

	return &PredictionServiceImpl{
		geminiClient: geminiClient,
		model:        model,
	}, nil
}

// Вспомогательная функция перевода дня недели в признаки (features) для ML
func getFeaturesForDay(day string) ([]float64, error) {
	day = strings.ToLower(day)
	// Фичи: [day_of_week (0=Пн, 6=Вс), is_weekend (0 или 1)]
	switch day {
	case "monday", "понедельник":
		return []float64{0.0, 0.0}, nil
	case "tuesday", "вторник":
		return []float64{1.0, 0.0}, nil
	case "wednesday", "среда":
		return []float64{2.0, 0.0}, nil
	case "thursday", "четверг":
		return []float64{3.0, 0.0}, nil
	case "friday", "пятница":
		return []float64{4.0, 0.0}, nil
	case "saturday", "суббота":
		return []float64{5.0, 1.0}, nil
	case "sunday", "воскресенье":
		return []float64{6.0, 1.0}, nil
	default:
		return nil, fmt.Errorf("неизвестный день недели: %s", day)
	}
}

func (s *PredictionServiceImpl) GetWorkloadPrediction(dayOfWeek string) (string, error) {
	logger.Info.Printf("Service: Requesting workload prediction for day: %s", dayOfWeek)

	// 1. Извлекаем фичи для запрашиваемого дня
	features, err := getFeaturesForDay(dayOfWeek)
	if err != nil {
		logger.Error.Printf("Service: Invalid day provided: %s", dayOfWeek)
		return "", err
	}

	// 2. Инференс ML-модели (Градиентный бустинг)
	// PredictSingle принимает срез float64 и номер итерации (0 = использовать все деревья)
	prediction := s.model.PredictSingle(features, 0)

	// Корректируем возможные выбросы
	if prediction < 0 {
		prediction = 0
	}
	if prediction > 100 {
		prediction = 100
	}

	logger.Info.Printf("Service: ML predicted workload %.2f%% for %s", prediction, dayOfWeek)

	// 3. Формируем контекст для Gemini, передавая ей уже ГОТОВЫЙ прогноз
	prompt := fmt.Sprintf(`
Привет! Ты AI-менеджер системы бронирования мест в коворкинге "COW".

Наша математическая ML-модель только что спрогнозировала загруженность коворкинга на день: %s.
Точный прогноз загрузки: %.1f%%.
Стандартная цена рабочего места: 1000 руб.

Твоя задача:
Сформируй ответ для пользователя.
- Если загрузка высокая (>75%%), порекомендуй забронировать скорее и установи повышенную цену (на 10-20%%), чтобы максимизировать прибыль.
- Если загрузка низкая (<45%%), предложи скидку (на 10-20%%), чтобы привлечь клиента.
- Если средняя — оставь 1000 руб.

Сгенерируй ТОЛЬКО валидный JSON (без маркдауна, без кавычек с "json"):
{
  "day": "%s",
  "expected_workload_percent": %.1f,
  "recommended_price_rub": число,
  "message": "Приветливое, короткое (1-2 предложения) сообщение клиенту от лица коворкинга с рекомендацией и обоснованием цены"
}
	`, dayOfWeek, prediction, dayOfWeek, prediction)

	// 4. Отправляем запрос через клиент
	response, err := s.geminiClient.GenerateContent(prompt)
	if err != nil {
		logger.Error.Printf("Service: Gemini logic error for %s: %v", dayOfWeek, err)
		return "", fmt.Errorf("ошибка генерации ответа LLM: %w", err)
	}

	logger.Info.Printf("Service: Successfully received LLM response for %s", dayOfWeek)
	return response, nil
}
