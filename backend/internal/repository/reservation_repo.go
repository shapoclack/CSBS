package repository

import (
	"csbs/backend/internal/models"
	"time"

	"gorm.io/gorm"
)

type ReservationRepository interface {
	Create(reservation *models.Reservation) error
	GetByUserID(userID uint) ([]models.Reservation, error)
	GetAll() ([]models.Reservation, error)
	HasConflict(workspaceID uint, startTime, endTime time.Time) (bool, error)
	GetUnavailableWorkspaceIDs(startTime, endTime time.Time) ([]uint, error)
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

func (r *reservationRepositoryImpl) GetAll() ([]models.Reservation, error) {
	var reservations []models.Reservation
	err := r.db.
		Preload("User").
		Preload("Workspace").
		Preload("Tariff").
		Order("created_at desc").
		Find(&reservations).Error
	return reservations, err
}

// HasConflict — проверить, нет ли пересечения по времени для данного места
func (r *reservationRepositoryImpl) HasConflict(workspaceID uint, startTime, endTime time.Time) (bool, error) {
	var count int64
	err := r.db.Model(&models.Reservation{}).
		Where("workspace_id = ? AND start_time < ? AND end_time > ? AND status != 'отменено'", workspaceID, endTime, startTime).
		Count(&count).Error
	return count > 0, err
}

// GetUnavailableWorkspaceIDs возвращает массив ID рабочих мест, которые заняты в указанный промежуток
func (r *reservationRepositoryImpl) GetUnavailableWorkspaceIDs(startTime, endTime time.Time) ([]uint, error) {
	var ids []uint
	err := r.db.Model(&models.Reservation{}).
		Where("start_time < ? AND end_time > ? AND status != 'отменено'", endTime, startTime).
		Pluck("DISTINCT workspace_id", &ids).Error
	return ids, err
}
