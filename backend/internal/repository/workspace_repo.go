package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type WorkspaceRepository interface {
	GetAll() ([]models.Workspace, error)
}

type WorkspaceRepositoryImpl struct {
	db *gorm.DB
}

func NewWorkspaceRepository(db *gorm.DB) WorkspaceRepository {
	return &WorkspaceRepositoryImpl{db: db}
}

func (r *WorkspaceRepositoryImpl) GetAll() ([]models.Workspace, error) {
	var workspaces []models.Workspace
	err := r.db.Preload("Category").Find(&workspaces).Error

	return workspaces, err
}
