package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
)

type TariffService interface {
	GetAllTariffs() ([]models.Tariff, error)
}

type tariffServiceImpl struct {
	repo repository.TariffRepository
}

func NewTariffService(repo repository.TariffRepository) TariffService {
	return &tariffServiceImpl{repo: repo}
}

func (s *tariffServiceImpl) GetAllTariffs() ([]models.Tariff, error) {
	return s.repo.GetAll()
}
