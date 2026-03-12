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

type TariffRepositoryImpl struct {
	db *gorm.DB
}

func NewTariffRepository(db *gorm.DB) TariffRepository {
	return &TariffRepositoryImpl{db: db}
}

func (r *TariffRepositoryImpl) GetAll() ([]models.Tariff, error) {
	var tariffs []models.Tariff
	err := r.db.Find(&tariffs).Error
	return tariffs, err
}

func (r *TariffRepositoryImpl) GetByID(id uint) (*models.Tariff, error) {
	var tariff models.Tariff
	err := r.db.First(&tariff, id).Error
	return &tariff, err
}

func (r *TariffRepositoryImpl) Create(tariff *models.Tariff) error {
	return r.db.Create(tariff).Error
}

func (r *TariffRepositoryImpl) Update(tariff *models.Tariff) error {
	return r.db.Save(tariff).Error
}

func (r *TariffRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&models.Tariff{}, id).Error
}
