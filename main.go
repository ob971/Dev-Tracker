package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

// Data structures
type Developer struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Avatar    string `json:"avatar"`
	Done      int    `json:"done"`
	QuickFix  string `json:"quickFix"`
	Primary   string `json:"primary"`
	Secondary string `json:"secondary"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt,omitempty"`
}

type BacklogItem struct {
	ID             int    `json:"id"`
	Task           string `json:"task"`
	Priority       string `json:"priority"`
	EstimatedHours int    `json:"estimatedHours"`
	CreatedAt      string `json:"createdAt,omitempty"`
}

type ActivityLog struct {
	ID       int    `json:"id"`
	Date     string `json:"date"`
	Name     string `json:"name"`
	TaskType string `json:"taskType"`
	TaskName string `json:"taskName"`
	Type     string `json:"type"`
}

type ChatThread struct {
	ID        int    `json:"id"`
	ChatKey   string `json:"chatKey"`
	Who       string `json:"who"`
	Msg       string `json:"msg"`
	Timestamp string `json:"timestamp"`
	Customer  string `json:"customer"`
}

// Database models
type DBDeveloper struct {
	ID            int    `db:"id"`
	Name          string `db:"name"`
	Avatar        string `db:"avatar"`
	Done          int    `db:"done"`
	QuickFix      string `db:"quick_fix"`
	PrimaryTask   string `db:"primary_task"`
	SecondaryTask string `db:"secondary_task"`
	Status        string `db:"status"`
	CreatedAt     string `db:"created_at"`
}

type DBBacklog struct {
	ID             int    `db:"id"`
	Task           string `db:"task"`
	Priority       string `db:"priority"`
	EstimatedHours int    `db:"estimated_hours"`
	CreatedAt      string `db:"created_at"`
}

type DBActivityLog struct {
	ID       int    `db:"id"`
	Date     string `db:"date"`
	Name     string `db:"name"`
	TaskType string `db:"task_type"`
	TaskName string `db:"task_name"`
	Type     string `db:"type"`
}

type DBChatThread struct {
	ID        int    `db:"id"`
	ChatKey   string `db:"chat_key"`
	Who       string `db:"who"`
	Msg       string `db:"msg"`
	Timestamp string `db:"timestamp"`
	Customer  string `db:"customer"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load("config.env"); err != nil {
		log.Println("No config.env file found, using default values")
	}

	// Initialize database
	if err := initDB(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Create router
	r := mux.NewRouter()

	// CORS middleware
	r.Use(corsMiddleware)

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	// Health check
	api.HandleFunc("/health", healthCheckHandler).Methods("GET")

	// Developers endpoints
	api.HandleFunc("/developers", getDevelopersHandler).Methods("GET")
	api.HandleFunc("/developers", createDeveloperHandler).Methods("POST")
	api.HandleFunc("/developers/{id}", updateDeveloperHandler).Methods("PUT")

	// Backlog endpoints
	api.HandleFunc("/backlog", getBacklogHandler).Methods("GET")
	api.HandleFunc("/backlog", createBacklogHandler).Methods("POST")
	api.HandleFunc("/backlog/{id}", deleteBacklogHandler).Methods("DELETE")

	// Activity log endpoints
	api.HandleFunc("/activity-log", getActivityLogHandler).Methods("GET")
	api.HandleFunc("/activity-log", createActivityLogHandler).Methods("POST")

	// Chat threads endpoints
	api.HandleFunc("/chat-threads/{chatKey}", getChatThreadsHandler).Methods("GET")
	api.HandleFunc("/chat-threads", createChatThreadHandler).Methods("POST")

	// Start server
	port := getEnv("PORT", "5000")
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

// CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// Health check handler
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "message": "Go backend is running"})
}

// Developers handlers
func getDevelopersHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, name, avatar, done, quick_fix, primary_task, secondary_task, status, created_at FROM developers ORDER BY id")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var developers []Developer
	for rows.Next() {
		var dev DBDeveloper
		err := rows.Scan(&dev.ID, &dev.Name, &dev.Avatar, &dev.Done, &dev.QuickFix, &dev.PrimaryTask, &dev.SecondaryTask, &dev.Status, &dev.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		developers = append(developers, Developer{
			ID:        dev.ID,
			Name:      dev.Name,
			Avatar:    dev.Avatar,
			Done:      dev.Done,
			QuickFix:  dev.QuickFix,
			Primary:   dev.PrimaryTask,
			Secondary: dev.SecondaryTask,
			Status:    dev.Status,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(developers)
}

func createDeveloperHandler(w http.ResponseWriter, r *http.Request) {
	var dev Developer
	if err := json.NewDecoder(r.Body).Decode(&dev); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var id int
	err := db.QueryRow(`
		INSERT INTO developers (name, avatar, done, quick_fix, primary_task, secondary_task, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`, dev.Name, dev.Avatar, dev.Done, dev.QuickFix, dev.Primary, dev.Secondary, dev.Status).Scan(&id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dev.ID = id
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(dev)
}

func updateDeveloperHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	var dev Developer
	if err := json.NewDecoder(r.Body).Decode(&dev); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	_, err = db.Exec(`
		UPDATE developers 
		SET name = $1, avatar = $2, done = $3, quick_fix = $4, primary_task = $5, secondary_task = $6, status = $7
		WHERE id = $8
	`, dev.Name, dev.Avatar, dev.Done, dev.QuickFix, dev.Primary, dev.Secondary, dev.Status, id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	dev.ID = id
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dev)
}

// Backlog handlers
func getBacklogHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, task, priority, estimated_hours, created_at FROM backlog ORDER BY id")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var backlog []BacklogItem
	for rows.Next() {
		var item DBBacklog
		err := rows.Scan(&item.ID, &item.Task, &item.Priority, &item.EstimatedHours, &item.CreatedAt)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		backlog = append(backlog, BacklogItem{
			ID:             item.ID,
			Task:           item.Task,
			Priority:       item.Priority,
			EstimatedHours: item.EstimatedHours,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(backlog)
}

func createBacklogHandler(w http.ResponseWriter, r *http.Request) {
	var item BacklogItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var id int
	err := db.QueryRow(`
		INSERT INTO backlog (task, priority, estimated_hours)
		VALUES ($1, $2, $3)
		RETURNING id
	`, item.Task, item.Priority, item.EstimatedHours).Scan(&id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	item.ID = id
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

func deleteBacklogHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("DELETE FROM backlog WHERE id = $1", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Activity log handlers
func getActivityLogHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, date, name, task_type, task_name, type FROM activity_log ORDER BY date DESC")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var activityLog []ActivityLog
	for rows.Next() {
		var log DBActivityLog
		err := rows.Scan(&log.ID, &log.Date, &log.Name, &log.TaskType, &log.TaskName, &log.Type)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		activityLog = append(activityLog, ActivityLog{
			ID:       log.ID,
			Date:     log.Date,
			Name:     log.Name,
			TaskType: log.TaskType,
			TaskName: log.TaskName,
			Type:     log.Type,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(activityLog)
}

func createActivityLogHandler(w http.ResponseWriter, r *http.Request) {
	var log ActivityLog
	if err := json.NewDecoder(r.Body).Decode(&log); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var id int
	err := db.QueryRow(`
		INSERT INTO activity_log (name, task_type, task_name, type)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, log.Name, log.TaskType, log.TaskName, log.Type).Scan(&id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.ID = id
	log.Date = time.Now().Format("2006-01-02T15:04:05Z")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(log)
}

// Chat threads handlers
func getChatThreadsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	chatKey := vars["chatKey"]

	rows, err := db.Query("SELECT id, chat_key, who, msg, timestamp, customer FROM chat_threads WHERE chat_key = $1 ORDER BY timestamp", chatKey)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var threads []ChatThread
	for rows.Next() {
		var thread DBChatThread
		err := rows.Scan(&thread.ID, &thread.ChatKey, &thread.Who, &thread.Msg, &thread.Timestamp, &thread.Customer)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		threads = append(threads, ChatThread{
			ID:        thread.ID,
			ChatKey:   thread.ChatKey,
			Who:       thread.Who,
			Msg:       thread.Msg,
			Timestamp: thread.Timestamp,
			Customer:  thread.Customer,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(threads)
}

func createChatThreadHandler(w http.ResponseWriter, r *http.Request) {
	var thread ChatThread
	if err := json.NewDecoder(r.Body).Decode(&thread); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var id int
	err := db.QueryRow(`
		INSERT INTO chat_threads (chat_key, who, msg, customer)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, thread.ChatKey, thread.Who, thread.Msg, thread.Customer).Scan(&id)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	thread.ID = id
	thread.Timestamp = time.Now().Format("2006-01-02T15:04:05Z")
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(thread)
}
