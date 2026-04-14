package repository

import (
	"csbs/backend/internal/models"
	"time"

	"gorm.io/gorm"
)

type ReservationRepository interface {
	Create(reservation *models.Reservation) error
	GetByID(id uint) (*models.Reservation, error)
	GetByUserID(userID uint) ([]models.Reservation, error)
	GetAll() ([]models.Reservation, error)
	Update(reservation *models.Reservation) error
	Delete(id uint) error
	HasConflict(workspaceID uint, startTime, endTime time.Time) (bool, error)
	HasConflictExcluding(workspaceID uint, startTime, endTime time.Time, excludeID uint) (bool, error)
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

// GetByID — получить бронирование по ID
func (r *reservationRepositoryImpl) GetByID(id uint) (*models.Reservation, error) {
	var reservation models.Reservation
	err := r.db.
		Preload("User").
		Preload("Workspace").
		Preload("Tariff").
		First(&reservation, id).Error
	if err != nil {
		return nil, err
	}
	return &reservation, nil
}

// Update — обновить бронирование
func (r *reservationRepositoryImpl) Update(reservation *models.Reservation) error {
	return r.db.Save(reservation).Error
}

// Delete — удалить бронирование (мягкое удаление gorm.Model)
func (r *reservationRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&models.Reservation{}, id).Error
}

// HasConflict — проверить, нет ли пересечения по времени для данного места
func (r *reservationRepositoryImpl) HasConflict(workspaceID uint, startTime, endTime time.Time) (bool, error) {
	var count int64
	err := r.db.Model(&models.Reservation{}).
		Where("workspace_id = ? AND start_time < ? AND end_time > ? AND status != 'отменено'", workspaceID, endTime, startTime).
		Count(&count).Error
	return count > 0, err
}

// HasConflictExcluding — то же что HasConflict, но игнорирует бронь с указанным ID (для редактирования)
func (r *reservationRepositoryImpl) HasConflictExcluding(workspaceID uint, startTime, endTime time.Time, excludeID uint) (bool, error) {
	var count int64
	err := r.db.Model(&models.Reservation{}).
		Where("workspace_id = ? AND start_time < ? AND end_time > ? AND status != 'отменено' AND id != ?", workspaceID, endTime, startTime, excludeID).
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
