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
	GetUserByID(id uint) (*models.User, error)
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
	// 2. Хэшируем пароль (НИКОГДА не храним пароль в открытом виде!)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	// 3. Создаём пользователя
	user := &models.User{
		FullName:     name,
		Email:        email,
		PasswordHash: string(hashedPassword),
		Status:       "активен",
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
	})
	// 4. Подписываем токен секретным ключом
	tokenString, err := token.SignedString([]byte("my-secret-key"))
	if err != nil {
		return "", err
	}
	return tokenString, nil
}

func (s *userServiceImpl) GetUserByID(id uint) (*models.User, error) {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("пользователь не найден")
	}
	// Hide sensitive info like password hash
	user.PasswordHash = ""
	return user, nil
}
