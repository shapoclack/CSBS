package config

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// EnsureDatabaseExists подключается к дефолтной базе postgres
// и создаёт целевую базу данных, если она ещё не существует.
func EnsureDatabaseExists(cfg *Config) {
	// Подключаемся к дефолтной базе postgres
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=postgres port=%s sslmode=disable",
		cfg.DBHost, cfg.DBUser, cfg.DBPassword, cfg.DBPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to postgres: %v", err)
	}

	// Проверяем, существует ли база данных
	var count int64
	db.Raw("SELECT COUNT(*) FROM pg_database WHERE datname = ?", cfg.DBName).Scan(&count)

	if count == 0 {
		// Создаём базу данных
		createSQL := fmt.Sprintf("CREATE DATABASE %s", cfg.DBName)
		if err := db.Exec(createSQL).Error; err != nil {
			log.Fatalf("Failed to create database %s: %v", cfg.DBName, err)
		}
		log.Printf("Database '%s' created successfully", cfg.DBName)
	} else {
		log.Printf("Database '%s' already exists", cfg.DBName)
	}

	// Закрываем соединение с postgres
	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.Close()
	}
}
