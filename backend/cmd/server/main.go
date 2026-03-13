package main

import (
	"csbs/backend/internal/api/handlers"
	"csbs/backend/internal/config"
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"csbs/backend/internal/service"
	"csbs/backend/pkg/gemini"
	"fmt"
	"log"
	"net/http"

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

	cfg := config.Load()

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Moscow",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBName, cfg.DBPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	log.Println("Connected to database")

	err = db.AutoMigrate(
		&models.Location{},
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

	seedRoles(db)

	// Repositories
	locationRepo := repository.NewLocationRepository(db)
	workspaceRepo := repository.NewWorkspaceRepository(db)
	userRepo := repository.NewUserRepository(db)
	auditRepo := repository.NewAuditRepository(db)
	reservationRepo := repository.NewReservationRepository(db)
	tariffRepo := repository.NewTariffRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	amenityRepo := repository.NewAmenityRepository(db)

	// Services
	locationService := service.NewLocationService(locationRepo)
	workspaceService := service.NewWorkspaceService(workspaceRepo)
	userService := service.NewUserService(userRepo)
	reservationService := service.NewReservationService(reservationRepo, auditRepo)
	tariffService := service.NewTariffService(tariffRepo)
	categoryService := service.NewCategoryService(categoryRepo)
	amenityService := service.NewAmenityService(amenityRepo)
	auditLogService := service.NewAuditLogService(auditRepo)
	
	geminiClient := gemini.NewClient(cfg.GeminiAPIKey)
	predictionService := service.NewPredictionService(geminiClient)

	// Handlers
	locationHandler := handlers.NewLocationHandler(locationService)
	workspaceHandler := handlers.NewWorkspaceHandler(workspaceService)
	userHandler := handlers.NewUserHandler(userService)
	reservationHandler := handlers.NewReservationHandler(reservationService)
	tariffHandler := handlers.NewTariffHandler(tariffService)
	categoryHandler := handlers.NewCategoryHandler(categoryService)
	amenityHandler := handlers.NewAmenityHandler(amenityService)
	adminHandler := handlers.NewAdminHandler(userService)
	auditLogHandler := handlers.NewAuditLogHandler(auditLogService)
	predictionHandler := handlers.NewPredictionHandler(predictionService)

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
	
	r.Route("/api", func(r chi.Router) {
		r.Mount("/workspaces", workspaceHandler.Routes())
		r.Mount("/users", userHandler.Routes())
		r.Mount("/reservations", reservationHandler.Routes())
		r.Mount("/tariffs", tariffHandler.Routes())
		r.Mount("/categories", categoryHandler.Routes())
		r.Mount("/services", amenityHandler.Routes())
		r.Mount("/locations", locationHandler.Routes())
		r.Mount("/admin", adminHandler.Routes())
		r.Mount("/auditlogs", auditLogHandler.Routes())
		r.Mount("/predictions", predictionHandler.Routes())
	})

	// Call seeder
	seedDatabase(db)

	port := cfg.ServerPort
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

func seedDatabase(db *gorm.DB) {
	var count int64
	db.Model(&models.Location{}).Count(&count)
	if count == 0 {
		db.Create(&models.Location{Name: "CSBS Центр — ул. Тверская, 15", Address: "ул. Тверская, 15"})
		db.Create(&models.Location{Name: "CSBS Сити — Кутузовский пр-т, 2", Address: "Кутузовский пр-т, 2"})
		db.Create(&models.Location{Name: "CSBS Парк — ул. Парковая, 8", Address: "ул. Парковая, 8"})
	}

	db.Model(&models.WorkspaceCategory{}).Count(&count)
	if count == 0 {
		db.Create(&models.WorkspaceCategory{Name: "Опенспейс", Description: "Рабочее место в открытом пространстве"})
		db.Create(&models.WorkspaceCategory{Name: "Переговорная", Description: "Комната для встреч и звонков"})
		db.Create(&models.WorkspaceCategory{Name: "Офис под ключ", Description: "Отдельный закрытый офис"})
		db.Create(&models.WorkspaceCategory{Name: "Скайп-кабина", Description: "Звукоизолированная кабина для звонков"})
		db.Create(&models.WorkspaceCategory{Name: "Ивент-площадка", Description: "Пространство для мероприятий"})
	}

	db.Model(&models.Tariff{}).Count(&count)
	if count == 0 {
		// Location 1 (Центр)
		db.Create(&models.Tariff{Name: "Почасовой (Центр)", Price: 500, DurationMinutes: 60, LocationID: 1})
		db.Create(&models.Tariff{Name: "Полный день (Центр)", Price: 2500, DurationMinutes: 1440, LocationID: 1})
		// Location 2 (Сити)
		db.Create(&models.Tariff{Name: "Почасовой VIP (Сити)", Price: 800, DurationMinutes: 60, LocationID: 2})
		db.Create(&models.Tariff{Name: "Полный день (Сити)", Price: 4000, DurationMinutes: 1440, LocationID: 2})
		// Location 3 (Парк)
		db.Create(&models.Tariff{Name: "Почасовой Eco (Парк)", Price: 400, DurationMinutes: 60, LocationID: 3})
		db.Create(&models.Tariff{Name: "Полный день (Парк)", Price: 1800, DurationMinutes: 1440, LocationID: 3})
	}

	db.Model(&models.Service{}).Count(&count)
	if count == 0 {
		db.Create(&models.Service{Name: "Wi-Fi", Description: "Высокоскоростной интернет"})
		db.Create(&models.Service{Name: "Кофе / Чай", Description: "Безлимитные напитки"})
		db.Create(&models.Service{Name: "Проектор", Description: "Мультимедийный проектор"})
		db.Create(&models.Service{Name: "Маркерная доска", Description: "Для записей и схем"})
	}

	db.Model(&models.Workspace{}).Count(&count)
	if count == 0 {
		// LOCATION 1: CSBS Центр 
		for i := 1; i <= 16; i++ {
			db.Create(&models.Workspace{NameOrNumber: fmt.Sprintf("A%d", i), CategoryID: 1, LocationID: 1, Capacity: 1})
		}
		for i := 1; i <= 12; i++ {
			db.Create(&models.Workspace{NameOrNumber: fmt.Sprintf("B%d", i), CategoryID: 1, LocationID: 1, Capacity: 1})
		}
		db.Create(&models.Workspace{NameOrNumber: "MR1 (до 6 чел.)", CategoryID: 2, LocationID: 1, Capacity: 6})
		db.Create(&models.Workspace{NameOrNumber: "MR2 (до 6 чел.)", CategoryID: 2, LocationID: 1, Capacity: 6})
		db.Create(&models.Workspace{NameOrNumber: "PO1 (8 чел.)", CategoryID: 3, LocationID: 1, Capacity: 8})
		db.Create(&models.Workspace{NameOrNumber: "SC1", CategoryID: 4, LocationID: 1, Capacity: 1})
		db.Create(&models.Workspace{NameOrNumber: "SC2", CategoryID: 4, LocationID: 1, Capacity: 1})

		// LOCATION 2: CSBS Сити (Premium)
		for i := 1; i <= 8; i++ {
			db.Create(&models.Workspace{NameOrNumber: fmt.Sprintf("C%d", i), CategoryID: 1, LocationID: 2, Capacity: 1})
		}
		db.Create(&models.Workspace{NameOrNumber: "MR-VIP (до 20 чел.)", CategoryID: 2, LocationID: 2, Capacity: 20})
		db.Create(&models.Workspace{NameOrNumber: "PO-Premium 1 (12 чел.)", CategoryID: 3, LocationID: 2, Capacity: 12})
		db.Create(&models.Workspace{NameOrNumber: "PO-Premium 2 (16 чел.)", CategoryID: 3, LocationID: 2, Capacity: 16})
		db.Create(&models.Workspace{NameOrNumber: "Event Space Сити", CategoryID: 5, LocationID: 2, Capacity: 50})

		// LOCATION 3: CSBS Парк (Eco/Quiet)
		for i := 1; i <= 20; i++ {
			db.Create(&models.Workspace{NameOrNumber: fmt.Sprintf("Eco-%d", i), CategoryID: 1, LocationID: 3, Capacity: 1})
		}
		db.Create(&models.Workspace{NameOrNumber: "MR-Eco 1 (до 8 чел.)", CategoryID: 2, LocationID: 3, Capacity: 8})
		db.Create(&models.Workspace{NameOrNumber: "MR-Eco 2 (до 10 чел.)", CategoryID: 2, LocationID: 3, Capacity: 10})
	}

	log.Println("Database seeded (if empty)")
}

func seedRoles(db *gorm.DB) {
	roles := []models.Role{
		{Name: models.RoleUser},
		{Name: models.RoleCoworkAdmin},
		{Name: models.RoleSystemAdmin},
	}
	for _, role := range roles {
		db.FirstOrCreate(&role, models.Role{Name: role.Name})
	}
	log.Println("Roles ensured in database")
}
