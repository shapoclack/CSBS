package service

import (
	"bufio"
	"os"
	"time"

	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
)

type AuditLogService interface {
	LogAction(userID uint, action, entityType string, entityID uint) error
	GetAllLogs() ([]string, error)
}

type auditLogServiceImpl struct {
	repo repository.AuditRepository
}

func NewAuditLogService(repo repository.AuditRepository) AuditLogService {
	return &auditLogServiceImpl{repo: repo}
}

func (s *auditLogServiceImpl) LogAction(userID uint, action, entityType string, entityID uint) error {
	log := &models.AuditLog{
		UserID:     userID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Timestamp:  time.Now(),
	}
	return s.repo.Create(log)
}

func (s *auditLogServiceImpl) GetAllLogs() ([]string, error) {
	file, err := os.Open("server.log")
	if err != nil {
		if os.IsNotExist(err) {
			return []string{"server.log not found"}, nil
		}
		return nil, err
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	// Возвращаем последние 100 строк
	if len(lines) > 100 {
		lines = lines[len(lines)-100:]
	}
	
	// Разворачиваем, чтобы новые были сверху (как в обычном терминале снизу — тут сами решат)
	// Для эффекта консоли лучше возвращать как есть, новые внизу
	return lines, nil
}
