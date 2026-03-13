package models

import "gorm.io/gorm"

type WorkspaceService struct {
	gorm.Model

	WorkspaceID uint
	Workspace   Workspace `gorm:"foreignKey:WorkspaceID"`

	ServiceID uint
	Service   Service `gorm:"foreignKey:ServiceID"`
}
