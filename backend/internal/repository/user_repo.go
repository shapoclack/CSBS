package repository

import (
	"csbs/backend/internal/models"

	"gorm.io/gorm"
)

type UserRepository interface {
	Create(user *models.User) error
	FindByEmail(email string) (*models.User, error)
	FindByID(id uint) (*models.User, error)
	FindRoleByName(name string) (*models.Role, error)
	GetAll() ([]models.User, error)
	Update(user *models.User) error
	UpdateColumn(id uint, column string, value interface{}) error
}

type userRepositoryImpl struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepositoryImpl{db: db}
}

func (r *userRepositoryImpl) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *userRepositoryImpl) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Role").Where("email = ?", email).First(&user).Error
	if err != nil {
		return &user, err
	}
	return &user, nil
}

func (r *userRepositoryImpl) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Role").First(&user, id).Error
	return &user, err
}

func (r *userRepositoryImpl) FindRoleByName(name string) (*models.Role, error) {
	var role models.Role
	err := r.db.Where("name = ?", name).First(&role).Error
	return &role, err
}

func (r *userRepositoryImpl) GetAll() ([]models.User, error) {
	var users []models.User
	// Вытаскиваем всех юзеров вместе с их ролями, не показывая хэши паролей
	err := r.db.Preload("Role").Omit("password_hash").Find(&users).Error
	return users, err
}

func (r *userRepositoryImpl) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *userRepositoryImpl) UpdateColumn(id uint, column string, value interface{}) error {
	return r.db.Model(&models.User{}).Where("id = ?", id).Update(column, value).Error
}
