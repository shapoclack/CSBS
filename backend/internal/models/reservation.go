package models

import (
	"time"

	"gorm.io/gorm"
)

type Reservation struct {
	gorm.Model

	UserID uint
	User   User `gorm:"foreignKey:UserID"`

	WorkspaceID uint
	Workspace   Workspace `gorm:"foreignKey:WorkspaceID"`

	TariffID  uint
	Tariff    Tariff    `gorm:"foreignKey:TariffID"`
	StartTime time.Time `gorm:"not null"`
	EndTime   time.Time `gorm:"not null"`
	Status    string    `gorm:"size:255;not null"`
	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
}
