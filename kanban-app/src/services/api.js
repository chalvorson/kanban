import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Column API calls
export const getColumns = async () => {
  const response = await api.get('/columns');
  return response.data;
};

export const getColumn = async (columnId) => {
  const response = await api.get(`/columns/${columnId}`);
  return response.data;
};

export const createColumn = async (column) => {
  const response = await api.post('/columns', column);
  return response.data;
};

export const updateColumn = async (columnId, column) => {
  const response = await api.put(`/columns/${columnId}`, column);
  return response.data;
};

export const deleteColumn = async (columnId) => {
  await api.delete(`/columns/${columnId}`);
};

// Task API calls
export const getTasks = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const getTask = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const createTask = async (task) => {
  const response = await api.post('/tasks', task);
  return response.data;
};

export const updateTask = async (taskId, task) => {
  const response = await api.put(`/tasks/${taskId}`, task);
  return response.data;
};

export const deleteTask = async (taskId) => {
  await api.delete(`/tasks/${taskId}`);
};

export const updateTaskTimeTracking = async (taskId, timeTracking) => {
  const response = await api.put(`/tasks/${taskId}/time-tracking`, timeTracking);
  return response.data;
};

export const addTagToTask = async (taskId, tagId) => {
  const response = await api.post(`/tasks/${taskId}/tags/${tagId}`);
  return response.data;
};

export const removeTagFromTask = async (taskId, tagId) => {
  const response = await api.delete(`/tasks/${taskId}/tags/${tagId}`);
  return response.data;
};

// User API calls
export const getUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const getUser = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

export const createUser = async (user) => {
  const response = await api.post('/users', user);
  return response.data;
};

export const updateUser = async (userId, user) => {
  const response = await api.put(`/users/${userId}`, user);
  return response.data;
};

export const deleteUser = async (userId) => {
  await api.delete(`/users/${userId}`);
};

// Comment API calls
export const getCommentsByTask = async (taskId) => {
  const response = await api.get(`/comments/task/${taskId}`);
  return response.data;
};

export const createComment = async (comment) => {
  const response = await api.post('/comments', comment);
  return response.data;
};

export const updateComment = async (commentId, comment) => {
  const response = await api.put(`/comments/${commentId}`, comment);
  return response.data;
};

export const deleteComment = async (commentId) => {
  await api.delete(`/comments/${commentId}`);
};

// Tag API calls
export const getTags = async () => {
  const response = await api.get('/tags');
  return response.data;
};

export const getTag = async (tagId) => {
  const response = await api.get(`/tags/${tagId}`);
  return response.data;
};

export const createTag = async (tag) => {
  const response = await api.post('/tags', tag);
  return response.data;
};
