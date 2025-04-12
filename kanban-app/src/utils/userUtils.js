import { useKanban } from '../context/KanbanContext';

// Get user by ID from the KanbanContext state
export const getUserById = (userId) => {
  // This is used outside of React components, so we can't use the hook directly
  // Instead, we'll use a fallback mechanism if the user isn't found
  try {
    // Try to find the user in the global state
    const state = window.kanbanState;
    if (state && state.users) {
      return state.users.find(user => user.id === userId) || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

// Generate initials from a name
export const getInitials = (name) => {
  if (!name) return '?';
  
  const parts = name.split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Get user avatar
export const getUserAvatar = (userId) => {
  const user = getUserById(userId);
  
  if (!user) return '?';
  
  // If the user has an avatar property, use it
  if (user.avatar) return user.avatar;
  
  // Otherwise, generate initials from the name
  return getInitials(user.name);
};

// Get user name
export const getUserName = (userId) => {
  const user = getUserById(userId);
  return user ? user.name : 'Unassigned';
};

// Component to store users in window for access outside of React components
export const UserStateProvider = () => {
  const { state } = useKanban();
  
  // Store the users in the window object for access outside of React components
  if (state && state.users) {
    window.kanbanState = state;
  }
  
  return null;
};
