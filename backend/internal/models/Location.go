package models

import "gorm.io/gorm"

type Location struct {
	gorm.Model
	Name    string `gorm:"size:255;not null;unique"`
	Address string `gorm:"size:255;not null"`
}
