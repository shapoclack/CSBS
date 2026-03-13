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

	workspaceRepo := repository.NewWorkspaceRepository(db)
	workspaceService := service.NewWorkspaceService(workspaceRepo)
	workspaceHandler := api.NewWorkspaceHandler(workspaceService)
	userRepo := repository.NewUserRepository(db)
	userService := service.NewUserService(userRepo)
	userHandler := api.NewUserHandler(userService)

	auditRepo := repository.NewAuditRepository(db)
	reservationRepo := repository.NewReservationRepository(db)
	reservationService := service.NewReservationService(reservationRepo, auditRepo)
	reservationHandler := api.NewReservationHandler(reservationService)

	tariffRepo := repository.NewTariffRepository(db)
	tariffService := service.NewTariffService(tariffRepo)
	tariffHandler := api.NewTariffHandler(tariffService)

	categoryRepo := repository.NewCategoryRepository(db)
	categoryService := service.NewCategoryService(categoryRepo)
	categoryHandler := api.NewCategoryHandler(categoryService)

	amenityRepo := repository.NewAmenityRepository(db)
	amenityService := service.NewAmenityService(amenityRepo)
	amenityHandler := api.NewAmenityHandler(amenityService)

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
	r.Mount("/api/tariffs", tariffHandler.Routes())
	r.Mount("/api/categories", categoryHandler.Routes())
	r.Mount("/api/services", amenityHandler.Routes())

	// Call seeder
	seedDatabase(db)

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

	db.Model(&models.Role{}).Count(&count)
	if count == 0 {
		db.Create(&models.Role{Name: "Admin"})
		db.Create(&models.Role{Name: "User"})
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
