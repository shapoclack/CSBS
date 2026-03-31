package handlers

import (
	"csbs/backend/internal/api/middleware"
	"csbs/backend/internal/models"
	"csbs/backend/internal/service"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// roleMapping converts internal role names to frontend-expected values
var roleMapping = map[string]string{
	models.RoleUser:        "client",
	models.RoleCoworkAdmin: "manager",
	models.RoleSystemAdmin: "sysadmin",
}

type userDTO struct {
	ID    uint   `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Role  string `json:"role"`
}

type UserHandler struct {
	service service.UserService
}

func NewUserHandler(service service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) Routes() http.Handler {
	r := chi.NewRouter()
	r.Post("/register", h.register)
	r.Post("/login", h.login)
	r.Post("/logout", h.logout)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(AuthMiddleware)
		r.Get("/me", h.getMe)
	})

	return r
}

type registerRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

func (h *UserHandler) register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	user, err := h.service.Register(req.Name, req.Email, req.Phone, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *UserHandler) login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Некорректный JSON", http.StatusBadRequest)
		return
	}
	token, err := h.service.Login(req.Email, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // set to true in production with HTTPS
		SameSite: http.SameSiteLaxMode,
		MaxAge:   3600 * 24, // 24 hours
	})

	w.Header().Set("Content-Type", "application/json")
	// Still return token in json for backward compatibility if needed, 
	// though frontend will now ignore it.
	json.NewEncoder(w).Encode(map[string]string{"token": token, "message": "logged in successfully"})
}

func (h *UserHandler) logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // same as login
		SameSite: http.SameSiteLaxMode,
		MaxAge:   -1, // deletes the cookie
	})
	
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("logged out successfully"))
}

func (h *UserHandler) getMe(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(middleware.UserIDKey).(uint)

	user, err := h.service.GetUserByID(userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	role := roleMapping[user.Role.Name]
	if role == "" {
		role = "client" // fallback
	}

	dto := userDTO{
		ID:    user.ID,
		Name:  user.FullName,
		Email: user.Email,
		Phone: user.Phone,
		Role:  role,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dto)
}
