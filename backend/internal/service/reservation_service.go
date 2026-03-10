package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"errors"
	"time"
)

type ReservationService interface {
	CreateReservation(userID, workspaceID, tariffID uint, startTime, endTime time.Time) (*models.Reservation, error)
	GetUserReservations(userID uint) ([]models.Reservation, error)
}
type reservationServiceImpl struct {
	repo repository.ReservationRepository
}

func NewReservationService(repo repository.ReservationRepository) ReservationService {
	return &reservationServiceImpl{repo: repo}
}
func (s *reservationServiceImpl) CreateReservation(userID, workspaceID, tariffID uint, startTime, endTime time.Time) (*models.Reservation, error) {
	// Проверяем, не занято ли место на это время
	conflict, err := s.repo.HasConflict(workspaceID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	if conflict {
		return nil, errors.New("это место уже забронировано на выбранное время")
	}
	reservation := &models.Reservation{
		UserID:      userID,
		WorkspaceID: workspaceID,
		TariffID:    tariffID,
		StartTime:   startTime,
		EndTime:     endTime,
		Status:      "подтверждено",
	}
	err = s.repo.Create(reservation)
	return reservation, err
}
func (s *reservationServiceImpl) GetUserReservations(userID uint) ([]models.Reservation, error) {
	return s.repo.GetByUserID(userID)
}
