package models

import "gorm.io/gorm"

type User struct {
	gorm.Model

	RoleID       uint
	Role         Role   `gorm:"foreignKey:RoleID"`
	FullName     string `gorm:"size:255;not null"`
	Email        string `gorm:"size:255;not null;unique"`
	Phone        string `gorm:"size:50"`
	PasswordHash string `gorm:"size:255;not null"`
	Status       string `gorm:"size:50;default:'активирован'"`
}
