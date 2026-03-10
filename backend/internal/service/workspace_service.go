package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
)

type WorkspaceService interface {
	GetAllWorkspaces() ([]models.Workspace, error)
}

type WorkspaceServiceImpl struct {
	repo repository.WorkspaceRepository
}

func NewWorkspaceService(repo repository.WorkspaceRepository) WorkspaceService {
	return &WorkspaceServiceImpl{repo: repo}
}

func (s *WorkspaceServiceImpl) GetAllWorkspaces() ([]models.Workspace, error) {
	return s.repo.GetAll()
}
