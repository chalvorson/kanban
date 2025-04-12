import React from 'react';
import { CssBaseline, ThemeProvider, createTheme, CircularProgress, Box, Typography } from '@mui/material';
import Board from './components/Board/Board';
import { KanbanProvider, useKanban } from './context/KanbanContext';
import { UserStateProvider } from './utils/userUtils';
import './App.css';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f7fa',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Loading component to show while data is being fetched
const LoadingScreen = () => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    height="100vh"
  >
    <CircularProgress size={60} />
    <Typography variant="h6" style={{ marginTop: 20 }}>
      Loading Kanban Board...
    </Typography>
  </Box>
);

// Main content with loading state handling
const KanbanContent = () => {
  const { state, isInitialized } = useKanban();

  // Include the UserStateProvider to store users in window object
  // This is needed for accessing users outside of React components
  
  if (state.loading || !isInitialized) {
    return <LoadingScreen />;
  }

  if (state.error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <Typography variant="h6" color="error">
          {state.error}
        </Typography>
        <Typography variant="body1" style={{ marginTop: 10 }}>
          Please check if the backend server is running at http://localhost:8000
        </Typography>
      </Box>
    );
  }

  return (
    <div className="App">
      <UserStateProvider />
      <Board />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <KanbanProvider>
        <KanbanContent />
      </KanbanProvider>
    </ThemeProvider>
  );
}

export default App;
