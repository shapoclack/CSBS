package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
	ServerPort   string
	GeminiAPIKey string // Наш новый секретный ключ!
}

// Load - загружает переменные из .env файла и возвращает структуру Config
func Load() *Config {
	// Пытаемся загрузить .env, но если файла нет (например, на проде),
	// то просто игнорируем ошибку и читаем системные переменные
	if err := godotenv.Load(); err != nil {
		log.Println("Не удалось найти файл .env. Используются системные переменные окружения")
	}

	return &Config{
		DBHost:       os.Getenv("DB_HOST"),
		DBPort:       os.Getenv("DB_PORT"),
		DBUser:       os.Getenv("DB_USER"),
		DBPassword:   os.Getenv("DB_PASSWORD"),
		DBName:       os.Getenv("DB_NAME"),
		ServerPort:   os.Getenv("SERVER_PORT"),
		GeminiAPIKey: os.Getenv("GEMINI_API_KEY"),
	}
}
