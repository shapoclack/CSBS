package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"csbs/backend/pkg/logger"
)

type CategoryService interface {
	GetAllCategories() ([]models.WorkspaceCategory, error)
}

type categoryServiceImpl struct {
	repo repository.CategoryRepository
}

func NewCategoryService(repo repository.CategoryRepository) CategoryService {
	return &categoryServiceImpl{repo: repo}
}

func (s *categoryServiceImpl) GetAllCategories() ([]models.WorkspaceCategory, error) {
	logger.Info.Println("Service: Requesting all workspace categories")
	return s.repo.GetAll()
}
