import { CardData, ComboResult, DiscardSuggestion } from '../types';
import { FULL_DECK } from '../constants';

// --- Scoring Logic ---

const getSequenceBaseScore = (startNum: number): number => {
  // 1-2-3=10, 2-3-4=20, ... 6-7-8=60
  // Formula: (StartNum - 1) * 10 + 10  => StartNum * 10
  return startNum * 10;
};

const getTripleScore = (num: number): number => {
  // 1=20, 2=30, ... 8=90
  // Formula: num * 10 + 10
  return num * 10 + 10;
};

export const calculateScore = (cards: CardData[]): ComboResult => {
  if (cards.length !== 3) return { cards, score: 0, type: 'none' };

  const sorted = [...cards].sort((a, b) => a.number - b.number);
  const c1 = sorted[0];
  const c2 = sorted[1];
  const c3 = sorted[2];

  const sameColor = c1.color === c2.color && c2.color === c3.color;
  const distinctColors = c1.color !== c2.color && c1.color !== c3.color && c2.color !== c3.color;
  
  const consecutive = c2.number === c1.number + 1 && c3.number === c2.number + 1;
  const sameNumber = c1.number === c2.number && c2.number === c3.number;

  // Check Sequence
  if (consecutive) {
    let score = getSequenceBaseScore(c1.number);
    if (sameColor) score += 40;
    return { cards: sorted, score, type: 'sequence', isSameColor: sameColor };
  }

  // Check Triple
  if (sameNumber && distinctColors) {
    return { cards: sorted, score: getTripleScore(c1.number), type: 'triple' };
  }

  return { cards, score: 0, type: 'none' };
};

// --- Combinatorics ---

// Helper to get all combinations of size k from array
function getCombinations<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function fork(target: T[], source: T[]) {
    if (target.length === size) {
      result.push(target);
      return;
    }
    source.forEach((el, idx) => fork([...target, el], source.slice(idx + 1)));
  }
  fork([], array);
  return result;
}

export const findBestMoves = (hand: CardData[]): ComboResult[] => {
  if (hand.length < 3) return [];
  const combos = getCombinations(hand, 3);
  const scoredCombos = combos
    .map(c => calculateScore(c))
    .filter(res => res.score > 0)
    .sort((a, b) => b.score - a.score); // Descending score
  return scoredCombos;
};

// --- AI / Prediction ---

export const analyzeDiscards = (
  currentHand: CardData[],
  removedCardIds: Set<string>
): DiscardSuggestion[] => {
  // Remaining deck = Full Deck - Removed - Current Hand
  const currentHandIds = new Set(currentHand.map(c => c.id));
  const remainingDeck = FULL_DECK.filter(
    c => !removedCardIds.has(c.id) && !currentHandIds.has(c.id)
  );

  if (remainingDeck.length === 0) return [];

  const suggestions: DiscardSuggestion[] = [];

  // Try discarding each card in hand
  for (const cardToRemove of currentHand) {
    const tempHandBase = currentHand.filter(c => c.id !== cardToRemove.id);
    
    // 1. Immediate Utility Analysis (Simulation)
    let totalMaxScore = 0;
    let winningOuts = 0;
    let maxPossibleScore = 0;

    // Simulate drawing every possible remaining card
    for (const drawnCard of remainingDeck) {
      const simulatedHand = [...tempHandBase, drawnCard];
      const moves = findBestMoves(simulatedHand);
      
      if (moves.length > 0) {
        const score = moves[0].score;
        totalMaxScore += score; // Assume player takes best move
        winningOuts++;
        if (score > maxPossibleScore) {
            maxPossibleScore = score;
        }
      }
    }

    // 2. Long-term Safety Analysis (Potential future combos lost)
    // Count how many pairs in remainingDeck form a valid combo with cardToRemove
    let lostCombos = 0;
    let lostHighValueCombos = 0;

    if (remainingDeck.length >= 2) {
      const remainingPairs = getCombinations(remainingDeck, 2);
      for (const pair of remainingPairs) {
        const result = calculateScore([cardToRemove, ...pair]);
        if (result.score > 0) {
          lostCombos++;
          // Heavily weight losing a 6-7-8 Same Color or High Triple
          if (result.score >= 90) {
            lostHighValueCombos++;
          }
        }
      }
    }
    
    // safeDiscardScore: Higher is better (safer).
    // Penalize heavily for losing high value combos
    const safeDiscardScore = Math.max(0, 100 - lostCombos - (lostHighValueCombos * 10));

    suggestions.push({
      cardToRemove,
      probability: winningOuts / remainingDeck.length,
      averagePotentialScore: winningOuts > 0 ? totalMaxScore / remainingDeck.length : 0,
      maxPossibleScore,
      outs: winningOuts,
      safeDiscardScore
    });
  }

  // STRATEGY SORTING:
  // To reach 400+, we need to prioritize MAX potential score.
  // We should NOT discard a card that allows a 100pt hand just because it has low probability,
  // unless the alternative is also good.
  
  return suggestions.sort((a, b) => {
    // 1. If one card allows for a Massive score (e.g. 90-100) and the other doesn't,
    // we should really try to keep the high score card (so we want to discard the LOW score card).
    // So if A has Max 100 and B has Max 40, we want to discard B.
    // Sort descending by "Desirability to Keep".
    // Discard Suggestion list is "Best to Discard" first.
    // So we want the card with LOWER max potential to be first.
    
    const aMax = a.maxPossibleScore;
    const bMax = b.maxPossibleScore;

    // If there is a huge disparity in max potential (e.g. keeping a 1 vs keeping a 7), 
    // prioritize getting rid of the low potential one.
    if (Math.abs(bMax - aMax) >= 30) {
        return aMax - bMax; // Discard the one with lower max potential
    }

    // 2. If max potentials are similar, look at Probability (Survival)
    if (Math.abs(b.probability - a.probability) > 0.15) {
      return b.probability - a.probability;
    }

    // 3. Fallback to Safe Discard Score (Don't break future combos)
    return b.safeDiscardScore - a.safeDiscardScore;
  });
};