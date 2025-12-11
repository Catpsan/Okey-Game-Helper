import { CardData, SimStats } from '../types';
import { FULL_DECK } from '../constants';
import { findBestMoves, analyzeDiscards, shuffle } from './gameLogic';

export const runSimulation = (iterations: number = 100): SimStats => {
    const scores: number[] = [];

    for (let i = 0; i < iterations; i++) {
        // --- Setup Single Game ---
        let deck = shuffle(FULL_DECK);
        let hand: CardData[] = [];
        let removedIds = new Set<string>(); // Tracks played AND discarded cards
        let score = 0;

        let gameActive = true;

        while (gameActive) {
            // 1. Refill Hand Phase
            while (hand.length < 5 && deck.length > 0) {
                const card = deck.pop()!;
                hand.push(card);
            }

            // 2. End Condition Check
            if (hand.length < 3 && deck.length === 0) {
                gameActive = false;
                break;
            }

            // 3. Action Phase
            const moves = findBestMoves(hand);

            if (moves.length > 0) {
                const bestMove = moves[0];
                score += bestMove.score;
                
                const playedIds = new Set(bestMove.cards.map(c => c.id));
                hand = hand.filter(c => !playedIds.has(c.id));
                bestMove.cards.forEach(c => removedIds.add(c.id));
            } else {
                if (deck.length === 0) {
                    gameActive = false;
                    break;
                }

                // AI Discard Decision - Pass 'false' for chest stats to avoid recursion/perf issues
                const suggestions = analyzeDiscards(hand, removedIds, score, false);
                
                if (suggestions.length > 0) {
                    const bestChoice = suggestions[0];
                    removedIds.add(bestChoice.cardToRemove.id);
                    hand = hand.filter(c => c.id !== bestChoice.cardToRemove.id);
                } else {
                    gameActive = false;
                }
            }
        }
        scores.push(score);
    }

    // --- Aggregate Stats ---
    const totalScore = scores.reduce((acc, curr) => acc + curr, 0);
    const bronze = scores.filter(s => s < 300).length;
    const silver = scores.filter(s => s >= 300 && s < 400).length;
    const gold = scores.filter(s => s >= 400).length;
    const max = Math.max(...scores);

    return {
        totalGames: iterations,
        averageScore: Math.round(totalScore / iterations),
        highScore: max,
        bronzeCount: bronze,
        silverCount: silver,
        goldCount: gold
    };
};