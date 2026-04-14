package service

import (
	"csbs/backend/internal/models"
	"csbs/backend/internal/repository"
	"csbs/backend/pkg/logger"
	"errors"
	"time"
)

type ReservationService interface {
	CreateReservation(userID, workspaceID, tariffID uint, startTime, endTime time.Time) (*models.Reservation, error)
	GetUserReservations(userID uint) ([]models.Reservation, error)
	GetAllReservations() ([]models.Reservation, error)
	GetUnavailableWorkspaceIDs(startTime, endTime time.Time) ([]uint, error)
}
type reservationServiceImpl struct {
	repo      repository.ReservationRepository
	auditRepo repository.AuditRepository
}

func NewReservationService(repo repository.ReservationRepository, auditRepo repository.AuditRepository) ReservationService {
	return &reservationServiceImpl{repo: repo, auditRepo: auditRepo}
}
func (s *reservationServiceImpl) CreateReservation(userID, workspaceID, tariffID uint, startTime, endTime time.Time) (*models.Reservation, error) {
	logger.Info.Printf("Service: Creating reservation for UserID %d, WorkspaceID %d", userID, workspaceID)
	// Проверяем, не занято ли место на это время
	conflict, err := s.repo.HasConflict(workspaceID, startTime, endTime)
	if err != nil {
		return nil, err
	}
	if conflict {
		logger.Warn.Printf("Service: Reservation conflict for WorkspaceID %d from %s to %s", workspaceID, startTime, endTime)
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
		logger.Info.Printf("Service: Successfully created reservation ID %d", reservation.ID)
		s.auditRepo.Create(&models.AuditLog{
			UserID:     userID,
			Action:     "Create Reservation",
			EntityType: "Reservation",
			EntityID:   reservation.ID,
			Timestamp:  time.Now(),
		})
	} else {
		logger.Error.Printf("Service: Error creating reservation: %v", err)
	}
	return reservation, err
}
func (s *reservationServiceImpl) GetUserReservations(userID uint) ([]models.Reservation, error) {
	logger.Info.Printf("Service: Requesting reservations for UserID: %d", userID)
	return s.repo.GetByUserID(userID)
}

func (s *reservationServiceImpl) GetAllReservations() ([]models.Reservation, error) {
	logger.Info.Println("Service: Requesting all reservations (Admin)")
	return s.repo.GetAll()
}

func (s *reservationServiceImpl) GetUnavailableWorkspaceIDs(startTime, endTime time.Time) ([]uint, error) {
	return s.repo.GetUnavailableWorkspaceIDs(startTime, endTime)
}
