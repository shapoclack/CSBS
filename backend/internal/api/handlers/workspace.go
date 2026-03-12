package api

import (
	"csbs/backend/internal/api/middleware"
	"csbs/backend/internal/models"
	"csbs/backend/internal/service"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type WorkspaceHandler struct {
	service service.WorkspaceService
}

func NewWorkspaceHandler(service service.WorkspaceService) *WorkspaceHandler {
	return &WorkspaceHandler{service: service}
}

func (h *WorkspaceHandler) Routes() http.Handler {
	r := chi.NewRouter()

	// Публичный роут: кто угодно может посмотреть список мест
	r.Get("/", h.getAll)

	// ---> ЗАЩИЩЁННЫЕ РОУТЫ (ГРУППА) <---
	r.Group(func(r chi.Router) {
		// 1. Сначала проверяем, залогинен ли пользователь (есть ли токен)
		r.Use(AuthMiddleware)

		// 2. Затем проверяем, является ли он админом!
		// Разрешаем доступ только cowork_admin и system_admin
		r.Use(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin))

		// Эти действия могут делать только администраторы:
		r.Post("/", h.create)
		r.Put("/{id}", h.update)
		r.Delete("/{id}", h.delete)
	})

	return r
}

func (h *WorkspaceHandler) getAll(w http.ResponseWriter, r *http.Request) {
	workspaces, err := h.service.GetAllWorkspaces()
	if err != nil {
		http.Error(w, "Failed to get workspaces", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workspaces)
}

// ---> НОВЫЕ ХЕНДЛЕРЫ ДЛЯ АДМИНОВ <---

func (h *WorkspaceHandler) create(w http.ResponseWriter, r *http.Request) {
	var workspace models.Workspace
	err := json.NewDecoder(r.Body).Decode(&workspace)
	if err != nil {
		http.Error(w, "Некорректный JSON", http.StatusBadRequest)
		return
	}

	err = h.service.CreateWorkspace(&workspace)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(workspace)
}

func (h *WorkspaceHandler) update(w http.ResponseWriter, r *http.Request) {
	// Достаём ID из пути: /api/workspaces/5
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Некорректный ID", http.StatusBadRequest)
		return
	}

	var workspace models.Workspace
	err = json.NewDecoder(r.Body).Decode(&workspace)
	if err != nil {
		http.Error(w, "Некорректный JSON", http.StatusBadRequest)
		return
	}
	workspace.ID = uint(id) // Принудительно устанавливаем ID из URL

	err = h.service.UpdateWorkspace(&workspace)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workspace)
}

func (h *WorkspaceHandler) delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		http.Error(w, "Некорректный ID", http.StatusBadRequest)
		return
	}

	err = h.service.DeleteWorkspace(uint(id))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent) // 204 No Content (успешно удалено)
}
