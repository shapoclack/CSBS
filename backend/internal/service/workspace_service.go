package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"csbs/backend/pkg/logger"
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
	logger.Info.Println("Service: Requesting all workspaces")
	return s.repo.GetAll()
}
func (s *WorkspaceServiceImpl) CreateWorkspace(workspace *models.Workspace) error {
	logger.Info.Printf("Service: Creating workspace: %s\n", workspace.NameOrNumber)
	return s.repo.Create(workspace)
}
func (s *WorkspaceServiceImpl) UpdateWorkspace(workspace *models.Workspace) error {
	// Здесь в будущем можно добавить проверки бизнес-логики (например, capacity > 0)
	logger.Info.Printf("Service: Updating workspace ID: %d\n", workspace.ID)
	return s.repo.Update(workspace)
}
func (s *WorkspaceServiceImpl) DeleteWorkspace(id uint) error {
	logger.Info.Printf("Service: Deleting workspace ID: %d\n", id)
	return s.repo.Delete(id)
}
