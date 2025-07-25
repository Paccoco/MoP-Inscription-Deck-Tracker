import React from 'react';

export default function DeckTable({ decks }) {
  return (
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
  );
}
