// API configuration for development and LAN access
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// Create API URLs
export const createApiUrl = (path) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return API_BASE_URL ? `${API_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
};
