package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
)

type WorkspaceService interface {
	GetAllWorkspaces() ([]models.Workspace, error)
	CreateWorkspace(workspace *models.Workspace) error
	UpdateWorkspace(workspace *models.Workspace) error
	DeleteWorkspace(id uint) error
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
func (s *WorkspaceServiceImpl) CreateWorkspace(workspace *models.Workspace) error {
	return s.repo.Create(workspace)
}
func (s *WorkspaceServiceImpl) UpdateWorkspace(workspace *models.Workspace) error {
	// Здесь в будущем можно добавить проверки бизнес-логики (например, capacity > 0)
	return s.repo.Update(workspace)
}
func (s *WorkspaceServiceImpl) DeleteWorkspace(id uint) error {
	return s.repo.Delete(id)
}
