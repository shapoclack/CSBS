package api

import (
	"csbs/backend/internal/service"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
)

type ReservationHandler struct {
	service service.ReservationService
}

func NewReservationHandler(service service.ReservationService) *ReservationHandler {
	return &ReservationHandler{service: service}
}

func (h *ReservationHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Use(AuthMiddleware) // Все эндпоинты бронирований защищены JWT!
	r.Post("/", h.create)
	r.Get("/", h.getUserReservations)
	return r
}

type createReservationRequest struct {
	WorkspaceID uint   `json:"workspace_id"`
	TariffID    uint   `json:"tariff_id"`
	StartTime   string `json:"start_time"` // формат: "2026-03-15T10:00:00Z"
	EndTime     string `json:"end_time"`
}

func (h *ReservationHandler) create(w http.ResponseWriter, r *http.Request) {
	// Достаём user_id из контекста (положил туда AuthMiddleware)
	userID := r.Context().Value(UserIDKey).(uint)

	var req createReservationRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Некорректный JSON", http.StatusBadRequest)
		return
	}

	startTime, _ := time.Parse(time.RFC3339, req.StartTime)
	endTime, _ := time.Parse(time.RFC3339, req.EndTime)

	reservation, err := h.service.CreateReservation(userID, req.WorkspaceID, req.TariffID, startTime, endTime)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reservation)
}

func (h *ReservationHandler) getUserReservations(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(UserIDKey).(uint)

	reservations, err := h.service.GetUserReservations(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reservations)
}
