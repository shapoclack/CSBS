package repository

import (
	"csbs/backend/internal/models"
	"time"

	"gorm.io/gorm"
)

type ReservationRepository interface {
	Create(reservation *models.Reservation) error
	GetByUserID(userID uint) ([]models.Reservation, error)
	HasConflict(workspaceID uint, startTime, endTime time.Time) (bool, error)
}
type reservationRepositoryImpl struct {
	db *gorm.DB
}

func NewReservationRepository(db *gorm.DB) ReservationRepository {
	return &reservationRepositoryImpl{db: db}
}
func (r *reservationRepositoryImpl) Create(reservation *models.Reservation) error {
	return r.db.Create(reservation).Error
}

// GetByUserID — получить все бронирования пользователя
func (r *reservationRepositoryImpl) GetByUserID(userID uint) ([]models.Reservation, error) {
	var reservations []models.Reservation
	err := r.db.Where("user_id = ?", userID).
		Preload("Workspace").
		Preload("Tariff").
		Find(&reservations).Error
	return reservations, err
}

// HasConflict — проверить, нет ли пересечения по времени для данного места
func (r *reservationRepositoryImpl) HasConflict(workspaceID uint, startTime, endTime time.Time) (bool, error) {
	var count int64
	err := r.db.Model(&models.Reservation{}).
		Where("workspace_id = ? AND start_time < ? AND end_time > ?", workspaceID, endTime, startTime).
		Count(&count).Error
	return count > 0, err
}
