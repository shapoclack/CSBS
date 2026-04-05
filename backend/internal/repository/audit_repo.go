package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type AuditRepository interface {
	Create(log *models.AuditLog) error
	GetAll() ([]models.AuditLog, error)
}

type auditRepositoryImpl struct {
	db *gorm.DB
}

func NewAuditRepository(db *gorm.DB) AuditRepository {
	return &auditRepositoryImpl{db: db}
}

func (r *auditRepositoryImpl) Create(log *models.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *auditRepositoryImpl) GetAll() ([]models.AuditLog, error) {
	var logs []models.AuditLog
	err := r.db.Preload("User").Order("created_at desc").Find(&logs).Error
	return logs, err
}
