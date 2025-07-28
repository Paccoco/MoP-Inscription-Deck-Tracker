import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

export function useFetchCards() {
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    axios.get('/api/cards')
      .then(res => setCards(res.data))
      .catch(() => setError('Error fetching cards'));
  }, []);
  return { cards, error };
}

export function useFetchDecks() {
  const [decks, setDecks] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/completed-decks', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setDecks(res.data))
      .catch(() => setError('Error fetching completed decks'));
  }, []);
  return { decks, error };
}

export function useFetchNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/notifications', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setNotifications(res.data))
      .catch(() => setError('Error fetching notifications'));
  }, []);
  return { notifications, error };
}

// Shared auto-refresh and session handling hook
export function useAutoRefresh(fetchFn, interval = 30000) {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef();

  const wrappedFetch = useCallback(async () => {
    if (!fetchFn) {
      setLoading(false);
      return null;
    }
    
    try {
      setError(null);
      const result = await fetchFn();
      setLoading(false);
      return result;
    } catch (err) {
      if (err.response?.status === 401 || err.message === 'Session expired') {
        setSessionExpired(true);
        clearInterval(intervalRef.current);
      } else {
        setError(err.message || 'An error occurred');
      }
      setLoading(false);
      return null;
    }
  }, [fetchFn]);

  useEffect(() => {
    if (!fetchFn) return;
    
    wrappedFetch();
    intervalRef.current = setInterval(wrappedFetch, interval);
    return () => clearInterval(intervalRef.current);
  }, [interval, wrappedFetch, fetchFn]);

  return { sessionExpired, loading, error };
}
