package main

import (
	"csbs/backend/internal/config"
	"csbs/backend/internal/models"
	"fmt"
	"log"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Загружаем конфиг, чтобы использовать единый механизм из internal/config
	cfg := config.Load()

	// Создаём базу данных, если она не существует
	config.EnsureDatabaseExists(cfg)

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Europe/Moscow",
		cfg.DBHost,
		cfg.DBUser,
		cfg.DBPassword,
		cfg.DBName,
		cfg.DBPort,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Print("WARNING: This will drop ALL tables in the database. Are you sure you want to continue? (y/N): ")
	var response string
	fmt.Scanln(&response)
	if response != "y" && response != "Y" && response != "yes" && response != "Yes" && response != "да" && response != "Да" {
		fmt.Println("Operation aborted.")
		return
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
