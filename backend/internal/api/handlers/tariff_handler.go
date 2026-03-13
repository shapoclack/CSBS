package handlers

import (
	"csbs/backend/internal/api/middleware"
	"csbs/backend/internal/models"
	"csbs/backend/internal/service"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type TariffHandler struct {
	service service.TariffService
}

func NewTariffHandler(service service.TariffService) *TariffHandler {
	return &TariffHandler{service: service}
}

func (h *TariffHandler) Routes() http.Handler {
	r := chi.NewRouter()

	// Публичный доступ к списку тарифов (все могут видеть цены)
	r.Get("/", h.getAll)

	// Доступ только для администраторов
	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware)
		r.Use(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin))

		r.Post("/", h.create)
		r.Put("/{id}", h.update)
		r.Delete("/{id}", h.delete)
	})

	return r
}

func (h *TariffHandler) getAll(w http.ResponseWriter, r *http.Request) {
	tariffs, err := h.service.GetAll()
	if err != nil {
		http.Error(w, "Ошибка получения тарифов", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tariffs)
}

func (h *TariffHandler) create(w http.ResponseWriter, r *http.Request) {
	var tariff models.Tariff
	if err := json.NewDecoder(r.Body).Decode(&tariff); err != nil {
		http.Error(w, "Некорректный JSON", http.StatusBadRequest)
		return
	}

	if err := h.service.CreateTariff(&tariff); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(tariff)
}

func (h *TariffHandler) update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Некорректный ID", http.StatusBadRequest)
		return
	}

	var tariff models.Tariff
	if err := json.NewDecoder(r.Body).Decode(&tariff); err != nil {
		http.Error(w, "Некорректный JSON", http.StatusBadRequest)
		return
	}
	tariff.ID = uint(id)

	if err := h.service.UpdateTariff(&tariff); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tariff)
}

func (h *TariffHandler) delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Некорректный ID", http.StatusBadRequest)
		return
	}

	if err := h.service.DeleteTariff(uint(id)); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
