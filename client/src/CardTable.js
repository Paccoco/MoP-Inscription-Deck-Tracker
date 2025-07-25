import React from 'react';

export default function CardTable({ cards }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Card Name</th>
          <th>Owner</th>
          <th>Deck</th>
        </tr>
      </thead>
      <tbody>
        {cards.map(card => (
          <tr key={card.id}>
            <td>{card.card_name}</td>
            <td>{card.owner}</td>
            <td>{card.deck}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
