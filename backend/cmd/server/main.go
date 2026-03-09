package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello World"))
	})

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080"
	}
	serverAdress := ":" + port
	log.Printf("Server started at %s", serverAdress)

	err = http.ListenAndServe(serverAdress, nil)
	if err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
