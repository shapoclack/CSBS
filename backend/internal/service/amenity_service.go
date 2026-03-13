package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
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
	return s.repo.GetAll()
}
