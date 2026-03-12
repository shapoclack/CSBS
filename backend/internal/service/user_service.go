package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"errors"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(name, email, password string) (*models.User, error)
	Login(email, password string) (string, error)
	GetAllUsers() ([]models.User, error)
	UpdateUserStatus(id uint, status string) error
	UpdateUserRole(id uint, roleName string) error
}
type userServiceImpl struct {
	repo repository.UserRepository
}

func NewUserService(repo repository.UserRepository) UserService {
	return &userServiceImpl{repo: repo}
}
func (s *userServiceImpl) Register(name, email, password string) (*models.User, error) {
	// 1. Проверяем, не занят ли email
	existing, _ := s.repo.FindByEmail(email)
	if existing.ID != 0 {
		return nil, errors.New("пользователь с таким email уже существует")
	}
	// 2. Хэшируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	// 3. Создаём пользователя
	role, err := s.repo.FindRoleByName(models.RoleUser)
	if err != nil {
		return nil, errors.New("базовая роль не найдена (не забудьте про seed)")
	}

	user := &models.User{
		FullName:     name,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Status:       "активен",
		RoleID:       &role.ID,
	}
	err = s.repo.Create(user)
	return user, err
}
func (s *userServiceImpl) Login(email, password string) (string, error) {
	// 1. Ищем пользователя по email
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		return "", errors.New("неверный email или пароль")
	}
	// 2. Сравниваем хэш пароля с введённым паролем
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", errors.New("неверный email или пароль")
	}
	// 3. Генерируем JWT токен
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"email":   user.Email,
		"role":    user.Role.Name,
	})
	// 4. Подписываем токен секретным ключом
	tokenString, err := token.SignedString([]byte("my-secret-key"))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}
func (s *userServiceImpl) GetAllUsers() ([]models.User, error) {
	return s.repo.GetAll()
}
func (s *userServiceImpl) UpdateUserStatus(id uint, status string) error {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	user.Status = status
	return s.repo.Update(user)
}
func (s *userServiceImpl) UpdateUserRole(id uint, roleName string) error {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}

	newRole, err := s.repo.FindRoleByName(roleName)
	if err != nil {
		return errors.New("такой роли не существует")
	}
	user.RoleID = &newRole.ID
	return s.repo.Update(user)
}
