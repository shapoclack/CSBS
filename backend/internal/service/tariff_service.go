package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"csbs/backend/pkg/logger"
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
	logger.Info.Println("Service: Requesting all tariffs")
	return s.repo.GetAll()
}

func (s *tariffServiceImpl) CreateTariff(tariff *models.Tariff) error {
	logger.Info.Printf("Service: Creating new tariff: %s\n", tariff.Name)
	return s.repo.Create(tariff)
}

func (s *tariffServiceImpl) UpdateTariff(tariff *models.Tariff) error {
	logger.Info.Printf("Service: Updating tariff ID: %d\n", tariff.ID)
	return s.repo.Update(tariff)
}

func (s *tariffServiceImpl) DeleteTariff(id uint) error {
	logger.Info.Printf("Service: Deleting tariff ID: %d\n", id)
	return s.repo.Delete(id)
}
