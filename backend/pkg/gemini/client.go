package gemini

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const (
	requestTimeout = 15 * time.Second
	maxAttempts    = 3
	baseBackoff    = 500 * time.Millisecond
)

// GeminiClient - структура нашего клиента
type GeminiClient struct {
	apiKey string
	client *http.Client
}

// NewClient - конструктор
func NewClient(apiKey string) *GeminiClient {
	// Кастомный DNS из GEMINI_DNS (например "111.88.96.50:53" — xbox-dns.ru).
	// Несколько серверов перечисляются через запятую: "111.88.96.50:53,111.88.96.51:53".
	// Пусто — используется системный резолвер.
	dialer := &net.Dialer{
		Timeout:   5 * time.Second,
		KeepAlive: 30 * time.Second,
	}
	if dnsList := os.Getenv("GEMINI_DNS"); dnsList != "" {
		servers := splitAndTrim(dnsList, ",")
		resolver := &net.Resolver{
			PreferGo: true,
			Dial: func(ctx context.Context, network, _ string) (net.Conn, error) {
				d := net.Dialer{Timeout: 3 * time.Second}
				var lastErr error
				for _, srv := range servers {
					conn, err := d.DialContext(ctx, network, srv)
					if err == nil {
						return conn, nil
					}
					lastErr = err
				}
				return nil, lastErr
			},
		}
		dialer.Resolver = resolver
	}

	transport := &http.Transport{
		DialContext: dialer.DialContext,
	}

	// Прокси из GEMINI_PROXY_URL (http://, https://, socks5://).
	if proxyURL := os.Getenv("GEMINI_PROXY_URL"); proxyURL != "" {
		if u, err := url.Parse(proxyURL); err == nil {
			transport.Proxy = http.ProxyURL(u)
		}
	}

	return &GeminiClient{
		apiKey: apiKey,
		client: &http.Client{
			Timeout:   requestTimeout,
			Transport: transport,
		},
	}
}

func splitAndTrim(s, sep string) []string {
	parts := []string{}
	for _, p := range strings.Split(s, sep) {
		if trimmed := strings.TrimSpace(p); trimmed != "" {
			parts = append(parts, trimmed)
		}
	}
	return parts
}

// isRetriableStatus — 5xx и 429 считаем временными сбоями и ретраим.
func isRetriableStatus(code int) bool {
	return code == http.StatusTooManyRequests || code >= 500
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
	// URL для модели gemini-2.5-flash
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=%s", c.apiKey)

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

	var (
		bodyBytes []byte
		lastErr   error
	)

	for attempt := 1; attempt <= maxAttempts; attempt++ {
		req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
		if err != nil {
			return "", fmt.Errorf("ошибка создания HTTP запроса: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := c.client.Do(req)
		if err != nil {
			// Сетевые ошибки и таймауты — всегда ретраим.
			lastErr = fmt.Errorf("ошибка выполнения HTTP запроса: %w", err)
		} else {
			bodyBytes, err = io.ReadAll(resp.Body)
			resp.Body.Close()
			if err != nil {
				lastErr = fmt.Errorf("ошибка чтения ответа: %w", err)
			} else if resp.StatusCode == http.StatusOK {
				lastErr = nil
				break
			} else {
				lastErr = fmt.Errorf("ошибка API (статус %d): %s", resp.StatusCode, string(bodyBytes))
				if !isRetriableStatus(resp.StatusCode) {
					return "", lastErr
				}
			}
		}

		if attempt < maxAttempts {
			// Экспоненциальный backoff с джиттером: 500ms, 1s, ...
			backoff := baseBackoff * time.Duration(1<<(attempt-1))
			jitter := time.Duration(rand.Int63n(int64(baseBackoff)))
			time.Sleep(backoff + jitter)
		}
	}

	if lastErr != nil {
		return "", lastErr
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
