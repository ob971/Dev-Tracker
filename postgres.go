package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var db *sql.DB

// Database configuration
type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
}

// Initialize database connection
func initDB() error {
	config := DBConfig{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "password"),
		DBName:   getEnv("DB_NAME", "dev_tracker"),
	}

	// First, connect to default postgres database to create our database if it doesn't exist
	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=postgres sslmode=disable",
		config.Host, config.Port, config.User, config.Password)

	tempDB, err := sql.Open("postgres", psqlInfo)
	if err != nil {
		return fmt.Errorf("error opening temp database connection: %v", err)
	}
	defer tempDB.Close()

	// Create database if it doesn't exist
	_, err = tempDB.Exec(fmt.Sprintf("CREATE DATABASE %s", config.DBName))
	if err != nil {
		// Check if error is "database already exists"
		if !isDBExistsError(err) {
			log.Printf("Warning: Could not create database: %v", err)
		} else {
			log.Printf("Database '%s' already exists", config.DBName)
		}
	} else {
		log.Printf("Database '%s' created successfully", config.DBName)
	}

	// Connect to our specific database
	psqlInfo = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		config.Host, config.Port, config.User, config.Password, config.DBName)

	db, err = sql.Open("postgres", psqlInfo)
	if err != nil {
		return fmt.Errorf("error opening database connection: %v", err)
	}

	// Test the connection
	err = db.Ping()
	if err != nil {
		return fmt.Errorf("error connecting to database: %v", err)
	}

	log.Println("Successfully connected to database")

	// Create tables
	err = createTables()
	if err != nil {
		return fmt.Errorf("error creating tables: %v", err)
	}

	// Insert sample data
	err = insertSampleData()
	if err != nil {
		return fmt.Errorf("error inserting sample data: %v", err)
	}

	return nil
}

// Create all necessary tables
func createTables() error {
	tables := []string{
		`CREATE TABLE IF NOT EXISTS developers (
			id SERIAL PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			avatar VARCHAR(255),
			done INTEGER DEFAULT 0,
			quick_fix TEXT,
			primary_task TEXT,
			secondary_task TEXT,
			status VARCHAR(20) DEFAULT 'active',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS backlog (
			id SERIAL PRIMARY KEY,
			task TEXT NOT NULL,
			priority VARCHAR(20) DEFAULT 'medium',
			estimated_hours INTEGER DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS activity_log (
			id SERIAL PRIMARY KEY,
			date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			name VARCHAR(100) NOT NULL,
			task_type VARCHAR(50),
			task_name TEXT,
			type VARCHAR(20) DEFAULT 'completion'
		)`,
		`CREATE TABLE IF NOT EXISTS chat_threads (
			id SERIAL PRIMARY KEY,
			chat_key VARCHAR(100) NOT NULL,
			who VARCHAR(50) NOT NULL,
			msg TEXT NOT NULL,
			timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			customer VARCHAR(100)
		)`,
	}

	for i, tableSQL := range tables {
		_, err := db.Exec(tableSQL)
		if err != nil {
			return fmt.Errorf("error creating table %d: %v", i+1, err)
		}
		log.Printf("✓ Table %d created successfully", i+1)
	}

	return nil
}

// Insert sample data
func insertSampleData() error {
	// Sample developers
	developers := []struct {
		name, avatar, quickFix, primaryTask, secondaryTask, status string
		done                                                       int
	}{
		{"Jane", "https://i.pravatar.cc/40?img=1", "Login bug", "Refactor Auth", "Optimize DB", "active", 7},
		{"Mike", "https://i.pravatar.cc/40?img=2", "UI glitch", "Build API", "Write tests", "active", 3},
		{"Sara", "https://i.pravatar.cc/40?img=3", "Navbar flicker", "New dashboard", "Clean CSS", "busy", 5},
		{"Liam", "https://i.pravatar.cc/40?img=4", "404 page issue", "Deploy flow", "Docker cleanup", "active", 2},
	}

	for _, dev := range developers {
		_, err := db.Exec(`
			INSERT INTO developers (name, avatar, done, quick_fix, primary_task, secondary_task, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT DO NOTHING
		`, dev.name, dev.avatar, dev.done, dev.quickFix, dev.primaryTask, dev.secondaryTask, dev.status)
		if err != nil {
			return fmt.Errorf("error inserting developer %s: %v", dev.name, err)
		}
	}
	log.Println("✓ Sample developers inserted")

	// Sample backlog items
	backlogItems := []struct {
		task, priority string
		estimatedHours int
	}{
		{"Fix dark mode", "medium", 4},
		{"Style guide", "low", 8},
		{"Audit logging", "high", 6},
		{"User search", "medium", 3},
	}

	for _, item := range backlogItems {
		_, err := db.Exec(`
			INSERT INTO backlog (task, priority, estimated_hours)
			VALUES ($1, $2, $3)
			ON CONFLICT DO NOTHING
		`, item.task, item.priority, item.estimatedHours)
		if err != nil {
			return fmt.Errorf("error inserting backlog item %s: %v", item.task, err)
		}
	}
	log.Println("✓ Sample backlog items inserted")

	// Sample activity log entries
	activityLogs := []struct {
		name, taskType, taskName, logType string
	}{
		{"System", "setup", "Database initialized", "system"},
		{"Jane", "completion", "Login bug", "completion"},
		{"Mike", "completion", "UI glitch", "completion"},
	}

	for _, log := range activityLogs {
		_, err := db.Exec(`
			INSERT INTO activity_log (name, task_type, task_name, type)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT DO NOTHING
		`, log.name, log.taskType, log.taskName, log.logType)
		if err != nil {
			return fmt.Errorf("error inserting activity log for %s: %v", log.name, err)
		}
	}
	log.Println("✓ Sample activity log entries inserted")

	return nil
}

// Helper function to get environment variable with default
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Helper function to check if error is "database already exists"
func isDBExistsError(err error) bool {
	// PostgreSQL error code for "duplicate_database"
	return err != nil && (err.Error() == "pq: database \"dev_tracker\" already exists" ||
		err.Error() == "pq: database \"dev_tracker\" already exists (SQLSTATE 42P04)")
} 