import { useState, useEffect } from "react";
import { CheckCircle2, Clock, AlertTriangle, Plus, MessageSquare, Undo2, Calendar, User, Activity } from "lucide-react";

const ANIMATION_DURATION = 500;
const UNDO_TIMEOUT = 5000;
const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  high: "bg-red-100 text-red-800 border-red-200"
};

const initialDevs = [
  { 
    id: 1,
    name: "Jane", 
    avatar: "https://i.pravatar.cc/40?img=1", 
    done: 7, 
    quickFix: "Login bug", 
    primary: "Refactor Auth", 
    secondary: "Optimize DB",
    status: "active"
  },
  { 
    id: 2,
    name: "Mike", 
    avatar: "https://i.pravatar.cc/40?img=2", 
    done: 3, 
    quickFix: "UI glitch", 
    primary: "Build API", 
    secondary: "Write tests",
    status: "active"
  },
  { 
    id: 3,
    name: "Sara", 
    avatar: "https://i.pravatar.cc/40?img=3", 
    done: 5, 
    quickFix: "Navbar flicker", 
    primary: "New dashboard", 
    secondary: "Clean CSS",
    status: "busy"
  },
  { 
    id: 4,
    name: "Liam", 
    avatar: "https://i.pravatar.cc/40?img=4", 
    done: 2, 
    quickFix: "404 page issue", 
    primary: "Deploy flow", 
    secondary: "Docker cleanup",
    status: "active"
  }
];

const initialBacklog = [
  { id: 1, task: "Fix dark mode", priority: "medium", estimatedHours: 4 },
  { id: 2, task: "Style guide", priority: "low", estimatedHours: 8 },
  { id: 3, task: "Audit logging", priority: "high", estimatedHours: 6 },
  { id: 4, task: "User search", priority: "medium", estimatedHours: 3 }
];

export default function EnhancedDevTracker() {
  const [devs, setDevs] = useState(initialDevs);
  const [log, setLog] = useState([]);
  const [undo, setUndo] = useState(null);
  const [fade, setFade] = useState({});
  const [newDev, setNewDev] = useState("");
  const [backlog, setBacklog] = useState(initialBacklog);
  const [newBacklog, setNewBacklog] = useState({ task: "", priority: "medium", hours: "" });
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [focusedInput, setFocusedInput] = useState(null);
  const [chatKey, setChatKey] = useState(null);
  const [threads, setThreads] = useState({});
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [quickTask, setQuickTask] = useState({ task: "", priority: "medium", hours: "", assignTo: "" });

  const keyOf = (id, field) => `${id}-${field}`;
  const startFade = (key) => setFade(prev => ({ ...prev, [key]: true }));
  const stopFade = (key) => setFade(prev => { const next = { ...prev }; delete next[key]; return next; });
  
  const getTaskInputClass = (key, value, isFocused) => {
    const baseClasses = "w-full px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300";
    const borderClasses = isFocused ? "border border-gray-200 hover:border-gray-300" : "border border-transparent";
    const fadeClasses = fade[key] && value ? "opacity-50 line-through bg-green-50" : "";
    return `${baseClasses} ${borderClasses} ${fadeClasses}`;
  };

  const complete = (devId, field) => {
    const dev = devs.find(d => d.id === devId);
    const taskName = dev?.[field];
    if (!taskName) return;
    
    const key = keyOf(devId, field);
    if (fade[key]) return;
    
    startFade(key);
    setTimeout(() => {
      const timestamp = new Date().toLocaleString();
      setDevs(prev => {
        const next = [...prev];
        const devIndex = next.findIndex(d => d.id === devId);
        if (devIndex === -1) return prev;
        
        next[devIndex].done += 1;
        if (field === 'primary') {
          next[devIndex].primary = next[devIndex].secondary;
          next[devIndex].secondary = '';
        } else {
          next[devIndex][field] = '';
        }
        return next;
      });
      
      stopFade(key);
      setLog(prev => [...prev, { 
        id: Date.now(),
        date: timestamp, 
        name: dev.name, 
        taskType: field, 
        taskName,
        type: 'completion'
      }]);
      setUndo({ devId, field, taskName });
    }, ANIMATION_DURATION);
  };

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), UNDO_TIMEOUT);
    return () => clearTimeout(timer);
  }, [undo]);

  const handleUndo = () => {
    if (!undo) return;
    stopFade(keyOf(undo.devId, undo.field));
    setDevs(prev => {
      const next = [...prev];
      const devIndex = next.findIndex(d => d.id === undo.devId);
      if (devIndex === -1) return prev;
      
      next[devIndex][undo.field] = undo.taskName;
      next[devIndex].done = Math.max(0, next[devIndex].done - 1);
      return next;
    });
    setUndo(null);
  };

  const saveTask = (devId, field, value, blur = false) => {
    setDevs(prev => {
      const next = [...prev];
      const devIndex = next.findIndex(d => d.id === devId);
      if (devIndex === -1) return prev;
      next[devIndex][field] = value;
      return next;
    });
    
    const backlogItem = backlog.find(b => b.task === value);
    if (backlogItem) {
      setBacklog(prev => prev.filter(b => b.id !== backlogItem.id));
    }
    
    if (blur) document.activeElement?.blur();
  };

  const handleTaskKeyDown = (e, devId, field) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      saveTask(devId, field, e.target.value.trim(), true);
      if (e.key === 'Enter') e.preventDefault();
    }
  };

  const addDeveloper = () => {
    if (!newDev.trim()) return;
    const newId = Math.max(...devs.map(d => d.id)) + 1;
    setDevs(prev => [...prev, {
      id: newId,
      name: newDev.trim(),
      avatar: `https://i.pravatar.cc/40?u=${Date.now()}`,
      done: 0,
      quickFix: '',
      primary: '',
      secondary: '',
      status: 'active'
    }]);
    setLog(prev => [...prev, {
      id: Date.now(),
      date: new Date().toLocaleString(),
      name: 'System',
      taskType: 'developer',
      taskName: `Added ${newDev.trim()}`,
      type: 'system'
    }]);
    setNewDev('');
  };

  const addBacklogItem = () => {
    if (!newBacklog.task.trim()) return;
    const newId = Math.max(...backlog.map(b => b.id)) + 1;
    const item = {
      id: newId,
      task: newBacklog.task.trim(),
      priority: newBacklog.priority,
      estimatedHours: parseInt(newBacklog.hours) || 0
    };
    setBacklog(prev => [...prev, item]);
    setLog(prev => [...prev, {
      id: Date.now(),
      date: new Date().toLocaleString(),
      name: 'Backlog',
      taskType: 'added',
      taskName: item.task,
      type: 'backlog'
    }]);
    setNewBacklog({ task: "", priority: "medium", hours: "" });
  };

  const addQuickTask = () => {
    if (!quickTask.task.trim()) return;
    
    if (quickTask.assignTo) {
      // Assign directly to developer
      const dev = devs.find(d => d.name.toLowerCase().includes(quickTask.assignTo.toLowerCase()));
      if (dev) {
        const field = !dev.quickFix ? 'quickFix' : !dev.primary ? 'primary' : 'secondary';
        setDevs(prev => {
          const next = [...prev];
          const devIndex = next.findIndex(d => d.id === dev.id);
          if (devIndex !== -1) {
            next[devIndex][field] = quickTask.task.trim();
          }
          return next;
        });
        setLog(prev => [...prev, {
          id: Date.now(),
          date: new Date().toLocaleString(),
          name: 'Quick Add',
          taskType: 'assigned',
          taskName: `"${quickTask.task.trim()}" to ${dev.name}`,
          type: 'assignment'
        }]);
      } else {
        // Add to backlog if developer not found
        addToBacklogFromQuick();
      }
    } else {
      // Add to backlog
      addToBacklogFromQuick();
    }
    
    setQuickTask({ task: "", priority: "medium", hours: "", assignTo: "" });
    setShowTaskModal(false);
  };

  const addToBacklogFromQuick = () => {
    const newId = Math.max(...backlog.map(b => b.id)) + 1;
    const item = {
      id: newId,
      task: quickTask.task.trim(),
      priority: quickTask.priority,
      estimatedHours: parseInt(quickTask.hours) || 0
    };
    setBacklog(prev => [...prev, item]);
    setLog(prev => [...prev, {
      id: Date.now(),
      date: new Date().toLocaleString(),
      name: 'Quick Add',
      taskType: 'added',
      taskName: item.task,
      type: 'backlog'
    }]);
  };

  const openChat = (devId, field) => {
    const dev = devs.find(d => d.id === devId);
    if (!dev?.[field]) return;
    setChatKey(keyOf(devId, field));
    setNote('');
    setCustomerName('');
  };

  const openBacklogChat = (backlogId) => {
    const item = backlog.find(b => b.id === backlogId);
    if (!item) return;
    setChatKey(`backlog-${backlogId}`);
    setNote('');
    setCustomerName('');
  };

  const closeChat = () => setChatKey(null);

  const addChatNote = () => {
    if (!note.trim() || !chatKey) return;
    
    const messageText = customerName.trim() 
      ? `[Customer: ${customerName.trim()}] ${note.trim()}`
      : note.trim();
    
    setThreads(prev => {
      const existing = prev[chatKey] || [];
      return {
        ...prev,
        [chatKey]: [...existing, {
          id: Date.now(),
          who: 'Me',
          msg: messageText,
          timestamp: new Date().toLocaleTimeString(),
          customer: customerName.trim()
        }]
      };
    });
    setNote('');
  };

  const getChatTaskTitle = () => {
    if (!chatKey) return '';
    
    if (chatKey.startsWith('backlog-')) {
      const backlogId = parseInt(chatKey.replace('backlog-', ''));
      const item = backlog.find(b => b.id === backlogId);
      return item?.task || '';
    }
    
    const [devId, field] = chatKey.split('-');
    const dev = devs.find(d => d.id === parseInt(devId));
    return dev?.[field] || '';
  };

  const filteredDevs = devs.filter(dev => {
    if (filter === 'active' && dev.status !== 'active') return false;
    if (filter === 'busy' && dev.status !== 'busy') return false;
    if (searchTerm && !dev.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 'high': return <AlertTriangle className="w-3 h-3" />;
      case 'medium': return <Clock className="w-3 h-3" />;
      case 'low': return <CheckCircle2 className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <style dangerouslySetInnerHTML={{
        __html: `
          ::-webkit-calendar-picker-indicator,
          ::-webkit-list-button {
            display: none !important;
          }
          input[list]::-webkit-calendar-picker-indicator {
            display: none !important;
          }
          input[list] {
            -webkit-appearance: textfield;
            -moz-appearance: textfield;
            appearance: textfield;
          }
          input:focus {
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          .animate-scale-in {
            animation: scaleIn 0.2s ease-out;
          }
          @keyframes scaleIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-10px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          kbd {
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
            font-size: 0.75rem;
          }
        `
      }} />

      {undo && (
        <div className="fixed bottom-6 left-6 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{undo.taskName} completed</span>
          <button 
            onClick={handleUndo}
            className="bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Undo2 className="w-3 h-3" />
            Undo
          </button>
        </div>
      )}

      {/* Fixed Add Task Button */}
      <button
        onClick={() => setShowTaskModal(true)}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-40 transition-all duration-200 hover:scale-105 group"
      >
        <Plus className="w-6 h-6" />
        <span className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Add Task
        </span>
      </button>

      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6" id="add-task-section">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-500" />
                Dev Pulse Tracker
              </h1>
              <p className="text-gray-600 mt-2">Track development tasks and team progress in real-time</p>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search developers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Developers</option>
                <option value="active">Active Only</option>
                <option value="busy">Busy Only</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-4 gap-6 font-semibold text-gray-700 text-sm uppercase tracking-wide">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Developer
            </div>
            <div className="flex items-center gap-2">
              🐞 Quick Fix
            </div>
            <div className="flex items-center gap-2">
              🔥 Primary Task
            </div>
            <div className="flex items-center gap-2">
              🧩 Secondary Task
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredDevs.map((dev) => (
            <div key={dev.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="grid grid-cols-4 gap-6 items-center">
                  <div className="flex items-center gap-4">
                    <img 
                      src={dev.avatar} 
                      alt={dev.name} 
                      className="w-12 h-12 rounded-full border-2 border-gray-200" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{dev.name}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dev.status)}`}>
                          {dev.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                          {dev.done} completed
                        </span>
                      </div>
                    </div>
                  </div>

                  {['quickFix', 'primary', 'secondary'].map((field) => {
                    const key = keyOf(dev.id, field);
                    const value = dev[field];
                    return (
                      <div key={field} className="space-y-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={!!fade[key]}
                            disabled={!value && !fade[key]}
                            onChange={() => complete(dev.id, field)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                          />
                          <input
                            className={getTaskInputClass(key, value, focusedInput === key)}
                            value={value}
                            list={`backlog-${field}`}
                            placeholder="Type or select task"
                            onFocus={() => setFocusedInput(key)}
                            onBlur={() => setFocusedInput(null)}
                            onChange={(e) => saveTask(dev.id, field, e.target.value)}
                            onKeyDown={(e) => handleTaskKeyDown(e, dev.id, field)}
                          />
                        </div>
                        {value && (
                          <div className="ml-7">
                            <button
                              onClick={() => openChat(dev.id, field)}
                              className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Discuss
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Developer
          </h3>
          <div className="flex gap-3">
            <input
              value={newDev}
              onChange={(e) => setNewDev(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addDeveloper()}
              placeholder="Enter developer name"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addDeveloper}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Developer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-xl text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Task Backlog
          </h2>
          
          <div className="grid grid-cols-4 gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <input
              value={newBacklog.task}
              onChange={(e) => setNewBacklog(prev => ({ ...prev, task: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addBacklogItem()}
              placeholder="Task description"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newBacklog.priority}
              onChange={(e) => setNewBacklog(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <input
              type="number"
              value={newBacklog.hours}
              onChange={(e) => setNewBacklog(prev => ({ ...prev, hours: e.target.value }))}
              placeholder="Est. hours"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addBacklogItem}
              className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>

          <div className="space-y-3">
            {backlog.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${PRIORITY_COLORS[item.priority]}`}>
                    {getPriorityIcon(item.priority)}
                    {item.priority}
                  </span>
                  <span className="font-medium text-gray-900">{item.task}</span>
                </div>
                <div className="flex items-center gap-3">
                  {item.estimatedHours > 0 && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.estimatedHours}h
                    </span>
                  )}
                  <button
                    onClick={() => openBacklogChat(item.id)}
                    className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Discuss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="font-semibold text-xl text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Activity Log
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {log.slice(-20).reverse().map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 min-w-32">{entry.date}</div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{entry.name}</span>
                  <span className="text-gray-600"> {entry.taskType === 'completion' ? 'completed' : entry.taskType} task: </span>
                  <span className="font-medium text-gray-900">{entry.taskName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {['quickFix', 'primary', 'secondary'].map((field) => (
          <datalist id={`backlog-${field}`} key={field}>
            {backlog.map((item) => (
              <option value={item.task} key={item.id} />
            ))}
          </datalist>
        ))}
      </div>
    </div>
  );
} 