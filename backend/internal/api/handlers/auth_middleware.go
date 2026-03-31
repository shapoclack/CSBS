package handlers

import (
	"context"
	"net/http"
	"strings"

	"csbs/backend/internal/api/middleware"

	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Достаём токен из куки
		cookie, err := r.Cookie("auth_token")
		if err != nil {
			// Откат: если нет куки, проверим Authorization заголовок для обратной совместимости 
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Отсутствует токен авторизации", http.StatusUnauthorized)
				return
			}
			cookie = &http.Cookie{Value: strings.TrimPrefix(authHeader, "Bearer ")}
		}

		tokenString := cookie.Value
		// 2. Парсим и проверяем токен
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte("my-secret-key"), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "Невалидный токен", http.StatusUnauthorized)
			return
		}
		// 3. Достаём user_id и role из токена и кладём в контекст запроса
		claims := token.Claims.(jwt.MapClaims)
		userID := uint(claims["user_id"].(float64))
        
		userRole := ""
		if roleClaim, ok := claims["role"]; ok {
			userRole = roleClaim.(string)
		}

		ctx := context.WithValue(r.Context(), middleware.UserIDKey, userID)
		ctx = context.WithValue(ctx, middleware.UserRoleKey, userRole)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
