import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import * as api from '../services/api';

// Define initial state
const initialState = {
  columns: {},
  columnOrder: [],
  tasks: {},
  users: [],
  loading: false,
  error: null
};

// Load initial state
const loadState = () => {
  return initialState;
};

// Define reducer function
const kanbanReducer = (state, action) => {
  let newState;

  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };

    case 'SET_COLUMNS':
      const columnsById = {};
      const columnOrder = [];

      action.payload.forEach(column => {
        columnsById[column.id] = {
          id: column.id,
          title: column.title,
          taskIds: column.task_ids || []
        };
        columnOrder.push(column.id);
      });

      return {
        ...state,
        columns: columnsById,
        columnOrder
      };

    case 'SET_TASKS':
      const tasksById = {};

      action.payload.forEach(task => {
        tasksById[task.id] = {
          id: task.id,
          title: task.title,
          description: task.description || '',
          startDate: task.start_date,
          endDate: task.end_date,
          status: task.status,
          priority: task.priority,
          assignee: task.assignee_id,
          tags: task.tags || [],
          comments: task.comments || [],
          timeSpent: task.time_spent || 0,
          timeTracking: {
            isTracking: task.is_tracking || false,
            startTime: task.tracking_start_time
          }
        };
      });

      return {
        ...state,
        tasks: tasksById
      };

    case 'SET_USERS':
      return {
        ...state,
        users: action.payload
      };

    case 'ADD_TASK':
      const { task: newTask } = action.payload;

      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [newTask.id]: newTask
        },
        columns: {
          ...state.columns,
          [newTask.status]: {
            ...state.columns[newTask.status],
            taskIds: [...state.columns[newTask.status].taskIds, newTask.id]
          }
        }
      };
      break;

    case 'UPDATE_TASK':
      // Get the current task and its current status
      const currentTask = state.tasks[action.payload.id];
      const oldStatus = currentTask.status;
      const newStatus = action.payload.status;
      const updatedTask = {
        ...currentTask,
        ...action.payload
      };

      // Check if the status has changed
      if (oldStatus !== newStatus && oldStatus && newStatus) {
        // Find the old column and remove the task from it
        const oldColumn = state.columns[oldStatus];
        const newColumn = state.columns[newStatus];

        if (oldColumn && newColumn) {
          // Remove task from old column
          const oldColumnTaskIds = oldColumn.taskIds.filter(
            id => id !== action.payload.id
          );

          // Check if the task already exists in the new column to prevent duplicates
          const newColumnTaskIds = newColumn.taskIds.includes(action.payload.id) ?
            newColumn.taskIds : [...newColumn.taskIds, action.payload.id];

          newState = {
            ...state,
            tasks: {
              ...state.tasks,
              [action.payload.id]: updatedTask
            },
            columns: {
              ...state.columns,
              [oldStatus]: {
                ...oldColumn,
                taskIds: oldColumnTaskIds
              },
              [newStatus]: {
                ...newColumn,
                taskIds: newColumnTaskIds
              }
            }
          };
        } else {
          // If columns don't exist, just update the task
          newState = {
            ...state,
            tasks: {
              ...state.tasks,
              [action.payload.id]: updatedTask
            }
          };
        }
      } else {
        // If status hasn't changed, just update the task
        newState = {
          ...state,
          tasks: {
            ...state.tasks,
            [action.payload.id]: updatedTask
          }
        };
      }
      break;

    case 'DELETE_TASK':
      const { [action.payload.id]: deletedTask, ...remainingTasks } = state.tasks;

      // Find which column contains the task
      const columnId = Object.keys(state.columns).find(
        colId => state.columns[colId].taskIds.includes(action.payload.id)
      );

      if (columnId) {
        newState = {
          ...state,
          tasks: remainingTasks,
          columns: {
            ...state.columns,
            [columnId]: {
              ...state.columns[columnId],
              taskIds: state.columns[columnId].taskIds.filter(id => id !== action.payload.id)
            }
          }
        };
      } else {
        newState = {
          ...state,
          tasks: remainingTasks
        };
      }
      break;

    case 'MOVE_TASK':
      const { taskId, source, destination } = action.payload;
      const taskIdStr = String(taskId);

      // If there's no destination or if the item is dropped in the same position
      if (!destination ||
        (destination.droppableId === source.droppableId &&
          destination.index === source.index)) {
        return state;
      }

      try {
        // Moving within the same column
        if (source.droppableId === destination.droppableId) {
          const column = state.columns[source.droppableId];
          if (!column) {
            console.error(`Column not found: ${source.droppableId}`);
            return state;
          }

          const newTaskIds = Array.from(column.taskIds);
          newTaskIds.splice(source.index, 1);
          newTaskIds.splice(destination.index, 0, taskIdStr);

          newState = {
            ...state,
            columns: {
              ...state.columns,
              [source.droppableId]: {
                ...column,
                taskIds: newTaskIds
              }
            }
          };
        } else {
          // Moving to a different column
          const sourceColumn = state.columns[source.droppableId];
          const destColumn = state.columns[destination.droppableId];

          if (!sourceColumn || !destColumn) {
            console.error(`Column not found: source=${source.droppableId}, dest=${destination.droppableId}`);
            return state;
          }

          const sourceTaskIds = Array.from(sourceColumn.taskIds);
          const destTaskIds = Array.from(destColumn.taskIds);

          sourceTaskIds.splice(source.index, 1);
          destTaskIds.splice(destination.index, 0, taskIdStr);

          // Also update the task's status to match the new column
          newState = {
            ...state,
            columns: {
              ...state.columns,
              [source.droppableId]: {
                ...sourceColumn,
                taskIds: sourceTaskIds
              },
              [destination.droppableId]: {
                ...destColumn,
                taskIds: destTaskIds
              }
            },
            tasks: {
              ...state.tasks,
              [taskIdStr]: {
                ...state.tasks[taskIdStr],
                status: destination.droppableId
              }
            }
          };

          // Update the task status in the backend
          api.updateTask(taskIdStr, { status: destination.droppableId })
            .catch(error => console.error('Error updating task status:', error));
        }
      } catch (error) {
        console.error('Error in MOVE_TASK reducer:', error);
        return state;
      }
      break;

    case 'ADD_COMMENT':
      // Use the comment data from the API if available, otherwise create a new one
      const newComment = {
        id: action.payload.id || uuidv4(),
        text: action.payload.text,
        author_id: action.payload.author_id || 1,
        timestamp: action.payload.timestamp || new Date().toISOString()
      };

      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskId]: {
            ...state.tasks[action.payload.taskId],
            comments: [
              ...state.tasks[action.payload.taskId].comments,
              newComment
            ]
          }
        }
      };
      break;

    case 'START_TIME_TRACKING':
      const startTimeTracking = new Date().getTime();
      
      // Create time tracking data for API
      const startTimeTrackingData = {
        is_tracking: true,
        tracking_start_time: startTimeTracking
      };
      
      // Send time tracking update to API
      api.updateTaskTimeTracking(action.payload.taskId, startTimeTrackingData)
        .catch(error => console.error('Error starting time tracking:', error));
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskId]: {
            ...state.tasks[action.payload.taskId],
            timeTracking: {
              isTracking: true,
              startTime: startTimeTracking
            }
          }
        }
      };
      break;

    case 'STOP_TIME_TRACKING':
      const task = state.tasks[action.payload.taskId];
      const startTime = task.timeTracking.startTime;
      const endTime = new Date().getTime();
      const timeSpent = task.timeSpent + (endTime - startTime) / 1000; // in seconds
      
      // Create time tracking data for API
      const stopTimeTrackingData = {
        is_tracking: false,
        tracking_start_time: null,
        time_spent: timeSpent
      };
      
      // Send time tracking update to API
      api.updateTaskTimeTracking(action.payload.taskId, stopTimeTrackingData)
        .catch(error => console.error('Error stopping time tracking:', error));
      
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskId]: {
            ...task,
            timeSpent,
            timeTracking: {
              isTracking: false,
              startTime: null
            }
          }
        }
      };
      break;

    case 'ADD_TAG':
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskId]: {
            ...state.tasks[action.payload.taskId],
            tags: [
              ...state.tasks[action.payload.taskId].tags,
              action.payload.tag
            ]
          }
        }
      };
      break;

    case 'REMOVE_TAG':
      newState = {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.taskId]: {
            ...state.tasks[action.payload.taskId],
            tags: state.tasks[action.payload.taskId].tags.filter(
              tag => tag !== action.payload.tag
            )
          }
        }
      };
      break;

    default:
      return state;
  }

  // Save state to localStorage
  localStorage.setItem('kanbanState', JSON.stringify(newState));
  return newState;
};

// Create context
const KanbanContext = createContext();

// Create provider component
export const KanbanProvider = ({ children }) => {
  const [state, dispatch] = useReducer(kanbanReducer, loadState());
  const [isInitialized, setIsInitialized] = useState(false);

  // Load data from the API on component mount
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Fetch columns
        const columns = await api.getColumns();
        dispatch({ type: 'SET_COLUMNS', payload: columns });

        // Fetch tasks
        const tasks = await api.getTasks();

        // Fetch comments for each task
        for (const task of tasks) {
          try {
            const comments = await api.getCommentsByTask(task.id);
            task.comments = comments;
          } catch (commentError) {
            console.error(`Error fetching comments for task ${task.id}:`, commentError);
            task.comments = [];
          }
        }

        dispatch({ type: 'SET_TASKS', payload: tasks });

        // Fetch users
        const users = await api.getUsers();
        dispatch({ type: 'SET_USERS', payload: users });

        setIsInitialized(true);
      } catch (error) {
        console.error('Error fetching data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data from server' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    fetchData();
  }, []);

  return (
    <KanbanContext.Provider value={{ state, dispatch, isInitialized }}>
      {children}
    </KanbanContext.Provider>
  );
};

// Custom hook to use the Kanban context
export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within a KanbanProvider');
  }
  return context;
};
