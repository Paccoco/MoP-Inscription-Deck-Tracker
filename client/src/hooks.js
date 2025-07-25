import { useState, useEffect } from 'react';
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
