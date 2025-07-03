# Dev Tracker

A full-stack developer task tracking application with React frontend and Go backend.

## Features

- **Developer Management**: Add, edit, and track developers with their tasks
- **Task Tracking**: Primary and secondary task management with quick fixes
- **Backlog Management**: Prioritized task backlog with estimated hours
- **Activity Logging**: Track developer activities and completions
- **Chat Discussions**: Thread-based chat system for team communication
- **Search & Filter**: Find developers and tasks quickly
- **Real-time Updates**: Live data synchronization

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Go with Gorilla Mux router
- **Database**: PostgreSQL
- **API**: RESTful API with JSON responses

## Prerequisites

- Go 1.21+ installed
- PostgreSQL installed and running
- Node.js 18+ (for frontend)

## Setup

### 1. Database Setup

1. Install PostgreSQL if not already installed
2. Create a database named `dev_tracker`
3. Update `config.env` with your database credentials:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=dev_tracker
DB_PASSWORD=your_password
DB_PORT=5432
PORT=3001
```

### 2. Backend Setup

1. Install Go dependencies:
```bash
go mod tidy
```

2. Run the Go backend:
```bash
go run main.go postgres.go
```

The backend will automatically create the database tables and insert sample data on first run.

### 3. Frontend Setup

1. Install frontend dependencies:
```bash
npm install && npm run build
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` and connect to the Go backend on `http://localhost:3001`.

## API Endpoints

### Developers
- `GET /api/developers` - Get all developers
- `POST /api/developers` - Create new developer
- `PUT /api/developers/{id}` - Update developer

### Backlog
- `GET /api/backlog` - Get all backlog items
- `POST /api/backlog` - Create new backlog item
- `DELETE /api/backlog/{id}` - Delete backlog item

### Activity Log
- `GET /api/activity-log` - Get activity log
- `POST /api/activity-log` - Add activity log entry

### Chat Threads
- `GET /api/chat-threads/{chatKey}` - Get chat threads
- `POST /api/chat-threads` - Add chat message

### Health Check
- `GET /api/health` - Health check endpoint

## Development

- **Backend**: The Go server runs on port 3001 by default
- **Frontend**: Vite dev server runs on port 5173
- **Database**: PostgreSQL should be running on port 5432

## Building for Production

1. Build the frontend:
```bash
npm run build
```

2. Build the Go backend:
```bash
go build -o dev-tracker main.go postgres.go
```

3. Run the production binary:
```bash
./dev-tracker
```

## Troubleshooting

- **Database Connection**: Ensure PostgreSQL is running and credentials in `config.env` are correct
- **Port Conflicts**: Check if ports 3001 or 5173 are already in use
- **Go Modules**: Run `go mod tidy` if you encounter module-related errors

## Database Schema

### Developers Table
```sql
CREATE TABLE developers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  avatar VARCHAR(255),
  done INTEGER DEFAULT 0,
  quick_fix TEXT,
  primary_task TEXT,
  secondary_task TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Backlog Table
```sql
CREATE TABLE backlog (
  id SERIAL PRIMARY KEY,
  task TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium',
  estimated_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Activity Log Table
```sql
CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR(100) NOT NULL,
  task_type VARCHAR(50),
  task_name TEXT,
  type VARCHAR(20) DEFAULT 'completion'
);
```

### Chat Threads Table
```sql
CREATE TABLE chat_threads (
  id SERIAL PRIMARY KEY,
  chat_key VARCHAR(100) NOT NULL,
  who VARCHAR(50) NOT NULL,
  msg TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  customer VARCHAR(100)
);
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License. "# Dev-Tracker" 
