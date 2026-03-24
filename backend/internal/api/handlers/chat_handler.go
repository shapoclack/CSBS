package handlers

import (
	"csbs/backend/pkg/gemini"
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
)

type ChatHandler struct {
	geminiClient *gemini.GeminiClient
}

func NewChatHandler(geminiClient *gemini.GeminiClient) *ChatHandler {
	return &ChatHandler{geminiClient: geminiClient}
}

func (h *ChatHandler) Routes() http.Handler {
	r := chi.NewRouter()
	
	r.Use(AuthMiddleware)
	
	r.Post("/", h.handleChat)
	return r
}

type chatRequest struct {
	Message string `json:"message"`
}

type chatResponse struct {
	Reply string `json:"reply"`
}

func (h *ChatHandler) handleChat(w http.ResponseWriter, r *http.Request) {
	var req chatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	reply, err := h.geminiClient.GenerateContent(req.Message)
	if err != nil {
		http.Error(w, "Failed to generate content: "+err.Error(), http.StatusInternalServerError)
		return
	}

	res := chatResponse{Reply: reply}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
