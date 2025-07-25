import React, { useEffect, useState } from 'react';
import axios from 'axios';

function CompletedDecks() {
  const [decks, setDecks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/completed-decks', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setDecks(res.data))
      .catch(err => setError('Failed to load completed decks'));
  }, []);

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
