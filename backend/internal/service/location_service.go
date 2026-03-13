package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"csbs/backend/pkg/logger"
)

type LocationService interface {
	GetAll() ([]models.Location, error)
	GetByID(id uint) (*models.Location, error)
}

type locationService struct {
	repo repository.LocationRepository
}

func NewLocationService(repo repository.LocationRepository) LocationService {
	return &locationService{repo:repo}
}

func (s *locationService) GetAll() ([]models.Location, error) {
	logger.Info.Println("Service: Requesting all locations")
	return s.repo.GetAll()
}

func (s *locationService) GetByID(id uint) (*models.Location, error) {
	logger.Info.Printf("Service: Requesting location by ID: %d\n", id)
	return s.repo.GetByID(id)
}
