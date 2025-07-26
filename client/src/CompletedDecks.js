import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAutoRefresh } from './hooks';

function CompletedDecks() {
  const [decks, setDecks] = useState([]);
  const fetchDecks = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/completed-decks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      throw { response: { status: 401 } };
    }
    const data = await res.json();
    setDecks(Array.isArray(data) ? data : []);
    return data;
  };
  const { sessionExpired, loading, error } = useAutoRefresh(fetchDecks, 30000);
  if (sessionExpired) return <div className="session-expired">Session expired. Please log in again.</div>;

  return (
    <div className="completed-decks-card">
      <h2 className="section-header">Completed Decks</h2>
      {error && <div className="error">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>Deck</th>
            <th>Contributors</th>
            <th>Completed At</th>
            <th>Used For</th>
            <th>Sale Price</th>
            <th>Payout Split</th>
          </tr>
        </thead>
        <tbody>
          {decks.map(deck => (
            <tr key={deck.id}>
              <td>{deck.deck}</td>
              <td>{deck.contributors.map(c => c.owner).join(', ')}</td>
              <td>{new Date(deck.completed_at).toLocaleString()}</td>
              <td>{deck.disposition === 'sold' ? 'Sold' : deck.disposition === 'fulfilled' ? 'Fulfilled' : 'Unallocated'}</td>
              <td>{deck.disposition === 'sold' ? deck.salePrice || 'N/A' : '-'}</td>
              <td>
                {deck.disposition === 'sold' && deck.payouts ? (
                  <ul>
                    {deck.payouts.map(p => (
                      <li key={p.owner}>{p.owner}: {p.payout} gold</li>
                    ))}
                  </ul>
                ) : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CompletedDecks;
