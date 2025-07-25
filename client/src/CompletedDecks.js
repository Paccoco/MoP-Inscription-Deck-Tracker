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
    <div className="completed-decks-container">
      <h2>Completed Decks</h2>
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
              <td>
                {deck.deck}
                {/* Deck Completion Progress Bar */}
                {typeof deck.collectedCards === 'number' && typeof deck.totalCards === 'number' ? (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ background: '#eee', borderRadius: '4px', height: '16px', width: '100%' }}>
                      <div
                        style={{
                          width: `${Math.round((deck.collectedCards / deck.totalCards) * 100)}%`,
                          background: '#4caf50',
                          height: '100%',
                          borderRadius: '4px',
                          transition: 'width 0.5s',
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '12px' }}>
                      {deck.collectedCards} / {deck.totalCards} cards ({Math.round((deck.collectedCards / deck.totalCards) * 100)}%)
                    </span>
                  </div>
                ) : null}
              </td>
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
