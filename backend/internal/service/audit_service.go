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

func (s *auditLogServiceImpl) GetAllLogs() ([]models.AuditLog, error) {
	return s.repo.GetAll()
}
