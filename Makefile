.PHONY: dev build build-linux clean

dev:
	@echo "Starting Go backend on :8080..."
	@go run . &
	@echo "Starting Vite dev server on :5173..."
	@cd web && npm run dev

build:
	@echo "Building frontend..."
	@cd web && npm run build
	@echo "Building Go binary with embedded frontend..."
	@CGO_ENABLED=0 go build -ldflags="-s -w" -o note-app .

build-linux:
	@cd web && npm run build
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o note-app-linux .

clean:
	@rm -f note-app note-app-linux
	@rm -rf web/dist
