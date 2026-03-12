package service

import (
	"time"

	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
)

type AuditLogService interface {
	LogAction(userID uint, action, entityType string, entityID uint) error
	GetAllLogs() ([]models.AuditLog, error)
}

type AuditLogServiceImpl struct {
	repo repository.AuditLogRepository
}

func NewAuditLogService(repo repository.AuditLogRepository) AuditLogService {
	return &AuditLogServiceImpl{repo: repo}
}

func (s *AuditLogServiceImpl) LogAction(userID uint, action, entityType string, entityID uint) error {
	log := &models.AuditLog{
		UserID:     userID,
		Action:     action,
		EntityType: entityType,
		EntityID:   entityID,
		Timestamp:  time.Now(),
	}
	return s.repo.Create(log)
}

func (s *AuditLogServiceImpl) GetAllLogs() ([]models.AuditLog, error) {
	return s.repo.GetAll()
}
