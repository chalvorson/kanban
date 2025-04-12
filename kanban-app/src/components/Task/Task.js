import React, { useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Card, CardContent, Typography, Box, Chip, IconButton, Avatar, CircularProgress, Tooltip } from '@mui/material';
import { styled } from '@mui/system';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CommentIcon from '@mui/icons-material/Comment';
import { useKanban } from '../../context/KanbanContext';
import TaskModal from '../TaskModal/TaskModal';
import { formatDate, formatTimeSpent, getDaysRemaining, getDeadlineColor } from '../../utils/dateUtils';
import { getUserAvatar, getUserName } from '../../utils/userUtils';
import * as api from '../../services/api';
import './Task.css';

const priorityColors = {
  low: '#8bc34a',
  medium: '#ffc107',
  high: '#f44336'
};

const TaskCard = styled(Card)(({ isDragging }) => ({
  opacity: isDragging ? 0.9 : 1,
  backgroundColor: isDragging ? '#f5f5f5' : '#fff',
}));

const Task = ({ task, index }) => {
  const { dispatch } = useKanban();
  const daysRemaining = getDaysRemaining(task.endDate);
  const deadlineColor = getDeadlineColor(daysRemaining);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  const handleTimeTrackingToggle = (e) => {
    e.stopPropagation();

    if (task.timeTracking?.isTracking) {
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

  const handleDelete = async () => {
    try {
      setIsUpdating(true);
      await api.deleteTask(task.id);
      dispatch({
        type: 'DELETE_TASK',
        payload: { id: task.id }
      });
      handleClose();
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdate = async (updatedTask, apiTaskData = null) => {
    try {
      setIsUpdating(true);
      // Use provided apiTask data or format it from updatedTask
      const apiTask = apiTaskData || {
        title: updatedTask.title,
        description: updatedTask.description,
        start_date: updatedTask.startDate,
        end_date: updatedTask.endDate,
        status: updatedTask.status,
        priority: updatedTask.priority,
        assignee_id: updatedTask.assignee
      };

      // Update in API
      await api.updateTask(task.id, apiTask);

      // Update in local state
      dispatch({
        type: 'UPDATE_TASK',
        payload: {
          ...updatedTask,
          id: task.id
        }
      });
      handleClose();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Draggable draggableId={String(task.id)} index={index}>
        {(provided, snapshot) => (
          <TaskCard
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            isDragging={snapshot.isDragging}
            sx={{ marginBottom: 2, borderLeft: `4px solid ${priorityColors[task.priority] || '#ccc'}` }}
          >
            <CardContent>
              {isUpdating ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" component="div" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>
                      {task.title}
                    </Typography>
                    <IconButton size="small" onClick={handleOpen}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {task.description && (
                    <Typography variant="body2" color="text.secondary" mb={2}>
                      {task.description.length > 100
                        ? `${task.description.substring(0, 100)}...`
                        : task.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                    <Tooltip title={task.timeTracking?.isTracking ? "Stop tracking" : "Start tracking"}>
                      <IconButton
                        size="small"
                        onClick={handleTimeTrackingToggle}
                        color={task.timeTracking?.isTracking ? "error" : "primary"}
                      >
                        {task.timeTracking?.isTracking ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                      <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatTimeSpent(task.timeSpent || 0)}
                      </Typography>
                    </Box>

                    {task.comments?.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                        <CommentIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {task.comments.length}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {task.startDate && (
                        <span>Start: {formatDate(task.startDate)}</span>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ color: deadlineColor }}>
                      {task.endDate && (
                        <span>Due: {formatDate(task.endDate)}</span>
                      )}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                    <Chip
                      label={task.priority}
                      size="small"
                      color={
                        task.priority === 'high' ? 'error' :
                          task.priority === 'medium' ? 'warning' : 'success'
                      }
                      variant="outlined"
                    />

                    <Box display="flex" alignItems="center">
                      {task.assignee ? (
                        <Tooltip title={getUserName(task.assignee)}>
                          <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                            {getUserAvatar(task.assignee)}
                          </Avatar>
                        </Tooltip>
                      ) : (
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                      )}
                    </Box>
                  </Box>

                  {task.tags?.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {task.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={typeof tag === 'object' && tag !== null ? tag.name : tag}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: '#e0e0e0'
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </TaskCard>
        )}
      </Draggable>

      {isModalOpen && (
        <TaskModal
          open={isModalOpen}
          handleClose={handleClose}
          task={task}
          handleUpdate={handleUpdate}
          handleDelete={handleDelete}
        />
      )}
    </>
  );
};

export default Task;
