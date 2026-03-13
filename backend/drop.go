package main

import (
	"csbs/backend/internal/models"
	"fmt"
	"log"
	"os"

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

	// Drop tables
	db.Migrator().DropTable(
		&models.Reservation{},
		"workspace_services",
		&models.Workspace{},
		&models.Service{},
		&models.WorkspaceCategory{},
		&models.Tariff{},
		&models.Role{},
		&models.AuditLog{},
		&models.Location{},
	)
	log.Println("Dropped all tables")
}
