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

type AdminHandler struct {
	userService service.UserService
}

func NewAdminHandler(userService service.UserService) *AdminHandler {
	return &AdminHandler{userService: userService}
}

func (h *AdminHandler) Routes() http.Handler {
	r := chi.NewRouter()

	// Все роуты админки защищены!
	r.Use(AuthMiddleware)

	// Список пользователей видят и cowork_admin, и system_admin
	r.With(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin)).
		Get("/users", h.getAllUsers)

	// Блокировать юзеров могут оба админа
	r.With(middleware.RequireRole(models.RoleCoworkAdmin, models.RoleSystemAdmin)).
		Put("/users/{id}/status", h.updateUserStatus)

	// А вот менять роли может ТОЛЬКО system_admin
	r.With(middleware.RequireRole(models.RoleSystemAdmin)).
		Put("/users/{id}/role", h.updateUserRole)

	return r
}

func (h *AdminHandler) getAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.userService.GetAllUsers()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

type updateStatusReq struct {
	Status string `json:"status"` // "активен" или "заблокирован"
}

func (h *AdminHandler) updateUserStatus(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var req updateStatusReq
	json.NewDecoder(r.Body).Decode(&req)

	if err := h.userService.UpdateUserStatus(uint(id), req.Status); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}

type updateRoleReq struct {
	Role string `json:"role"` // "user", "cowork_admin", "system_admin"
}

func (h *AdminHandler) updateUserRole(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	var req updateRoleReq
	json.NewDecoder(r.Body).Decode(&req)

	if err := h.userService.UpdateUserRole(uint(id), req.Role); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
}
