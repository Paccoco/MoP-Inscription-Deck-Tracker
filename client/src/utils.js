// Utility functions for deck status and contributor breakdown
export function getDeckStatus(cards, DECK_NAMES, CARD_NAMES) {
  const deckStatus = {};
  DECK_NAMES.forEach(deck => {
    const deckCards = CARD_NAMES.filter(name => name.includes(deck.split(' ')[0]));
    const ownedCards = cards.filter(card => card.deck === deck).map(card => card.card_name);
    const missing = deckCards.filter(name => !ownedCards.includes(name));
    deckStatus[deck] = {
      complete: missing.length === 0,
      missing,
      owned: ownedCards.length
    };
  });
  return deckStatus;
}

export function getContributorBreakdown(contributors) {
  const total = contributors.length;
  const byOwner = {};
  contributors.forEach(c => {
    byOwner[c.owner] = (byOwner[c.owner] || 0) + 1;
  });
  return { total, byOwner };
}
