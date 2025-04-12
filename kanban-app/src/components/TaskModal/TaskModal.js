import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import AddIcon from '@mui/icons-material/Add';
import PersonIcon from '@mui/icons-material/Person';
import { useKanban } from '../../context/KanbanContext';
import { formatDate, formatTimeSpent } from '../../utils/dateUtils';
import { getUserAvatar, getUserName } from '../../utils/userUtils';
import * as api from '../../services/api';
import './TaskModal.css';

const TaskModal = ({ open, handleClose, task, handleUpdate, handleDelete, newTaskColumnId }) => {
  const { state, dispatch } = useKanban();
  const isNewTask = !task;
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState(newTaskColumnId || '');
  const [assignee, setAssignee] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState([]);

  // Fetch users when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await api.getUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);
  const [newComment, setNewComment] = useState('');

  // Reset form when modal opens with a different task or when modal opens/closes
  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        setStartDate(task.startDate ? new Date(task.startDate) : null);
        setEndDate(task.endDate ? new Date(task.endDate) : null);
        setPriority(task.priority || 'medium');
        setStatus(task.status || '');
        setAssignee(task.assignee || null);
        // Ensure tags are in the correct format (objects with id and name)
        setTags(task.tags ? task.tags.map(tag => {
          if (tag === null || tag === undefined) {
            return { id: null, name: 'Unknown' };
          }
          return typeof tag === 'string' ? { id: null, name: tag } : tag;
        }) : []);
      } else {
        // Reset form for new task
        setTitle('');
        setDescription('');
        setStartDate(null);
        setEndDate(null);
        setPriority('medium');
        setStatus(newTaskColumnId || 'todo');
        setAssignee(null);
        setTags([]);
        setNewComment('');
      }
    }
  }, [task, open, newTaskColumnId]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title is required');
      return;
    }

    setIsLoading(true);

    try {
      if (isNewTask) {
        // Format task for API
        const newTask = {
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          priority,
          status,
          assignee_id: assignee
        };

        // Create in API
        const createdTask = await api.createTask(newTask);

        // Add tags to the task if there are any
        const tagPromises = tags.map(async (tag) => {
          // Skip null or undefined tags
          if (tag === null || tag === undefined) {
            return null;
          }
          
          // If tag is just a string (new tag), create it first
          if (typeof tag === 'string') {
            const createdTag = await api.createTag({ name: tag });
            await api.addTagToTask(createdTask.id, createdTag.id);
            return createdTag;
          } else if (typeof tag === 'object' && tag.id) {
            // If tag is an object with an id, just add it to the task
            await api.addTagToTask(createdTask.id, tag.id);
            return tag;
          } else if (typeof tag === 'object' && !tag.id && tag.name) {
            // If tag is an object with a name but no id, create it first
            const createdTag = await api.createTag({ name: tag.name });
            await api.addTagToTask(createdTask.id, createdTag.id);
            return createdTag;
          }
          return null;
        });

        // Wait for all tag operations to complete
        const updatedTags = (await Promise.all(tagPromises)).filter(tag => tag !== null);

        // Update local state
        dispatch({
          type: 'ADD_TASK',
          payload: {
            task: {
              id: createdTask.id,
              title,
              description,
              startDate,
              endDate,
              priority,
              status,
              assignee,
              tags: updatedTags,
              timeSpent: 0,
              timeTracking: {
                isTracking: false,
                startTime: null
              },
              comments: []
            }
          }
        });
      } else {
        // Update existing task
        const updatedTask = {
          title,
          description,
          startDate,
          endDate,
          priority,
          status,
          assignee,
          tags: tags // Keep the full tag objects
        };

        // For the API, we need to extract just the tag IDs
        const apiTask = {
          title,
          description,
          start_date: startDate,
          end_date: endDate,
          priority,
          status,
          assignee_id: assignee,
          // Send only tag IDs to the API
          tag_ids: tags.map(tag => typeof tag === 'object' && tag !== null ? tag.id : tag)
        };

        await handleUpdate(updatedTask, apiTask);
      }
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsLoading(false);
      if (handleClose) handleClose();
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setIsLoading(true);
        await handleDelete();
      } catch (error) {
        console.error('Error deleting task:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAddTag = async () => {
    if (newTag.trim()) {
      // Check if tag already exists (case insensitive)
      const tagExists = tags.some(tag => {
        if (typeof tag === 'string') {
          return tag.toLowerCase() === newTag.trim().toLowerCase();
        } else if (tag && typeof tag === 'object' && tag.name) {
          return tag.name.toLowerCase() === newTag.trim().toLowerCase();
        }
        return false;
      });

      if (!tagExists) {
        try {
          // Create the tag in the API
          const createdTag = await api.createTag({ name: newTag.trim() });
          
          // If we have a task ID, add the tag to the task
          if (task && task.id) {
            await api.addTagToTask(task.id, createdTag.id);
          }
          
          // Update local state
          setTags([...tags, createdTag]);
          setNewTag('');
        } catch (error) {
          console.error('Error adding tag:', error);
        }
      } else {
        // Tag already exists, just clear the input
        setNewTag('');
      }
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      // If we have a task ID and the tag has an ID, remove the tag from the task
      if (task && task.id && tagToRemove && typeof tagToRemove === 'object' && tagToRemove.id) {
        await api.removeTagFromTask(task.id, tagToRemove.id);
      }
      
      // Update local state - handle both object tags and string tags
      if (typeof tagToRemove === 'object' && tagToRemove !== null) {
        setTags(tags.filter(tag => {
          if (typeof tag === 'object' && tag !== null) {
            return tag.id !== tagToRemove.id;
          }
          return true;
        }));
      } else {
        // Handle string tags
        setTags(tags.filter(tag => tag !== tagToRemove));
      }
    } catch (error) {
      console.error('Error removing tag:', error);
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      try {
        // Default to the first user if no assignee is selected
        const authorId = task.assignee || (users.length > 0 ? users[0].id : 1);

        // Create the comment via API
        const commentData = {
          task_id: task.id,
          text: newComment.trim(),
          author_id: authorId
        };

        const createdComment = await api.createComment(commentData);

        // Update the local state
        dispatch({
          type: 'ADD_COMMENT',
          payload: {
            taskId: task.id,
            text: newComment.trim(),
            author_id: authorId,
            id: createdComment.id,
            timestamp: createdComment.timestamp
          }
        });

        setNewComment('');
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    }
  };

  const handleTimeTrackingToggle = () => {
    // Check if timeTracking exists, if not initialize with default values
    if (task.timeTracking && task.timeTracking.isTracking) {
      dispatch({
        type: 'STOP_TIME_TRACKING',
        payload: { taskId: task.id }
      });
    } else {
      dispatch({
        type: 'START_TIME_TRACKING',
        payload: { taskId: task.id }
      });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderTop: `6px solid ${priority === 'high' ? '#f44336' : priority === 'medium' ? '#ff9800' : '#4caf50'}`,
          borderRadius: '4px',
          padding: '8px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isNewTask ? 'Create New Task' : 'Edit Task'}
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={startDate ? new Date(startDate) : null}
                onChange={(newDate) => setStartDate(newDate)}
                slotProps={{ textField: { fullWidth: true } }}
              />

              <DatePicker
                label="Due Date"
                value={endDate ? new Date(endDate) : null}
                onChange={(newDate) => setEndDate(newDate)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                label="Status"
              >
                {Object.values(state.columns).map((column) => (
                  <MenuItem key={column.id} value={column.id}>
                    {column.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Assign To</InputLabel>
            <Select
              value={assignee || ''}
              onChange={(e) => setAssignee(e.target.value || null)}
              label="Assign To"
              renderValue={(selected) => {
                const user = users.find(u => u.id === selected);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                      {user ? getUserAvatar(user.id) : <PersonIcon />}
                    </Avatar>
                    {user ? user.name : 'Unassigned'}
                  </Box>
                );
              }}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                      {getUserAvatar(user.id)}
                    </Avatar>
                    {user.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={typeof tag === 'object' && tag !== null ? tag.name : tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Add Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                size="small"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag();
                    e.preventDefault();
                  }
                }}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                startIcon={<AddIcon />}
                size="small"
              >
                Add
              </Button>
            </Box>
          </Box>

          {!isNewTask && (
            <>
              <Divider sx={{ my: 2 }} />

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AccessTimeIcon sx={{ mr: 1 }} />
                  <Typography variant="subtitle1">
                    Time Tracking: {formatTimeSpent(task.timeSpent)}
                  </Typography>
                  <Button
                    variant="contained"
                    color={task.timeTracking.isTracking ? "error" : "primary"}
                    startIcon={task.timeTracking.isTracking ? <StopIcon /> : <PlayArrowIcon />}
                    onClick={handleTimeTrackingToggle}
                    size="small"
                    sx={{ ml: 2 }}
                  >
                    {task.timeTracking.isTracking ? 'Stop' : 'Start'}
                  </Button>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Comments
                </Typography>

                {task.comments && task.comments.length > 0 ? (
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {task.comments.map((comment) => (
                      <ListItem key={comment.id} alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>{getUserAvatar(comment.author_id)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={getUserName(comment.author_id)}
                          secondary={
                            <>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {comment.text}
                              </Typography>
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {formatDate(comment.timestamp)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No comments yet
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <TextField
                    label="Add Comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.ctrlKey) {
                        handleAddComment();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    sx={{ alignSelf: 'flex-end' }}
                  >
                    Comment
                  </Button>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        {!isNewTask && (
          <Button
            onClick={handleDeleteTask}
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        )}
        <Box>
          <Button onClick={handleClose} color="inherit" disabled={isLoading}>Cancel</Button>
          <Button
            onClick={handleSave}
            color="primary"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isNewTask ? 'Create' : 'Save'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default TaskModal;
