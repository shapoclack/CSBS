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

type WorkspaceHandler struct {
	service service.WorkspaceService
}

func NewWorkspaceHandler(service service.WorkspaceService) *WorkspaceHandler {
	return &WorkspaceHandler{service: service}
}

func (h *WorkspaceHandler) Routes() http.Handler {
	r := chi.NewRouter()

	// Открытый эндпоинт: сюда могут ходить даже незарегистрированные юзеры
	r.Get("/", h.getAll)

	// ---> ТУТ НАЧИНАЮТСЯ ЗАЩИЩЁННЫЕ ХЕНДЛЕРЫ <---
	r.Group(func(r chi.Router) {
		// 1. Проверяем JWT токен (если нет - сразу отдаст 401)
		r.Use(AuthMiddleware)

		// 2. Проверяем права (швейцар для админов)
		// Доступ даем только админам коворкинга и сисадминам
		r.Use(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin))

		// Ниже лежат CRUD операции, доступные только для админов:
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

// ---> АДМИНСКИЕ КОНТРОЛЛЕРЫ <---

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
	// Вытаскиваю ID из URL (например: /api/workspaces/5)
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
	workspace.ID = uint(id) // Жестко прописываю ID из URL, чтобы не обновили чужое место

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

	w.WriteHeader(http.StatusNoContent) // Отдаем 204 (возвращать нечего)
}
