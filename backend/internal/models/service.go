package models

import "gorm.io/gorm"

type Service struct {
	gorm.Model

	Name        string `gorm:"size:255;not null;unique"`
	Description string `gorm:"size:255;not null"`
}
