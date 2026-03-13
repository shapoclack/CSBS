package middleware

// contextKey — тип для ключей контекста, чтобы избежать коллизий
type contextKey string

const (
	UserIDKey   contextKey = "user_id"
	UserRoleKey contextKey = "user_role"
)
