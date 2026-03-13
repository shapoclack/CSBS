package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type AuditRepository interface {
	Create(log *models.AuditLog) error
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
