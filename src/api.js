const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Developers API
export const developersAPI = {
  // Get all developers
  getAll: () => apiCall('/developers'),
  
  // Add new developer
  create: (developer) => apiCall('/developers', {
    method: 'POST',
    body: JSON.stringify(developer),
  }),
  
  // Update developer
  update: (id, developer) => apiCall(`/developers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(developer),
  }),
};

// Backlog API
export const backlogAPI = {
  // Get all backlog items
  getAll: () => apiCall('/backlog'),
  
  // Add new backlog item
  create: (item) => apiCall('/backlog', {
    method: 'POST',
    body: JSON.stringify(item),
  }),
  
  // Delete backlog item
  delete: (id) => apiCall(`/backlog/${id}`, {
    method: 'DELETE',
  }),
};

// Activity Log API
export const activityLogAPI = {
  // Get activity log
  getAll: () => apiCall('/activity-log'),
  
  // Add activity log entry
  create: (entry) => apiCall('/activity-log', {
    method: 'POST',
    body: JSON.stringify(entry),
  }),
};

// Chat Threads API
export const chatThreadsAPI = {
  // Get chat threads for a specific chat key
  getByChatKey: (chatKey) => apiCall(`/chat-threads/${chatKey}`),
  
  // Add chat message
  create: (message) => apiCall('/chat-threads', {
    method: 'POST',
    body: JSON.stringify(message),
  }),
};

// Health check
export const healthCheck = () => apiCall('/health');

// Data transformation helpers
export const transformDeveloperFromDB = (dbDeveloper) => ({
  id: dbDeveloper.id,
  name: dbDeveloper.name,
  avatar: dbDeveloper.avatar,
  done: dbDeveloper.done,
  quickFix: dbDeveloper.quick_fix || '',
  primary: dbDeveloper.primary_task || '',
  secondary: dbDeveloper.secondary_task || '',
  status: dbDeveloper.status,
});

export const transformDeveloperToDB = (developer) => ({
  name: developer.name,
  avatar: developer.avatar,
  done: developer.done,
  quick_fix: developer.quickFix,
  primary_task: developer.primary,
  secondary_task: developer.secondary,
  status: developer.status,
});

export const transformBacklogFromDB = (dbBacklog) => ({
  id: dbBacklog.id,
  task: dbBacklog.task,
  priority: dbBacklog.priority,
  estimatedHours: dbBacklog.estimated_hours,
});

export const transformBacklogToDB = (backlog) => ({
  task: backlog.task,
  priority: backlog.priority,
  estimated_hours: backlog.estimatedHours,
});

export const transformActivityLogFromDB = (dbLog) => ({
  id: dbLog.id,
  date: dbLog.date,
  name: dbLog.name,
  taskType: dbLog.task_type,
  taskName: dbLog.task_name,
  type: dbLog.type,
});

export const transformActivityLogToDB = (log) => ({
  name: log.name,
  task_type: log.taskType,
  task_name: log.taskName,
  type: log.type,
});

export const transformChatThreadFromDB = (dbThread) => ({
  id: dbThread.id,
  who: dbThread.who,
  msg: dbThread.msg,
  timestamp: dbThread.timestamp,
  customer: dbThread.customer,
});

export const transformChatThreadToDB = (thread) => ({
  chat_key: thread.chatKey,
  who: thread.who,
  msg: thread.msg,
  customer: thread.customer,
}); 