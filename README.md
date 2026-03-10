<p align="center">
  <h1 align="center">🏢 CSBS — Coworking Space Booking System</h1>
  <p align="center">
    Система бронирования рабочих мест в коворкинге
    <br />
    <a href="#-архитектура">Архитектура</a> · <a href="#-api-эндпоинты">API</a> · <a href="#-быстрый-старт">Быстрый старт</a>
  </p>
</p>

---

## 📋 О проекте

**CSBS** — это веб-приложение для бронирования рабочих мест в коворкинге. Пользователи могут регистрироваться, просматривать доступные рабочие места и бронировать их на определённое время.

### Ключевые возможности

- 🔐 **Регистрация и авторизация** — безопасная аутентификация через JWT
- 🪑 **Каталог рабочих мест** — просмотр доступных столов и переговорных
- 📅 **Бронирование** — создание и просмотр своих бронирований
- ⏰ **Контроль пересечений** — система не позволит забронировать занятое место
- 🔒 **Защита эндпоинтов** — JWT middleware для авторизованных запросов

---

## 🛠 Технологический стек

| Компонент | Технология |
|:---|:---|
| **Язык** | Go |
| **HTTP-роутер** | [go-chi/chi](https://github.com/go-chi/chi) v5 |
| **База данных** | PostgreSQL |
| **ORM** | [GORM](https://gorm.io/) |
| **Аутентификация** | JWT ([golang-jwt](https://github.com/golang-jwt/jwt)) |
| **Хэширование паролей** | bcrypt |
| **CORS** | [go-chi/cors](https://github.com/go-chi/cors) |

---

## 🏗 Архитектура

Проект построен на **слоистой архитектуре** с чётким разделением ответственностей:

```
HTTP Request
     │
     ▼
┌─────────────────────┐
│   API Handlers       │  ← Обработка HTTP запросов, парсинг JSON
│   (api/handlers)     │
└──────────┬──────────┘
           │
     ▼
┌─────────────────────┐
│   Service Layer      │  ← Бизнес-логика (валидация, хэширование, проверки)
│   (service)          │
└──────────┬──────────┘
           │
     ▼
┌─────────────────────┐
│   Repository Layer   │  ← Работа с БД через GORM
│   (repository)       │
└──────────┬──────────┘
           │
     ▼
┌─────────────────────┐
│   PostgreSQL         │
└─────────────────────┘
```

### Структура проекта

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # Точка входа, инициализация всех слоёв
├── internal/
│   ├── api/
│   │   └── handlers/
│   │       ├── auth_middleware.go      # JWT middleware
│   │       ├── workspace.go           # GET /api/workspaces
│   │       ├── user_handler.go        # POST /register, /login
│   │       └── reservation_handler.go # POST/GET /api/reservations
│   ├── models/
│   │   ├── user.go               # Пользователи
│   │   ├── workspace.go          # Рабочие места и категории
│   │   ├── reservation.go        # Бронирования
│   │   ├── tariff.go             # Тарифы
│   │   ├── role.go               # Роли
│   │   ├── service.go            # Услуги
│   │   └── auditlog.go           # Журнал действий
│   ├── repository/               # Слой работы с БД
│   └── service/                  # Слой бизнес-логики
├── .env                          # Переменные окружения
├── go.mod
└── go.sum
```

---

## 🔌 API Эндпоинты

### Открытые (без авторизации)

| Метод | Путь | Описание |
|:---:|:---|:---|
| `POST` | `/api/users/register` | Регистрация нового пользователя |
| `POST` | `/api/users/login` | Авторизация, получение JWT токена |
| `GET` | `/api/workspaces` | Список всех рабочих мест |

### Защищённые (требуется JWT)

| Метод | Путь | Описание |
|:---:|:---|:---|
| `POST` | `/api/reservations` | Создать бронирование |
| `GET` | `/api/reservations` | Мои бронирования |

#### Пример запроса на регистрацию:
```json
POST /api/users/register
{
  "name": "Иван Иванов",
  "email": "ivan@mail.com",
  "password": "securepassword"
}
```

#### Пример запроса на бронирование:
```json
POST /api/reservations
Authorization: Bearer <JWT_TOKEN>
{
  "workspace_id": 1,
  "tariff_id": 1,
  "start_time": "2026-03-15T10:00:00Z",
  "end_time": "2026-03-15T12:00:00Z"
}
```

---

## 🚀 Быстрый старт

### Требования
- Go 1.21+
- PostgreSQL 15+

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/shapoclack/CSBS.git
cd CSBS/backend

# Настройка окружения
cp .env.example .env
# Отредактируйте .env, указав свои параметры БД

# Установка зависимостей
go mod download

# Запуск сервера
go run ./cmd/server/main.go
```

### Переменные окружения (.env)

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=csbs
SERVER_PORT=8080
```

---

## 🗄 Схема базы данных

```
Users ──────┐
            ├──── Reservations
Workspaces ─┘         │
     │                │
Categories        Tariffs
     │
  Services (M2M)
```

**Основные таблицы:** Users, Roles, Workspaces, WorkspaceCategories, Services, Tariffs, Reservations, AuditLogs

---

## 🗺 Roadmap

- [x] CRUD для рабочих мест
- [x] Регистрация и авторизация (JWT)
- [x] Бронирование с проверкой пересечений
- [x] JWT Middleware для защиты эндпоинтов
- [x] CORS для React-фронтенда
- [ ] Система ролей (Пользователь / Админ коворкинга / Системный администратор)
- [ ] Интеграция с Gemini API для прогнозирования загруженности
- [ ] React-фронтенд с подключением к API
- [ ] Админ-панель управления

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/shapoclack">shapoclack</a>
</p>
