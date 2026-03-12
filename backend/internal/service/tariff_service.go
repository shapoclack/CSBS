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

type TariffServiceImpl struct {
	repo repository.TariffRepository
}

func NewTariffService(repo repository.TariffRepository) TariffService {
	return &TariffServiceImpl{repo: repo}
}

func (s *TariffServiceImpl) GetAll() ([]models.Tariff, error) {
	return s.repo.GetAll()
}

func (s *TariffServiceImpl) CreateTariff(tariff *models.Tariff) error {
	return s.repo.Create(tariff)
}

func (s *TariffServiceImpl) UpdateTariff(tariff *models.Tariff) error {
	return s.repo.Update(tariff)
}

func (s *TariffServiceImpl) DeleteTariff(id uint) error {
	return s.repo.Delete(id)
}
