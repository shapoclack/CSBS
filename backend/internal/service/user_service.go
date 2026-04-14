package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"csbs/backend/pkg/logger"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type UserService interface {
	Register(name, email, phone, password, requestedRole string) (*models.User, error)
	Login(email, password string) (string, error)
	GetUserByID(id uint) (*models.User, error)
	GetAllUsers() ([]models.User, error)
	UpdateUserStatus(id uint, status string) error
	UpdateUserRole(id uint, roleName string) error
}

type userServiceImpl struct {
	repo      repository.UserRepository
	auditRepo repository.AuditRepository
}

func NewUserService(repo repository.UserRepository, auditRepo repository.AuditRepository) UserService {
	return &userServiceImpl{repo: repo, auditRepo: auditRepo}
}

func (s *userServiceImpl) Register(name, email, phone, password, requestedRole string) (*models.User, error) {
	logger.Info.Printf("Service: Attempting to register user with email: %s", email)
	// 1. Проверяем, не занят ли email
	existing, _ := s.repo.FindByEmail(email)
	if existing.ID != 0 {
		logger.Warn.Printf("Service: Registration failed, email %s already in use", email)
		return nil, errors.New("пользователь с таким email уже существует")
	}
	// 2. Хэшируем пароль
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	// 3. Создаём пользователя
	roleStr := models.RoleUser
	if requestedRole == "sysadmin" {
		roleStr = models.RoleSystemAdmin
	} else if requestedRole == "manager" {
		roleStr = models.RoleCoworkAdmin
	}

	role, err := s.repo.FindRoleByName(roleStr)
	if err != nil {
		role, _ = s.repo.FindRoleByName(models.RoleUser)
	}

	user := &models.User{
		FullName:     name,
		Email:        email,
		Phone:        phone,
		PasswordHash: string(hashedPassword),
		Status:       "активен",
		RoleID:       &role.ID,
	}
	err = s.repo.Create(user)
	if err == nil {
		logger.Info.Printf("Service: Successfully registered user with email: %s", email)
	} else {
		logger.Error.Printf("Service: Failed to register user %s: %v", email, err)
	}
	return user, err
}

func (s *userServiceImpl) Login(email, password string) (string, error) {
	logger.Info.Printf("Service: Login attempt for email: %s", email)
	// 1. Ищем пользователя по email
	user, err := s.repo.FindByEmail(email)
	if err != nil {
		logger.Warn.Printf("Service: Login failed for %s - user not found", email)
		return "", errors.New("неверный email или пароль")
	}
	// 2. Сравниваем хэш пароля с введённым паролем
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		logger.Warn.Printf("Service: Login failed for %s - invalid password", email)
		return "", errors.New("неверный email или пароль")
	}
	logger.Info.Printf("Service: User %s logged in successfully", email)
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

func (s *userServiceImpl) GetUserByID(id uint) (*models.User, error) {
	logger.Info.Printf("Service: Fetching user by ID: %d", id)
	user, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("пользователь не найден")
	}
	// Hide sensitive info like password hash
	user.PasswordHash = ""
	return user, nil
}

func (s *userServiceImpl) GetAllUsers() ([]models.User, error) {
	logger.Info.Println("Service: Requesting all users")
	return s.repo.GetAll()
}

func (s *userServiceImpl) UpdateUserStatus(id uint, status string) error {
	user, err := s.repo.FindByID(id)
	if err != nil {
		return err
	}
	user.Status = status
	err = s.repo.Update(user)
	if err == nil {
		s.auditRepo.Create(&models.AuditLog{
			Action:     "Update Status",
			EntityType: "User",
			EntityID:   id,
			Timestamp:  time.Now(),
		})
	}
	return err
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

	logger.Info.Printf("Service: Updating role for user %d from role_id=%v to role_id=%d (%s)", id, user.RoleID, newRole.ID, roleName)

	err = s.repo.UpdateColumn(id, "role_id", newRole.ID)
	if err == nil {
		s.auditRepo.Create(&models.AuditLog{
			Action:     "Update Role",
			EntityType: "User",
			EntityID:   id,
			Timestamp:  time.Now(),
		})
	}
	return err
}
