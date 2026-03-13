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
	repo      repository.ReservationRepository
	auditRepo repository.AuditRepository
}

func NewReservationService(repo repository.ReservationRepository, auditRepo repository.AuditRepository) ReservationService {
	return &reservationServiceImpl{repo: repo, auditRepo: auditRepo}
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
	if err == nil {
		s.auditRepo.Create(&models.AuditLog{
			UserID:     userID,
			Action:     "Create Reservation",
			EntityType: "Reservation",
			EntityID:   reservation.ID,
			Timestamp:  time.Now(),
		})
	}
	return reservation, err
}
func (s *reservationServiceImpl) GetUserReservations(userID uint) ([]models.Reservation, error) {
	return s.repo.GetByUserID(userID)
}
