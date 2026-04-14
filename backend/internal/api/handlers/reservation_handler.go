package handlers

import (
	"csbs/backend/internal/api/middleware"
	"csbs/backend/internal/models"
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
	r.Get("/availability", h.getAvailability)

	// Админский роут: получить ВСЕ бронирования
	r.With(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin)).
		Get("/all", h.getAllReservations)

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
	userID := r.Context().Value(middleware.UserIDKey).(uint)

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
	userID := r.Context().Value(middleware.UserIDKey).(uint)

	reservations, err := h.service.GetUserReservations(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reservations)
}

func (h *ReservationHandler) getAllReservations(w http.ResponseWriter, r *http.Request) {
	reservations, err := h.service.GetAllReservations()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reservations)
}

func (h *ReservationHandler) getAvailability(w http.ResponseWriter, r *http.Request) {
	startStr := r.URL.Query().Get("start_time")
	endStr := r.URL.Query().Get("end_time")

	if startStr == "" || endStr == "" {
		http.Error(w, "start_time and end_time query parameters are required", http.StatusBadRequest)
		return
	}

	startTime, err := time.Parse(time.RFC3339, startStr)
	if err != nil {
		http.Error(w, "invalid start_time format", http.StatusBadRequest)
		return
	}

	endTime, err := time.Parse(time.RFC3339, endStr)
	if err != nil {
		http.Error(w, "invalid end_time format", http.StatusBadRequest)
		return
	}

	ids, err := h.service.GetUnavailableWorkspaceIDs(startTime, endTime)
	if err != nil {
		http.Error(w, "Failed to get availability", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ids)
}
