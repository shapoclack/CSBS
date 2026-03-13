package api

import (
	"csbs/backend/internal/service"
	"encoding/json"
	"net/http"

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

	r.Get("/", h.getAll)

	return r
}

func (h *TariffHandler) getAll(w http.ResponseWriter, r *http.Request) {
	tariffs, err := h.service.GetAllTariffs()
	if err != nil {
		http.Error(w, "Failed to get tariffs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tariffs)
}
