import { format, formatDistanceToNow } from 'date-fns';

// Format date to display in a readable format
export const formatDate = (date) => {
  if (!date) return 'Not set';
  return format(new Date(date), 'MMM dd, yyyy');
};

// Format time spent in a readable format
export const formatTimeSpent = (seconds) => {
  if (!seconds) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
};

// Get relative time (e.g., "2 days ago")
export const getRelativeTime = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Calculate days remaining until deadline
export const getDaysRemaining = (endDate) => {
  if (!endDate) return null;
  
  const today = new Date();
  const deadline = new Date(endDate);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Get color based on days remaining
export const getDeadlineColor = (daysRemaining) => {
  if (daysRemaining === null) return 'inherit';
  if (daysRemaining < 0) return '#ff5252'; // Overdue
  if (daysRemaining <= 2) return '#ff9800'; // Due soon
  return '#4caf50'; // Plenty of time
};
