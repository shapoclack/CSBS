package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type WorkspaceRepository interface {
	GetAll() ([]models.Workspace, error)
	GetByID(id uint) (*models.Workspace, error)
	Create(workspace *models.Workspace) error
	Update(workspace *models.Workspace) error
	Delete(id uint) error
}

type WorkspaceRepositoryImpl struct {
	db *gorm.DB
}

func NewWorkspaceRepository(db *gorm.DB) WorkspaceRepository {
	return &WorkspaceRepositoryImpl{db: db}
}

func (r *WorkspaceRepositoryImpl) GetAll() ([]models.Workspace, error) {
	var workspaces []models.Workspace
	err := r.db.Preload("Category").Preload("Location").Find(&workspaces).Error

	return workspaces, err
}
func (r *WorkspaceRepositoryImpl) GetByID(id uint) (*models.Workspace, error) {
	var workspace models.Workspace
	err := r.db.Preload("Category").Preload("Location").First(&workspace, id).Error
	return &workspace, err
}
func (r *WorkspaceRepositoryImpl) Create(workspace *models.Workspace) error {
	return r.db.Create(workspace).Error
}
func (r *WorkspaceRepositoryImpl) Update(workspace *models.Workspace) error {
	return r.db.Save(workspace).Error
}
func (r *WorkspaceRepositoryImpl) Delete(id uint) error {
	// GORM делает soft delete: помечает запись как удалённую (DeletedAt), но не стирает физически
	return r.db.Delete(&models.Workspace{}, id).Error
}
