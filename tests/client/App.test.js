// App component tests
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../client/src/App';

// Mock axios
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios;

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks
    localStorage.clear();
    jest.clearAllMocks();
    
    // Default axios mock responses
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({ data: {} });
  });

  describe('Initial Render', () => {
    it('renders main navigation when not logged in', () => {
      render(<App />);
      
      expect(screen.getByText(/Card Tracker/i)).toBeInTheDocument();
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
      expect(screen.getByText(/Register/i)).toBeInTheDocument();
    });

    it('renders card tracker page by default', () => {
      render(<App />);
      
      expect(screen.getByText(/Welcome to MoP Inscription Deck Tracker/i)).toBeInTheDocument();
    });

    it('fetches initial data on mount', () => {
      render(<App />);
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/cards');
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/announcement', expect.any(Object));
    });
  });

  describe('Authentication Flow', () => {
    it('shows login form when login button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const loginButton = screen.getByText(/Login/i);
      await user.click(loginButton);
      
      expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    });

    it('shows register form when register button clicked', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const registerButton = screen.getByText(/Register/i);
      await user.click(registerButton);
      
      expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    });

    it('handles successful login', async () => {
      const user = userEvent.setup();
      
      // Mock successful login response
      mockedAxios.post.mockResolvedValueOnce({
        data: { token: 'mock-token', role: 'user' }
      });
      
      render(<App />);
      
      // Navigate to login
      await user.click(screen.getByText(/Login/i));
      
      // Fill in form
      await user.type(screen.getByPlaceholderText(/Username/i), 'testuser');
      await user.type(screen.getByPlaceholderText(/Password/i), 'testpass');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /Login/i }));
      
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-token');
      });
    });

    it('handles login error', async () => {
      const user = userEvent.setup();
      
      // Mock login error
      mockedAxios.post.mockRejectedValueOnce(new Error('Invalid credentials'));
      
      render(<App />);
      
      // Navigate to login
      await user.click(screen.getByText(/Login/i));
      
      // Fill in form
      await user.type(screen.getByPlaceholderText(/Username/i), 'testuser');
      await user.type(screen.getByPlaceholderText(/Password/i), 'wrongpass');
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /Login/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User Features', () => {
    beforeEach(() => {
      // Mock authenticated state
      localStorage.setItem('token', 'mock-token');
      
      // Mock profile response
      mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/profile') {
          return Promise.resolve({ data: { username: 'testuser', role: 'user' } });
        }
        return Promise.resolve({ data: [] });
      });
    });

    it('shows authenticated navigation when logged in', () => {
      render(<App />);
      
      expect(screen.getByText(/Logout/i)).toBeInTheDocument();
      expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
    });

    it('shows card management interface', () => {
      render(<App />);
      
      expect(screen.getByText(/Add a Card/i)).toBeInTheDocument();
      expect(screen.getByText(/Card Name/i)).toBeInTheDocument();
    });

    it('handles logout', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const logoutButton = screen.getByText(/Logout/i);
      await user.click(logoutButton);
      
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(screen.getByText(/Login/i)).toBeInTheDocument();
    });
  });

  describe('Card Management', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'mock-token');
      
      mockedAxios.get.mockImplementation((url) => {
        if (url === '/api/profile') {
          return Promise.resolve({ data: { username: 'testuser', role: 'user' } });
        }
        if (url === '/api/cards') {
          return Promise.resolve({ 
            data: [{ id: 1, card_name: 'Test Card of Testing', deck: 'Test Deck' }] 
          });
        }
        return Promise.resolve({ data: [] });
      });
    });

    it('displays existing cards', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/Test Card of Testing/i)).toBeInTheDocument();
      });
    });

    it('handles card addition', async () => {
      const user = userEvent.setup();
      
      mockedAxios.post.mockResolvedValueOnce({ data: { message: 'Card added' } });
      
      render(<App />);
      
      // Wait for form to be available
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      // Select a card and submit
      const cardSelect = screen.getByRole('combobox');
      await user.selectOptions(cardSelect, 'Test Card of Testing');
      
      const submitButton = screen.getByRole('button', { name: /Add Card/i });
      await user.click(submitButton);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/cards',
        expect.objectContaining({
          card_name: 'Test Card of Testing'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      
      render(<App />);
      
      // Component should still render despite API error
      expect(screen.getByText(/Card Tracker/i)).toBeInTheDocument();
    });

    it('shows error messages for failed operations', async () => {
      const user = userEvent.setup();
      
      localStorage.setItem('token', 'mock-token');
      mockedAxios.post.mockRejectedValue(new Error('Failed to add card'));
      
      render(<App />);
      
      // Wait for authenticated state
      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
      
      // Try to add a card
      const cardSelect = screen.getByRole('combobox');
      await user.selectOptions(cardSelect, 'Test Card of Testing');
      
      const submitButton = screen.getByRole('button', { name: /Add Card/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
