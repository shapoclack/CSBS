package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type CategoryRepository interface {
	GetAll() ([]models.WorkspaceCategory, error)
}

type categoryRepositoryImpl struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepositoryImpl{db: db}
}

func (r *categoryRepositoryImpl) GetAll() ([]models.WorkspaceCategory, error) {
	var categories []models.WorkspaceCategory
	err := r.db.Find(&categories).Error
	return categories, err
}
