import React, { useState, useEffect, useMemo } from 'react';
import { CardData, GameState } from './types';
import { FULL_DECK, STORAGE_KEY, COLORS } from './constants';
import DeckTracker from './components/DeckTracker';
import HandManager from './components/HandManager';
import { findBestMoves, analyzeDiscards } from './services/gameLogic';
import { RotateCcw, HelpCircle, Trophy, ArrowRightLeft } from 'lucide-react';

const INITIAL_STATE: GameState = {
  removedCardIds: new Set<string>(),
  handIds: [null, null, null, null, null],
  currentScore: 0,
};

function App() {
  const [removedCardIds, setRemovedCardIds] = useState<Set<string>>(INITIAL_STATE.removedCardIds);
  const [handIds, setHandIds] = useState<(string | null)[]>(INITIAL_STATE.handIds);
  const [currentScore, setCurrentScore] = useState<number>(INITIAL_STATE.currentScore);
  const [showHelp, setShowHelp] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRemovedCardIds(new Set(parsed.removedCardIds));
        setHandIds(parsed.handIds);
        setCurrentScore(parsed.currentScore);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    const state = {
      removedCardIds: Array.from(removedCardIds),
      handIds,
      currentScore
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [removedCardIds, handIds, currentScore]);

  // Reset Game
  const resetGame = () => {
    if (window.confirm("Are you sure you want to start a new game?")) {
      setRemovedCardIds(new Set());
      setHandIds([null, null, null, null, null]);
      setCurrentScore(0);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // --- Derived State ---

  const handCards = useMemo(() => {
    return handIds.map(id => (id ? FULL_DECK.find(c => c.id === id) || null : null));
  }, [handIds]);

  const activeHandCards = handCards.filter((c): c is CardData => c !== null);

  const availableCards = useMemo(() => {
    return FULL_DECK.filter(c => !removedCardIds.has(c.id) && !handIds.includes(c.id));
  }, [removedCardIds, handIds]);

  const bestMoves = useMemo(() => {
    return findBestMoves(activeHandCards);
  }, [activeHandCards]);

  const discardSuggestions = useMemo(() => {
    if (activeHandCards.length < 5) return [];
    return analyzeDiscards(activeHandCards, removedCardIds);
  }, [activeHandCards, removedCardIds]);


  // --- Handlers ---

  const handleToggleRemoved = (id: string) => {
    const newSet = new Set(removedCardIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
      setHandIds(prev => prev.map(hId => hId === id ? null : hId));
    }
    setRemovedCardIds(newSet);
  };

  const handleSetHandCard = (index: number, card: CardData) => {
    const newHand = [...handIds];
    newHand[index] = card.id;
    setHandIds(newHand);
  };

  const handleClearHandCard = (index: number) => {
    const newHand = [...handIds];
    newHand[index] = null;
    setHandIds(newHand);
  };

  const handleExecuteMove = (cards: CardData[], score: number) => {
    setCurrentScore(prev => prev + score);
    const newRemoved = new Set(removedCardIds);
    cards.forEach(c => newRemoved.add(c.id));
    setRemovedCardIds(newRemoved);
    const newHand = handIds.map(id => {
      if (id && cards.some(c => c.id === id)) return null;
      return id;
    });
    setHandIds(newHand);
  };

  const handleDiscard = (card: CardData) => {
    const newRemoved = new Set(removedCardIds);
    newRemoved.add(card.id);
    setRemovedCardIds(newRemoved);
    const newHand = handIds.map(id => id === card.id ? null : id);
    setHandIds(newHand);
  };

  const handleSortHand = () => {
    const sorted = [...activeHandCards].sort((a, b) => {
        // Sort by Color Index
        const colorDiff = COLORS.indexOf(a.color) - COLORS.indexOf(b.color);
        if (colorDiff !== 0) return colorDiff;
        // Then by Number
        return a.number - b.number;
    });

    // Reconstruct handIds with sorted cards first, then nulls
    const newHandIds = Array(5).fill(null);
    sorted.forEach((card, i) => {
        newHandIds[i] = card.id;
    });
    setHandIds(newHandIds);
  };

  // --- Dynamic Styles ---

  const getRankStyle = (score: number) => {
    if (score >= 400) return 'from-yellow-400 via-yellow-300 to-yellow-500 shadow-yellow-500/50'; // Gold
    if (score >= 300) return 'from-slate-300 via-slate-200 to-slate-400 shadow-slate-400/50'; // Silver
    return 'from-orange-700 via-orange-600 to-orange-800 shadow-orange-700/50'; // Bronze
  };

  const rankColor = getRankStyle(currentScore);

  return (
    <div className="min-h-screen bg-slate-900 pb-20 font-sans text-slate-100 selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700 sticky top-0 z-40 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-inner ring-1 ring-indigo-400/30">
               <span className="text-xl font-black text-indigo-100">O</span>
             </div>
             <div>
               <h1 className="font-bold text-lg leading-tight tracking-tight">Okey Master</h1>
               <p className="text-[10px] uppercase font-bold text-slate-500 hidden sm:block">Metin2 Companion</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
               <span className="text-[10px] uppercase font-bold text-slate-500">Current Score</span>
               <span className={`text-2xl font-mono font-bold leading-none ${currentScore >= 400 ? 'text-yellow-400' : currentScore >= 300 ? 'text-slate-200' : 'text-orange-400'}`}>
                 {currentScore}
               </span>
             </div>
             <button onClick={() => setShowHelp(true)} className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-700 rounded-full">
               <HelpCircle size={24} />
             </button>
          </div>
        </div>
        
        {/* Dynamic Goal Progress */}
        <div className="relative h-1.5 w-full bg-slate-900 overflow-hidden">
           <div 
             className={`absolute top-0 left-0 h-full bg-gradient-to-r transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${rankColor}`}
             style={{ width: `${Math.min(100, (currentScore / 450) * 100)}%` }}
           ></div>
           
           {/* Threshold Markers */}
           <div className="absolute top-0 left-[66%] h-full w-0.5 bg-slate-900/50 z-10" title="Silver Start (300)"></div>
           <div className="absolute top-0 left-[88%] h-full w-0.5 bg-slate-900/50 z-10" title="Gold Start (400)"></div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        
        {/* Helper Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setShowHelp(false)}>
            <div className="bg-slate-800 rounded-2xl max-w-lg w-full p-6 border border-slate-600 shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <h2 className="text-2xl font-bold mb-4 text-white">Strategy Guide</h2>
              <ul className="space-y-3 text-slate-300 list-disc pl-5 mb-6 text-sm leading-relaxed">
                <li><strong>Tracker:</strong> Monitor remaining cards to predict future draws.</li>
                <li><strong>Hand:</strong> Click slots to add cards. Use "Sort" to organize by color.</li>
                <li><strong>Greedy AI:</strong> The suggestions now prioritize <strong>HIGH SCORES</strong>. It may suggest discarding a "safe" card if holding another card could lead to a 6-7-8 Same Color (100 pts).</li>
                <li><strong>Goal:</strong> Aim for 400+ points for the Golden Chest.</li>
              </ul>
              
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 mb-6">
                <h3 className="font-bold text-white text-sm mb-2 uppercase tracking-wide">Scoring Reference</h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                    <div>
                        <span className="text-emerald-400 font-bold block mb-1">Straight Flush (+40)</span>
                        1-2-3 (50) ... 6-7-8 (100)
                    </div>
                    <div>
                        <span className="text-blue-400 font-bold block mb-1">Triples</span>
                        1,1,1 (20) ... 8,8,8 (90)
                    </div>
                </div>
              </div>

              <div className="text-right">
                <button onClick={() => setShowHelp(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg font-bold transition-transform active:scale-95">Let's Play</button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          
          {/* Main Hand Manager Area */}
          <section className="relative">
             <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                   Active Hand
                   <span className="text-xs font-bold text-slate-900 bg-slate-400 px-2 py-0.5 rounded-full">{activeHandCards.length}/5</span>
                </h2>
                <div className="flex gap-3">
                    <button 
                        onClick={handleSortHand}
                        disabled={activeHandCards.length === 0}
                        className="text-xs flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
                    >
                        <ArrowRightLeft size={14} /> Sort Hand
                    </button>
                    <button 
                        onClick={resetGame}
                        className="text-xs flex items-center gap-1.5 bg-slate-800 hover:bg-red-900/30 text-red-400 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                    >
                        <RotateCcw size={14} /> Reset
                    </button>
                </div>
             </div>
             
             <HandManager 
               hand={handCards}
               availableCards={availableCards}
               onSetCard={handleSetHandCard}
               onClearCard={handleClearHandCard}
               bestMoves={bestMoves}
               discardSuggestions={discardSuggestions}
               onExecuteMove={handleExecuteMove}
               onDiscard={handleDiscard}
             