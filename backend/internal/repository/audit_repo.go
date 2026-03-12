package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type AuditLogRepository interface {
	Create(log *models.AuditLog) error
	GetAll() ([]models.AuditLog, error)
}

type AuditLogRepositoryImpl struct {
	db *gorm.DB
}

func NewAuditLogRepository(db *gorm.DB) AuditLogRepository {
	return &AuditLogRepositoryImpl{db: db}
}

func (r *AuditLogRepositoryImpl) Create(log *models.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *AuditLogRepositoryImpl) GetAll() ([]models.AuditLog, error) {
	var logs []models.AuditLog
	// Сортируем по убыванию даты (сначала новые)
	err := r.db.Order("created_at desc").Find(&logs).Error
	return logs, err
}
