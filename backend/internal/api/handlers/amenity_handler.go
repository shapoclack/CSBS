package api

import (
	"csbs/backend/internal/service"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type AmenityHandler struct {
	service service.AmenityService
}

func NewAmenityHandler(service service.AmenityService) *AmenityHandler {
	return &AmenityHandler{service: service}
}

func (h *AmenityHandler) Routes() http.Handler {
	r := chi.NewRouter()

	r.Get("/", h.getAll)

	return r
}

func (h *AmenityHandler) getAll(w http.ResponseWriter, r *http.Request) {
	amenities, err := h.service.GetAllAmenities()
	if err != nil {
		http.Error(w, "Failed to get amenities", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(amenities)
}
