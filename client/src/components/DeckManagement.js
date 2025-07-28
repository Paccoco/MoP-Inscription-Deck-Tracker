import React from 'react';

function DeckManagement({ 
  completedDecks, 
  selectedDeckId, 
  setSelectedDeckId, 
  disposition, 
  setDisposition, 
  recipient, 
  setRecipient, 
  salePrice, 
  setSalePrice, 
  payouts, 
  guildCut, 
  handleCompleteDeck 
}) {
  return (
    <div className="table-card">
      <h3>Complete Deck</h3>
      <form onSubmit={handleCompleteDeck}>
        <select value={selectedDeckId} onChange={e => setSelectedDeckId(e.target.value)} required>
          <option value="">Select Completed Deck</option>
          {completedDecks.map(deck => (
            <option key={deck.id} value={deck.id}>
              {deck.deck} (Completed: {new Date(deck.completed_at).toLocaleDateString()})
            </option>
          ))}
        </select>
        
        <select value={disposition} onChange={e => setDisposition(e.target.value)} required>
          <option value="fulfilled">Fulfill Deck Request</option>
          <option value="sold">Sell Deck</option>
        </select>
        
        {disposition === 'fulfilled' && (
          <input
            type="text"
            placeholder="Recipient username"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            required
          />
        )}
        
        {disposition === 'sold' && (
          <>
            <input
              type="number"
              placeholder="Sale price in gold"
              value={salePrice}
              onChange={e => setSalePrice(e.target.value)}
              required
            />
            {payouts && (
              <div>
                <h4>Calculated Payouts:</h4>
                <ul>
                  {payouts.map(p => (
                    <li key={p.owner}>{p.owner}: {p.payout} gold</li>
                  ))}
                  {guildCut && <li>Guild Cut: {guildCut} gold</li>}
                </ul>
              </div>
            )}
          </>
        )}
        
        <button type="submit">Process Deck</button>
      </form>
      
      <h3>Processed Decks</h3>
      <table>
        <thead>
          <tr>
            <th>Deck</th>
            <th>Contributors</th>
            <th>Completed At</th>
            <th>Disposition</th>
            <th>Recipient</th>
          </tr>
        </thead>
        <tbody>
          {completedDecks.length === 0 ? (
            <tr><td colSpan="5">No completed decks found.</td></tr>
          ) : completedDecks.map(deck => (
            <tr key={deck.id}>
              <td>{deck.deck}</td>
              <td>{JSON.parse(deck.contributors).map(c => c.owner).join(', ')}</td>
              <td>{new Date(deck.completed_at).toLocaleString()}</td>
              <td>{deck.disposition}</td>
              <td>{deck.recipient || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DeckManagement;
