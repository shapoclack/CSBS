package handlers

import (
	"csbs/backend/internal/service"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type PredictionHandler struct {
	predictionService service.PredictionService
}

func NewPredictionHandler(predictionService service.PredictionService) *PredictionHandler {
	return &PredictionHandler{predictionService: predictionService}
}

func (h *PredictionHandler) Routes() http.Handler {
	r := chi.NewRouter()

	// Публичный доступ не даём, только авторизованным пользователям
	r.Use(AuthMiddleware)

	// Пример URL: /api/predictions/workload?day=monday
	r.Get("/workload", h.getPrediction)

	return r
}

func (h *PredictionHandler) getPrediction(w http.ResponseWriter, r *http.Request) {
	// Достаём день из query параметров (?day=monday)
	day := r.URL.Query().Get("day")
	if day == "" {
		http.Error(w, "Параметр 'day' обязателен", http.StatusBadRequest)
		return
	}

	// Вызываем сервис
	predictionJSON, err := h.predictionService.GetWorkloadPrediction(day)
	if err != nil {
		http.Error(w, "Ошибка генерации прогноза: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Gemini нам уже возвращает готовую JSON строку, так что просто пишем её в Response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(predictionJSON))
}
