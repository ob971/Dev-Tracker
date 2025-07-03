# Dev Tracker - Go Backend

This is the Go backend for the Dev Tracker application, providing a REST API that connects to PostgreSQL database.

## Prerequisites

- Go 1.21 or higher
- PostgreSQL installed and running
- Git

## Setup Instructions

### 1. Install Go Dependencies

```bash
go mod tidy
```

### 2. Configure Database

1. Make sure PostgreSQL is running on your system
2. Update the `config.env` file with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=dev_tracker
PORT=5000
```

### 3. Run the Go Backend

```bash
go run .
```

The server will:
- Connect to PostgreSQL
- Create the `dev_tracker` database if it doesn't exist
- Create all necessary tables
- Insert sample data
- Start the API server on port 5000

## API Endpoints

### Health Check
- `GET /api/health` - Check if the server is running

### Developers
- `GET /api/developers` - Get all developers
- `POST /api/developers` - Create a new developer
- `PUT /api/developers/{id}` - Update a developer

### Backlog
- `GET /api/backlog` - Get all backlog items
- `POST /api/backlog` - Create a new backlog item
- `DELETE /api/backlog/{id}` - Delete a backlog item

### Activity Log
- `GET /api/activity-log` - Get activity log entries
- `POST /api/activity-log` - Create a new activity log entry

### Chat Threads
- `GET /api/chat-threads/{chatKey}` - Get chat threads for a specific chat key
- `POST /api/chat-threads` - Create a new chat message

## Database Schema

The application creates the following tables:

### developers
- `id` (SERIAL PRIMARY KEY)
- `name` (VARCHAR(100))
- `avatar` (VARCHAR(255))
- `done` (INTEGER)
- `quick_fix` (TEXT)
- `primary_task` (TEXT)
- `secondary_task` (TEXT)
- `status` (VARCHAR(20))
- `created_at` (TIMESTAMP)

### backlog
- `id` (SERIAL PRIMARY KEY)
- `task` (TEXT)
- `priority` (VARCHAR(20))
- `estimated_hours` (INTEGER)
- `created_at` (TIMESTAMP)

### activity_log
- `id` (SERIAL PRIMARY KEY)
- `date` (TIMESTAMP)
- `name` (VARCHAR(100))
- `task_type` (VARCHAR(50))
- `task_name` (TEXT)
- `type` (VARCHAR(20))

### chat_threads
- `id` (SERIAL PRIMARY KEY)
- `chat_key` (VARCHAR(100))
- `who` (VARCHAR(50))
- `msg` (TEXT)
- `timestamp` (TIMESTAMP)
- `customer` (VARCHAR(100))

## Frontend Integration

The frontend React application is already configured to communicate with this Go backend. The API service in `src/api.js` points to `http://localhost:5000/api`.

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your database credentials in `config.env`
- Verify the database port (default: 5432)

### Port Issues
- If port 5000 is in use, change the PORT in `config.env`
- Update the frontend API_BASE_URL in `src/api.js` if you change the port

### Go Module Issues
- Run `go mod tidy` to download dependencies
- Ensure you're using Go 1.21 or higher

## Development

To run in development mode with auto-reload:

```bash
# Install air for hot reloading (optional)
go install github.com/cosmtrek/air@latest

# Run with air
air
```

## Production

For production deployment:

```bash
# Build the binary
go build -o dev-tracker-backend .

# Run the binary
./dev-tracker-backend
``` 