package handlers

import (
	"csbs/backend/internal/api/middleware"
	"csbs/backend/internal/models"
	"csbs/backend/internal/service"
	"encoding/json"
	"net/http"
	"strconv"
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
	r.Use(AuthMiddleware) // Все эндпоинты бронирований защищены JWT
	r.Post("/", h.create)
	r.Get("/", h.getUserReservations)
	r.Get("/availability", h.getAvailability)

	// Админские роуты
	r.With(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin)).
		Get("/all", h.getAllReservations)
	r.With(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin)).
		Post("/admin", h.adminCreate)
	r.With(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin)).
		Put("/{id}", h.update)
	r.With(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin)).
		Delete("/{id}", h.delete)

	return r
}

type createReservationRequest struct {
	WorkspaceID uint   `json:"workspace_id"`
	TariffID    uint   `json:"tariff_id"`
	StartTime   string `json:"start_time"` // формат: "2026-03-15T10:00:00Z"
	EndTime     string `json:"end_time"`
}

type adminCreateReservationRequest struct {
	UserID      uint   `json:"user_id"`
	WorkspaceID uint   `json:"workspace_id"`
	TariffID    uint   `json:"tariff_id"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
}

type updateReservationRequest struct {
	WorkspaceID uint   `json:"workspace_id"`
	TariffID    uint   `json:"tariff_id"`
	StartTime   string `json:"start_time"`
	EndTime     string `json:"end_time"`
	Status      string `json:"status"`
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

func (h *ReservationHandler) adminCreate(w http.ResponseWriter, r *http.Request) {
	var req adminCreateReservationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Некорректный JSON", http.StatusBadRequest)
		return
	}
	if req.UserID == 0 {
		http.Error(w, "user_id обязателен", http.StatusBadRequest)
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		http.Error(w, "Некорректный start_time", http.StatusBadRequest)
		return
	}
	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		http.Error(w, "Некорректный end_time", http.StatusBadRequest)
		return
	}

	reservation, err := h.service.CreateReservation(req.UserID, req.WorkspaceID, req.TariffID, startTime, endTime)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(reservation)
}

func (h *ReservationHandler) update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Некорректный ID", http.StatusBadRequest)
		return
	}

	var req updateReservationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Некорректный JSON", http.StatusBadRequest)
		return
	}

	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		http.Error(w, "Некорректный start_time", http.StatusBadRequest)
		return
	}
	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		http.Error(w, "Некорректный end_time", http.StatusBadRequest)
		return
	}

	actorUserID := r.Context().Value(middleware.UserIDKey).(uint)

	reservation, err := h.service.UpdateReservation(uint(id), req.WorkspaceID, req.TariffID, startTime, endTime, req.Status, actorUserID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reservation)
}

func (h *ReservationHandler) delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Некорректный ID", http.StatusBadRequest)
		return
	}

	actorUserID := r.Context().Value(middleware.UserIDKey).(uint)

	if err := h.service.DeleteReservation(uint(id), actorUserID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusNoContent)
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
