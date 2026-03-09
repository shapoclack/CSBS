package models

import (
	"time"

	"gorm.io/gorm"
)

type AuditLog struct {
	gorm.Model

	UserID     uint
	User       User   `gorm:"foreignKey:UserID"`
	Action     string `gorm:"size:255;not null"`
	EntityType string `gorm:"size:255;not null"`
	EntityID   uint
	Timestamp  time.Time `gorm:"not null"`
}
