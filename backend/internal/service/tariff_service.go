package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
)

type TariffService interface {
	GetAll() ([]models.Tariff, error)
	CreateTariff(tariff *models.Tariff) error
	UpdateTariff(tariff *models.Tariff) error
	DeleteTariff(id uint) error
}

type tariffServiceImpl struct {
	repo repository.TariffRepository
}

func NewTariffService(repo repository.TariffRepository) TariffService {
	return &tariffServiceImpl{repo: repo}
}

func (s *tariffServiceImpl) GetAll() ([]models.Tariff, error) {
	return s.repo.GetAll()
}

func (s *tariffServiceImpl) CreateTariff(tariff *models.Tariff) error {
	return s.repo.Create(tariff)
}

func (s *tariffServiceImpl) UpdateTariff(tariff *models.Tariff) error {
	return s.repo.Update(tariff)
}

func (s *tariffServiceImpl) DeleteTariff(id uint) error {
	return s.repo.Delete(id)
}
