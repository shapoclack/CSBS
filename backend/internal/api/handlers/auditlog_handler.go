package handlers

import (
	"csbs/backend/internal/api/middleware"
	"csbs/backend/internal/models"
	"csbs/backend/internal/service"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type AuditLogHandler struct {
	service service.AuditLogService
}

func NewAuditLogHandler(service service.AuditLogService) *AuditLogHandler {
	return &AuditLogHandler{service: service}
}

func (h *AuditLogHandler) Routes() http.Handler {
	r := chi.NewRouter()

	r.Use(AuthMiddleware)
	// Доступ к логам имеют только админы
	r.Use(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin))

	r.Get("/", h.getAllLogs)

	return r
}

func (h *AuditLogHandler) getAllLogs(w http.ResponseWriter, r *http.Request) {
	logs, err := h.service.GetAllLogs()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}
