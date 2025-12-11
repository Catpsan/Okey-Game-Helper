import React, { useState, useEffect, useMemo } from 'react';
import { CardData, GameState, SimStats } from './types';
import { FULL_DECK, STORAGE_KEY } from './constants';
import DeckTracker from './components/DeckTracker';
import HandManager from './components/HandManager';
import { findBestMoves, analyzeDiscards } from './services/gameLogic';
import { runSimulation } from './services/simulation';
import { RotateCcw, HelpCircle, Trophy, LayoutGrid, Bot, Activity, X, Play, Settings2 } from 'lucide-react';

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
  const [gameVersion, setGameVersion] = useState(0);

  // Simulation State
  const [simStats, setSimStats] = useState<SimStats | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSimConfig, setShowSimConfig] = useState(false);
  const [simIterations, setSimIterations] = useState<number>(100);

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
  const resetGame = (skipConfirm = false) => {
    if (skipConfirm || window.confirm("Are you sure you want to start a new game?")) {
      setRemovedCardIds(new Set());
      setHandIds([null, null, null, null, null]);
      setCurrentScore(0);
      setGameVersion(v => v + 1);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Run Simulation Handler
  const handleRunSimulation = () => {
    setShowSimConfig(false);
    setIsSimulating(true);
    // Use timeout to allow UI to render loading state
    setTimeout(() => {
        const stats = runSimulation(simIterations);
        setSimStats(stats);
        setIsSimulating(false);
    }, 50);
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
    // Pass currentScore and enable chest calculation (true)
    return analyzeDiscards(activeHandCards, removedCardIds, currentScore, true);
  }, [activeHandCards, removedCardIds, currentScore]);

  const isDefeat = availableCards.length === 0 && bestMoves.length === 0 && activeHandCards.length > 0;
  const isVictory = availableCards.length === 0 && activeHandCards.length === 0;
  const showGameOverModal = isDefeat || isVictory;

  // --- Handlers ---

  // Smart Click Handler: The core of the new UX
  const handleSmartCardClick = (card: CardData) => {
    // 1. If in hand -> Remove from hand
    if (handIds.includes(card.id)) {
      setHandIds(prev => prev.map(id => id === card.id ? null : id));
      return;
    }
    
    // 2. If removed -> Un-remove (bring back to deck/availability)
    if (removedCardIds.has(card.id)) {
      const newRemoved = new Set(removedCardIds);
      newRemoved.delete(card.id);
      setRemovedCardIds(newRemoved);
      return;
    }

    // 3. If available -> Add to first empty slot in hand
    const emptyIndex = handIds.indexOf(null);
    if (emptyIndex !== -1) {
      const newHand = [...handIds];
      newHand[emptyIndex] = card.id;
      setHandIds(newHand);
    }
  };

  // Right Click: Toggle "Removed/Burned" status directly
  const handleSmartCardRightClick = (card: CardData) => {
    const newRemoved = new Set(removedCardIds);
    
    // If it's in hand, remove it from hand first
    if (handIds.includes(card.id)) {
       setHandIds(prev => prev.map(id => id === card.id ? null : id));
    }

    if (newRemoved.has(card.id)) {
      newRemoved.delete(card.id);
    } else {
      newRemoved.add(card.id);
    }
    setRemovedCardIds(newRemoved);
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
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        return a.number - b.number;
    });
    
    // Create new hand array with sorted cards filled first, then nulls
    const newHand = [null, null, null, null, null].map((_, idx) => sorted[idx] ? sorted[idx] ? sorted[idx].id : null : null);
    setHandIds(newHand as (string | null)[]);
  };

  const getRankStyle = (score: number) => {
    if (score >= 400) return 'from-yellow-400 via-yellow-300 to-yellow-500 shadow-yellow-500/50';
    if (score >= 300) return 'from-slate-300 via-slate-200 to-slate-400 shadow-slate-400/50';
    return 'from-orange-700 via-orange-600 to-orange-800 shadow-orange-700/50';
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden flex flex-col">
      
      {/* Centered Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-sm flex-none">
        <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-3 items-center">
          
          {/* Left: Logo */}
          <div className="flex items-center gap-2 justify-start">
             <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-inner">
               <span className="text-lg font-black text-indigo-100">O</span>
             </div>
             <h1 className="font-bold text-base leading-none hidden sm:block">Okey<br/><span className="text-slate-500 text-[10px] uppercase">Master</span></h1>
          </div>

          {/* Center: Score */}
          <div className="flex flex-col items-center justify-center">
             <span className={`text-2xl font-mono font-bold leading-none ${currentScore >= 400 ? 'text-yellow-400' : currentScore >= 300 ? 'text-slate-200' : 'text-orange-400'}`}>
               {currentScore}
             </span>
             <span className="text-[9px] uppercase font-bold text-slate-600 tracking-wider">Score</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 justify-end">
             <button onClick={() => setShowSimConfig(true)} disabled={isSimulating} className="p-2 text-slate-500 hover:text-emerald-400 transition-colors rounded-full hover:bg-slate-800 disabled:opacity-50" title="Run AI Simulation">
               {isSimulating ? <Activity size={18} className="animate-spin" /> : <Bot size={18} />}
             </button>
             <button onClick={() => resetGame()} className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-full hover:bg-slate-800" title="Reset Game">
                <RotateCcw size={18} />
             </button>
             <button onClick={() => setShowHelp(true)} className="p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-slate-800">
               <HelpCircle size={18} />
             </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="relative h-1 w-full bg-slate-900">
           <div 
             className={`absolute top-0 left-0 h-full bg-gradient-to-r transition-all duration-1000 ${getRankStyle(currentScore)}`}
             style={{ width: `${Math.min(100, (currentScore / 450) * 100)}%` }}
           ></div>
           <div className="absolute top-0 left-[66%] h-full w-px bg-white/20 z-10"></div>
           <div className="absolute top-0 left-[88%] h-full w-px bg-white/20 z-10"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center w-full max-w-7xl mx-auto px-2 sm:px-4 py-6">
        
        {/* Simulation Configuration Modal */}
        {showSimConfig && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowSimConfig(false)}>
              <div className="bg-slate-800 p-6 rounded-xl max-w-sm w-full border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                      <Bot className="text-emerald-400"/> Simulation Setup
                  </h3>
                  <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-400 mb-2">Number of Games</label>
                      <input 
                          type="number" 
                          min="1" 
                          max="100000"
                          value={simIterations}
                          onChange={(e) => {
                             const val = parseInt(e.target.value);
                             if (!isNaN(val)) setSimIterations(val);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                      />
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                          Enter how many games the AI should play to test the current strategy. 
                          <br/><span className="opacity-70">Recommended: 100 - 10,000</span>
                      </p>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setShowSimConfig(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2.5 rounded-lg font-bold transition-colors">Cancel</button>
                      <button onClick={handleRunSimulation} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2">
                          <Play size={16} fill="currentColor" /> Run
                      </button>
                  </div>
              </div>
            </div>
        )}

        {/* Simulation Stats Modal */}
        {simStats && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSimStats(null)}>
              <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                        <Bot size={20} className="text-emerald-400" />
                        AI Performance Report
                    </h3>
                    <button onClick={() => setSimStats(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-slate-900/50 p-3 rounded-lg text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold">Total Games</div>
                            <div className="text-xl font-mono text-white">{simStats.totalGames}</div>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg text-center">
                            <div className="text-xs text-slate-500 uppercase font-bold">Avg. Score</div>
                            <div className="text-xl font-mono text-emerald-400">{simStats.averageScore}</div>
                        </div>
                    </div>

                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Chest Distribution</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="w-16 text-xs font-bold text-yellow-400 text-right">GOLD</div>
                            <div className="flex-1 h-6 bg-slate-900 rounded-full overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-yellow-500/80" style={{ width: `${(simStats.goldCount / simStats.totalGames) * 100}%` }}></div>
                            </div>
                            <div className="w-10 text-xs font-mono text-slate-300 text-right">{simStats.goldCount}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-16 text-xs font-bold text-slate-300 text-right">SILVER</div>
                            <div className="flex-1 h-6 bg-slate-900 rounded-full overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-slate-400/80" style={{ width: `${(simStats.silverCount / simStats.totalGames) * 100}%` }}></div>
                            </div>
                            <div className="w-10 text-xs font-mono text-slate-300 text-right">{simStats.silverCount}</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-16 text-xs font-bold text-orange-400 text-right">BRONZE</div>
                            <div className="flex-1 h-6 bg-slate-900 rounded-full overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-orange-600/80" style={{ width: `${(simStats.bronzeCount / simStats.totalGames) * 100}%` }}></div>
                            </div>
                            <div className="w-10 text-xs font-mono text-slate-300 text-right">{simStats.bronzeCount}</div>
                        </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                         <div className="text-[10px] text-slate-500">Highest Score Achieved: <span className="text-emerald-400 font-bold">{simStats.highScore}</span></div>
                    </div>
                </div>
              </div>
            </div>
        )}

        {/* Game Over Modal */}
        {showGameOverModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-2xl max-w-sm w-full p-8 border border-slate-700 shadow-2xl text-center relative overflow-hidden">
               <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${getRankStyle(currentScore)}`}></div>
               <div className="relative z-10">
                  <h2 className="text-2xl font-black text-white mb-2">{isVictory ? "PERFECT CLEAR!" : "GAME OVER"}</h2>
                  <div className="text-5xl font-mono font-bold mb-4">{currentScore}</div>
                  <button onClick={() => resetGame(true)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors">
                    Restart
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowHelp(false)}>
            <div className="bg-slate-800 p-6 rounded-xl max-w-md w-full border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
               <h3 className="text-xl font-bold mb-4 text-center">Controls Guide</h3>
               <div className="space-y-4 text-sm text-slate-300 mb-6">
                 <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">L</div>
                    <div>
                        <span className="text-indigo-400 font-bold block">Left Click</span>
                        <span className="text-slate-400 text-xs">Add to hand / Remove from hand</span>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold shrink-0">R</div>
                    <div>
                        <span className="text-red-400 font-bold block">Right Click</span>
                        <span className="text-slate-400 text-xs">Burn / Remove permanently</span>
                    </div>
                 </div>
               </div>
               <button onClick={() => setShowHelp(false)} className="w-full bg-slate-700 hover:bg-slate-600 py-3 rounded-lg font-bold transition-colors">Close</button>
            </div>
          </div>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          
          {/* LEFT COLUMN: Game Board (Hand + Analysis) */}
          <div className="lg:col-span-7 flex flex-col gap-4 order-2 lg:order-1">
             <section className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-xl relative">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       Your Hand
                    </h2>
                    {activeHandCards.length > 0 && (
                        <button 
                            onClick={handleSortHand}
                            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded border border-slate-700 transition-colors flex items-center gap-1"
                        >
                            <LayoutGrid size={12} /> Sort
                        </button>
                    )}
                 </div>
                 
                 <HandManager 
                   key={gameVersion}
                   hand={handCards}
                   availableCards={availableCards}
                   onClearCard={(idx) => {
                       const newHand = [...handIds];
                       newHand[idx] = null;
                       setHandIds(newHand);
                   }}
                   bestMoves={bestMoves}
                   discardSuggestions={discardSuggestions}
                   onExecuteMove={handleExecuteMove}
                   onDiscard={handleDiscard}
                 />
             </section>
          </div>

          {/* RIGHT COLUMN: Deck Tracker / Input Source */}
          <div className="lg:col-span-5 order-1 lg:order-2">
             <div className="sticky top-24">
                 <DeckTracker 
                   key={gameVersion}
                   removedIds={removedCardIds}
                   handIds={handIds}
                   onCardClick={handleSmartCardClick}
                   onCardRightClick={handleSmartCardRightClick}
                 />
             </div>
          </div>

        </div>
      </main>

      {/* Golden Chest Indicator */}
      {currentScore >= 400 && !showGameOverModal && (
         <div className="fixed bottom-6 right-6 z-50 animate-bounce pointer-events-none">
            <Trophy size={32} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
         </div>
      )}
    </div>
  );
}

export default App;