package api

import (
	"context"
	"net/http"
	"strings"

	"csbs/backend/internal/api/middleware"

	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Достаём заголовок Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Отсутствует токен авторизации", http.StatusUnauthorized)
			return
		}
		// 2. Убираем префикс "Bearer " из заголовка
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		// 3. Парсим и проверяем токен
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte("my-secret-key"), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "Невалидный токен", http.StatusUnauthorized)
			return
		}
		// 4. Достаём user_id и role из токена и кладём в контекст запроса
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
