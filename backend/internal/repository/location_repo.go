package repository

import (
	"csbs/backend/internal/models"
	"gorm.io/gorm"
)

type LocationRepository interface {
	GetAll() ([]models.Location, error)
	GetByID(id uint) (*models.Location, error)
}

type locationRepository struct {
	db *gorm.DB
}

func NewLocationRepository(db *gorm.DB) LocationRepository {
	return &locationRepository{db: db}
}

func (r *locationRepository) GetAll() ([]models.Location, error) {
	var locations []models.Location
	err := r.db.Find(&locations).Error
	return locations, err
}

func (r *locationRepository) GetByID(id uint) (*models.Location, error) {
	var location models.Location
	err := r.db.First(&location, id).Error
	return &location, err
}
