package main

import (
	api "csbs/backend/internal/api/handlers"
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"csbs/backend/internal/service"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Moscow",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Connected to database")

	err = db.AutoMigrate(
		&models.User{},
		&models.Workspace{},
		&models.Service{},
		&models.WorkspaceCategory{},
		&models.Tariff{},
		&models.Role{},
		&models.Reservation{},
		&models.AuditLog{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}
	log.Println("Database migrated")

	workspaceRepo := repository.NewWorkspaceRepository(db)
	workspaceService := service.NewWorkspaceService(workspaceRepo)
	workspaceHandler := api.NewWorkspaceHandler(workspaceService)
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := api.NewUserHandler(userService)
	reservationRepo := repository.NewReservationRepository(db)
	reservationService := service.NewReservationService(reservationRepo)
	reservationHandler := api.NewReservationHandler(reservationService)

	r := chi.NewRouter()
	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
	}))
	// Routes
	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello World"))
	})
	r.Mount("/api/workspaces", workspaceHandler.Routes())
	r.Mount("/api/users", userHandler.Routes())
	r.Mount("/api/reservations", reservationHandler.Routes())

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	serverAdress := ":" + port
	log.Printf("Server started at %s", serverAdress)

	err = http.ListenAndServe(serverAdress, r)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
