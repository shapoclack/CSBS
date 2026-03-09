package models

import "gorm.io/gorm"

type WorkspaceCategory struct {
	gorm.Model
	Name        string `gorm:"size:255;not null;unique"`
	Description string `gorm:"size:255;not null"`
}

type Workspace struct {
	gorm.Model
	CategoryID uint
	Category   WorkspaceCategory `gorm:"foreignKey:CategoryID"`

	NameOrNumber   string    `gorm:"size:100;not null"`
	Capacity       int       `gorm:"not null"`
	IsActive       bool      `gorm:"not null;default:true"`
	MapCoordinates string    `gorm:"size:255"`
	Services       []Service `gorm:"many2many:workspace_services;"`
}
