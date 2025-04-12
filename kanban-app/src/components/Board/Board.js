import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { Box, Typography, Container } from '@mui/material';
import Column from '../Column/Column';
import TaskModal from '../TaskModal/TaskModal';
import { useKanban } from '../../context/KanbanContext';
import * as api from '../../services/api';
import './Board.css';

const Board = () => {
  const { state, dispatch } = useKanban();
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Force re-render when state changes to ensure proper rendering of columns and tasks
  useEffect(() => {
    // This effect will run whenever the state changes
    setForceUpdate(prev => prev + 1);
  }, [state]);

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or if the item is dropped in the same position
    if (!destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)) {
      return;
    }

    console.log('Drag end:', { draggableId, source, destination });

    // Ensure the columns exist
    if (!state.columns[source.droppableId] || !state.columns[destination.droppableId]) {
      console.error('Invalid column IDs:', { source: source.droppableId, destination: destination.droppableId });
      return;
    }

    dispatch({
      type: 'MOVE_TASK',
      payload: {
        taskId: draggableId,
        source: source,
        destination: destination
      }
    });
  };

  const openTaskModal = (taskId) => {
    setSelectedTaskId(taskId);
    setNewTaskColumnId(null);
    setIsTaskModalOpen(true);
  };

  const openNewTaskModal = (columnId) => {
    setSelectedTaskId(null);
    setNewTaskColumnId(columnId);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTaskId(null);
    setNewTaskColumnId(null);
  };

  return (
    <Container maxWidth="xl" className="board-container">
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
        Kanban Board
      </Typography>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Box className="board" sx={{ display: 'flex', overflowX: 'auto', pb: 2 }}>
          {state.columnOrder.map(columnId => {
            const column = state.columns[columnId];
            // Filter out any undefined tasks to prevent errors
            const tasks = column.taskIds
              .filter(taskId => state.tasks[taskId])
              .map(taskId => state.tasks[taskId]);

            return (
              <Column
                key={`${column.id}-${forceUpdate}`}
                column={column}
                tasks={tasks}
                openTaskModal={openTaskModal}
                openNewTaskModal={openNewTaskModal}
              />
            );
          })}
        </Box>
      </DragDropContext>

      <TaskModal
        open={isTaskModalOpen}
        handleClose={closeTaskModal}
        task={selectedTaskId ? state.tasks[selectedTaskId] : null}
        newTaskColumnId={newTaskColumnId}
        handleUpdate={async (updatedTask, apiTaskData) => {
          try {
            if (updatedTask.id) {
              // Update existing task
              await api.updateTask(updatedTask.id, apiTaskData || {
                title: updatedTask.title,
                description: updatedTask.description,
                start_date: updatedTask.startDate,
                end_date: updatedTask.endDate,
                status: updatedTask.status,
                priority: updatedTask.priority,
                assignee_id: updatedTask.assignee
              });
              
              dispatch({
                type: 'UPDATE_TASK',
                payload: updatedTask
              });
            }
            closeTaskModal();
          } catch (error) {
            console.error('Error updating task:', error);
          }
        }}
        handleDelete={async () => {
          try {
            if (selectedTaskId) {
              await api.deleteTask(selectedTaskId);
              dispatch({
                type: 'DELETE_TASK',
                payload: { id: selectedTaskId }
              });
            }
            closeTaskModal();
          } catch (error) {
            console.error('Error deleting task:', error);
          }
        }}
      />
    </Container>
  );
};

export default Board;
