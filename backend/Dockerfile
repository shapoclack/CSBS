# syntax=docker/dockerfile:1

FROM golang:1.24-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/server ./cmd/server

FROM alpine:3.20

WORKDIR /app

# tzdata — в коде задан TimeZone=Europe/Moscow
# ca-certificates — для HTTPS-запросов к Gemini
RUN apk add --no-cache tzdata ca-certificates

COPY --from=builder /out/server /app/server
COPY --from=builder /src/workload_model.txt /app/workload_model.txt

EXPOSE 8080
ENTRYPOINT ["/app/server"]
