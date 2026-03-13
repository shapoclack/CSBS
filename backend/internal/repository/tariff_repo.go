package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type TariffRepository interface {
	GetAll() ([]models.Tariff, error)
}

type tariffRepositoryImpl struct {
	db *gorm.DB
}

func NewTariffRepository(db *gorm.DB) TariffRepository {
	return &tariffRepositoryImpl{db: db}
}

func (r *tariffRepositoryImpl) GetAll() ([]models.Tariff, error) {
	var tariffs []models.Tariff
	err := r.db.Find(&tariffs).Error
	return tariffs, err
}
