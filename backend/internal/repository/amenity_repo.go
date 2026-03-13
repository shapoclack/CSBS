package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type AmenityRepository interface {
	GetAll() ([]models.Service, error)
}

type amenityRepositoryImpl struct {
	db *gorm.DB
}

func NewAmenityRepository(db *gorm.DB) AmenityRepository {
	return &amenityRepositoryImpl{db: db}
}

func (r *amenityRepositoryImpl) GetAll() ([]models.Service, error) {
	var amenities []models.Service
	err := r.db.Find(&amenities).Error
	return amenities, err
}
