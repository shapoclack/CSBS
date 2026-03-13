package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type TariffRepository interface {
	GetAll() ([]models.Tariff, error)
	GetByID(id uint) (*models.Tariff, error)
	Create(tariff *models.Tariff) error
	Update(tariff *models.Tariff) error
	Delete(id uint) error
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

func (r *tariffRepositoryImpl) GetByID(id uint) (*models.Tariff, error) {
	var tariff models.Tariff
	err := r.db.First(&tariff, id).Error
	if err != nil {
		return nil, err
	}
	return &tariff, nil
}

func (r *tariffRepositoryImpl) Create(tariff *models.Tariff) error {
	return r.db.Create(tariff).Error
}

func (r *tariffRepositoryImpl) Update(tariff *models.Tariff) error {
	return r.db.Save(tariff).Error
}

func (r *tariffRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&models.Tariff{}, id).Error
}
