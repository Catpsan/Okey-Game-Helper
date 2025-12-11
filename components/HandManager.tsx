import React from 'react';
import { CardData, ComboResult, DiscardSuggestion } from '../types';
import Card from './Card';
import { COLORS, COLOR_MAP } from '../constants';
import { ArrowRight, Trash2, CheckCircle2, Zap, AlertTriangle, Info, Target, BarChart3 } from 'lucide-react';

interface HandManagerProps {
  hand: (CardData | null)[];
  availableCards: CardData[];
  onClearCard: (index: number) => void;
  bestMoves: ComboResult[];
  discardSuggestions: DiscardSuggestion[];
  onExecuteMove: (cards: CardData[], score: number) => void;
  onDiscard: (card: CardData) => void;
}

const HandManager: React.FC<HandManagerProps> = ({
  hand,
  availableCards,
  onClearCard,
  bestMoves,
  discardSuggestions,
  onExecuteMove,
  onDiscard
}) => {
  const filledHand = hand.filter((c): c is CardData => c !== null);
  const isFullHand = filledHand.length === 5;
  const isEndGame = availableCards.length === 0;
  
  const showControls = isFullHand || (isEndGame && filledHand.length > 0);
  const bestMove = bestMoves[0];

  const getTextClass = (color: string) => {
    if (color === 'red') return 'text-red-400';
    if (color === 'blue') return 'text-blue-400';
    if (color === 'yellow') return 'text-yellow-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-6">
      
      {/* Hand Display */}
      <div className="flex justify-center gap-2 sm:gap-3 select-none min-h-[120px]">
        {hand.map((card, index) => {
           const isSuggested = bestMove && card && bestMove.cards.some(c => c.id === card.id);
           
           return (
             <div key={index} className="flex flex-col items-center gap-2 group relative">
                  {card ? (
                    <>
                      <Card 
                        card={card} 
                        selected={!!isSuggested}
                        className={`
                            ${isSuggested ? 'ring-4 ring-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'ring-1 ring-slate-700 shadow-xl'}
                        `}
                      />
                      {/* Hover Actions */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); onClearCard(index); }}
                        className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-full p-1.5 border border-slate-600 shadow-md opacity-0 group-hover:opacity-100 transition-all scale-75 z-20"
                        title="Remove from hand"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      {showControls && (
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all z-20">
                             <button
                               onClick={() => onDiscard(card)}
                               className="text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-red-900/80 hover:text-red-200 px-2 py-1 rounded border border-slate-600 shadow-lg whitespace-nowrap"
                             >
                               Discard
                             </button>
                          </div>
                      )}
                    </>
                  ) : (
                    <div 
                      className="w-16 h-24 md:w-20 md:h-28 border-2 border-dashed border-slate-700/50 rounded-lg flex flex-col items-center justify-center bg-slate-800/20 text-slate-600"
                    >
                      <span className="text-2xl opacity-50">+</span>
                    </div>
                  )}
             </div>
           );
        })}
      </div>

      {/* Action Area */}
      {showControls ? (
        <div className="space-y-4">
          
          {/* 1. Best Move Banner */}
          {bestMove ? (
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 flex items-center justify-between shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 size={20} />
                   </div>
                   <div>
                      <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Recommended Move</div>
                      <div className="text-white font-medium text-sm">
                        {bestMove.type === 'sequence' ? 'Sequence' : 'Triple'} <span className="text-slate-400">({bestMove.score} pts)</span>
                      </div>
                   </div>
                </div>
                <button
                    onClick={() => onExecuteMove(bestMove.cards, bestMove.score)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-md shadow transition-colors"
                >
                    PLAY MOVE
                </button>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
               <AlertTriangle size={14} className="text-amber-500"/>
               {isEndGame ? "No combinations. Clear hand to finish." : "No combinations. Please discard a card."}
            </div>
          )}

          {/* 2. Compact Discard Suggestions */}
          {discardSuggestions.length > 0 && (
             <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg overflow-hidden">
               <div className="bg-slate-900/30 px-3 py-2 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      Discard Suggestions <Info size={10} className="text-slate-600"/>
                  </span>
                  <span className="text-[10px] text-slate-600">Preserves best long-term potential</span>
               </div>
               
               <div className="divide-y divide-slate-800/50">
                 {discardSuggestions.slice(0, 3).map((sugg, idx) => { // Only show top 3
                   const isBest = idx === 0;
                   return (
                       <div key={sugg.cardToRemove.id} className={`p-2 ${isBest ? 'bg-indigo-500/5' : ''}`}>
                         <div className="flex items-center justify-between">
                            {/* Card Info */}
                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-8 rounded flex items-center justify-center text-[10px] font-bold border shadow-sm ${COLOR_MAP[sugg.cardToRemove.color]}`}>
                                    {sugg.cardToRemove.number}
                                </div>
                                <div className="flex flex-col">
                                    {isBest && <span className="text-[9px] font-bold text-indigo-400 uppercase leading-none mb-0.5">Best Discard</span>}
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] uppercase font-bold text-slate-600">Win Prob</span>
                                        <span className={`font-mono font-bold ${sugg.probability > 0.5 ? 'text-emerald-400' : 'text-slate-300'}`}>
                                            {(sugg.probability * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs">
                                <div className="text-right">
                                    <span className="block text-[8px] font-bold text-slate-600 uppercase">Exp. Score</span>
                                    <div className="flex items-center gap-1 justify-end font-mono">
                                    <Zap size={10} className={sugg.averagePotentialScore > 50 ? 'text-yellow-500' : 'text-slate-600'} />
                                    <span className="text-slate-300">{Math.round(sugg.averagePotentialScore)}</span>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => onDiscard(sugg.cardToRemove)}
                                    className={`p-1.5 rounded transition-colors ${isBest ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'}`}
                                    title="Discard this card"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                         </div>
                         
                         {/* Chest Probabilities Bar */}
                         {sugg.chestProbabilities && (
                             <div className="mt-2 mb-1">
                                <div className="flex justify-between text-[8px] uppercase font-bold text-slate-500 mb-0.5">
                                    <span>Chest Probability</span>
                                </div>
                                <div className="flex h-1.5 rounded-full overflow-hidden bg-slate-900 w-full">
                                    {sugg.chestProbabilities.gold > 0 && (
                                        <div className="bg-yellow-400" style={{ width: `${sugg.chestProbabilities.gold}%` }} title={`Gold: ${sugg.chestProbabilities.gold}%`}></div>
                                    )}
                                    {sugg.chestProbabilities.silver > 0 && (
                                        <div className="bg-slate-400" style={{ width: `${sugg.chestProbabilities.silver}%` }} title={`Silver: ${sugg.chestProbabilities.silver}%`}></div>
                                    )}
                                    {sugg.chestProbabilities.bronze > 0 && (
                                        <div className="bg-orange-600" style={{ width: `${sugg.chestProbabilities.bronze}%` }} title={`Bronze: ${sugg.chestProbabilities.bronze}%`}></div>
                                    )}
                                </div>
                                <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5">
                                    <span className={sugg.chestProbabilities.gold > 0 ? 'text-yellow-500' : ''}>{sugg.chestProbabilities.gold}% G</span>
                                    <span className={sugg.chestProbabilities.silver > 0 ? 'text-slate-300' : ''}>{sugg.chestProbabilities.silver}% S</span>
                                    <span className={sugg.chestProbabilities.bronze > 0 ? 'text-orange-500' : ''}>{sugg.chestProbabilities.bronze}% B</span>
                                </div>
                             </div>
                         )}

                         {/* Prediction / Next Play Strategy */}
                         {isBest && sugg.prediction && (
                            <div className="mt-2 bg-slate-900/50 rounded-md p-2 border border-indigo-500/20 flex items-center gap-3 shadow-inner">
                               <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0">
                                  <Target size={12} />
                               </div>
                               <div className="flex flex-col gap-0.5">
                                   <div className="text-[9px] font-bold text-indigo-300 uppercase tracking-wide leading-none">
                                      Next Play Prediction
                                   </div>
                                   <div className="flex items-center gap-1 text-[11px] leading-none mt-0.5">
                                      <span className="text-slate-500">Keep</span>
                                      {sugg.prediction.keptCards.map(c => (
                                          <span key={c.id} className={`font-bold ${getTextClass(c.color)}`}>{c.number}</span>
                                      ))}
                                      <span className="text-slate-500">for</span>
                                      <span className={`font-bold ${getTextClass(sugg.prediction.neededCard.color)}`}>{sugg.prediction.neededCard.number}</span>
                                      <span className="text-slate-400 font-mono ml-1">({sugg.prediction.score}pts)</span>
                                   </div>
                               </div>
                            </div>
                         )}
                       </div>
                   );
                 })}
               </div>
               
               {/* Legend / Helper */}
               <div className="p-2 bg-slate-900/20 text-[9px] text-slate-500 border-t border-slate-800/50">
                  <div className="flex gap-4 justify-center mb-1">
                      <span><strong>Win Prob:</strong> Chance to form a set on the <em>very next draw</em>.</span>
                  </div>
                  <div className="flex gap-4 justify-center">
                       <span><strong>Chest Prob:</strong> Estimated chance to get Gold/Silver/Bronze at end of game.</span>
                  </div>
               </div>
             </div>
          )}
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center justify-center text-slate-500 text-center border-t border-slate-800 mt-2">
            <p className="text-sm font-medium mb-1">Fill your hand</p>
            <p className="text-xs opacity-60 max-w-[200px]">Click available cards in the deck tracker to add them.</p>
        </div>
      )}
    </div>
  );
};

export default HandManager;