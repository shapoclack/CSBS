package middleware

import (
	"net/http"
)

func RequireRole(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			roleVal := r.Context().Value(UserRoleKey)
			if roleVal == nil {
				http.Error(w, "Роль неопределена", http.StatusForbidden)
				return
			}
			userRole := roleVal.(string)

			for _, allowed := range allowedRoles {
				if userRole == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}

			http.Error(w, "У вас нет прав для выполнения этого действия", http.StatusForbidden)
		})
	}
}
