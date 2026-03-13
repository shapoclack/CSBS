package models

import "gorm.io/gorm"

type Tariff struct {
	gorm.Model

	Name            string  `gorm:"size:255;not null"`
	Price           float64 `gorm:"not null"`
	DurationMinutes int     `gorm:"not null"`

	LocationID uint
	Location   Location `gorm:"foreignKey:LocationID"`
}
