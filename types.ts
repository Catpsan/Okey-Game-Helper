export type CardColor = 'red' | 'blue' | 'yellow';
export type CardNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface CardData {
  id: string;
  color: CardColor;
  number: CardNumber;
}

export interface ComboResult {
  cards: CardData[];
  score: number;
  type: 'triple' | 'sequence' | 'none';
  isSameColor?: boolean;
}

export interface DiscardSuggestion {
  cardToRemove: CardData;
  probability: number; // 0-1
  averagePotentialScore: number;
  maxPossibleScore: number; // The single highest score achievable with this card remaining
  outs: number; // Number of cards in deck that create a combo
  safeDiscardScore: number; // Higher means safer to discard (fewer potential combos lost)
}

export interface GameState {
  removedCardIds: Set<string>; // Cards permanently gone from the game
  handIds: (string | null)[]; // The 5 current slots (or null if empty)
  currentScore: number;
}