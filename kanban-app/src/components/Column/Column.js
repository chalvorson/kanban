import React, { memo } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { Paper, Typography, Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Task from '../Task/Task';
import './Column.css';

const Column = memo(({ column, tasks, openTaskModal, openNewTaskModal }) => {
  return (
    <Paper
      className="column"
      sx={{
        padding: 2,
        backgroundColor: '#f5f5f5',
        width: '300px',
        height: 'calc(100vh - 160px)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          {column.title} ({tasks.length})
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => openNewTaskModal(column.id)}
          sx={{
            minWidth: '40px',
            height: '30px',
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0',
            }
          }}
        >
          Add
        </Button>
      </Box>

      <Droppable droppableId={column.id} type="task">
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: '100px',
              backgroundColor: snapshot.isDraggingOver ? 'rgba(144, 202, 249, 0.2)' : 'transparent',
              transition: 'background-color 0.2s ease',
              padding: 1,
              borderRadius: 1
            }}
          >
            {tasks.map((task, index) => (
              <Task
                key={task.id}
                task={task}
                index={index}
                openTaskModal={openTaskModal}
              />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
});

export default Column;
