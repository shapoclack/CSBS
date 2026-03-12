package gemini

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// GeminiClient - структура нашего клиента
type GeminiClient struct {
	apiKey string
	client *http.Client
}

// NewClient - конструктор
func NewClient(apiKey string) *GeminiClient {
	return &GeminiClient{
		apiKey: apiKey,
		client: &http.Client{},
	}
}

// geminiRequest - структура запроса для Gemini 2.0 API
type geminiRequest struct {
	Contents []geminiContent `json:"contents"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

// GenerateContent - отправляет промпт и возвращает ответ текстом
func (c *GeminiClient) GenerateContent(prompt string) (string, error) {
	// URL для модели gemini-2.0-flash
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=%s", c.apiKey)

	// Формируем тело запроса
	reqBody := geminiRequest{
		Contents: []geminiContent{
			{
				Parts: []geminiPart{
					{Text: prompt},
				},
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("ошибка при сериализации JSON: %w", err)
	}

	// Делаем POST запрос
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("ошибка создания HTTP запроса: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	// Отправляем
	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("ошибка выполнения HTTP запроса: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("ошибка чтения ответа: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ошибка API (статус %d): %s", resp.StatusCode, string(bodyBytes))
	}

	// Парсим ответ (очень базовая структура, чтобы вытащить текст)
	var responseData struct {
		Candidates []struct {
			Content struct {
				Parts []struct {
					Text string `json:"text"`
				} `json:"parts"`
			} `json:"content"`
		} `json:"candidates"`
	}

	if err := json.Unmarshal(bodyBytes, &responseData); err != nil {
		return "", fmt.Errorf("ошибка десериализации ответа: %w\nТело: %s", err, string(bodyBytes))
	}

	// Вытаскиваем текстовый ответ, если он есть
	if len(responseData.Candidates) > 0 && len(responseData.Candidates[0].Content.Parts) > 0 {
		return responseData.Candidates[0].Content.Parts[0].Text, nil
	}

	return "", fmt.Errorf("пустой ответ от Gemini")
}
