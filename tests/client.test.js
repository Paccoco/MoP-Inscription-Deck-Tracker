// Basic React component smoke test using @testing-library/react
import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../client/src/App';

test('renders Card Tracker header', () => {
  render(<App />);
  expect(screen.getByText(/Card Tracker/i)).toBeInTheDocument();
});

test('renders Notifications link', () => {
  render(<App />);
  expect(screen.getByText(/Notifications/i)).toBeInTheDocument();
});
