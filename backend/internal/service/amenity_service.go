package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"csbs/backend/pkg/logger"
)

type AmenityService interface {
	GetAllAmenities() ([]models.Service, error)
}

type amenityServiceImpl struct {
	repo repository.AmenityRepository
}

func NewAmenityService(repo repository.AmenityRepository) AmenityService {
	return &amenityServiceImpl{repo: repo}
}

func (s *amenityServiceImpl) GetAllAmenities() ([]models.Service, error) {
	logger.Info.Println("Service: Requesting all amenities (services)")
	return s.repo.GetAll()
}
