import React, { useEffect, useState, useRef } from 'react';
import { useAutoRefresh } from './hooks';

function DeckRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef();

  const fetchRequests = async () => {
    const res = await fetch('/api/deck-requests', {
      headers: { Authorization: `Bearer ${localStorage.token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      throw { response: { status: 401 } };
    }
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
    return data;
  };

  const { sessionExpired, loading: autoLoading, error: autoError } = useAutoRefresh(fetchRequests, 30000); // Auto-refresh every 30s

  if (sessionExpired) {
    return <div className="session-expired">Session expired. Please log in again.</div>;
  }

  return (
    <div className="deck-requests">
      <h2>Deck Requests</h2>
      {loading || autoLoading ? (
        <p>Loading...</p>
      ) : error || autoError ? (
        <p style={{ color: 'red' }}>{error || autoError}</p>
      ) : requests.length === 0 ? (
        <p>No deck requests found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Deck</th>
              <th>User</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id}>
                <td>{r.deck}</td>
                <td>{r.username}</td>
                <td>{r.fulfilled ? 'Fulfilled' : 'Pending'}</td>
                <td>{new Date(r.requested_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DeckRequests;
