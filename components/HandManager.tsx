import React from 'react';
import { CardData, ComboResult, DiscardSuggestion } from '../types';
import Card from './Card';
import { calculateScore } from '../services/gameLogic';
import { ArrowDown, Trash2, CheckCircle2, ShieldCheck } from 'lucide-react';

interface HandManagerProps {
  hand: (CardData | null)[];
  availableCards: CardData[];
  onSetCard: (index: number, card: CardData) => void;
  onClearCard: (index: number) => void;
  bestMoves: ComboResult[];
  discardSuggestions: DiscardSuggestion[];
  onExecuteMove: (cards: CardData[], score: number) => void;
  onDiscard: (card: CardData) => void;
}

const HandManager: React.FC<HandManagerProps> = ({
  hand,
  availableCards,
  onSetCard,
  onClearCard,
  bestMoves,
  discardSuggestions,
  onExecuteMove,
  onDiscard
}) => {
  const [selectingSlot, setSelectingSlot] = React.useState<number | null>(null);

  const filledHand = hand.filter((c): c is CardData => c !== null);
  const isFullHand = filledHand.length === 5;
  const bestMove = bestMoves[0];

  // Group available cards for selection modal
  const renderSelectionModal = () => {
    if (selectingSlot === null) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-slate-600 shadow-2xl">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
            <h3 className="text-xl font-bold text-white">Select Card</h3>
            <button 
              onClick={() => setSelectingSlot(null)}
              className="text-slate-400 hover:text-white px-3 py-1 rounded hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
          
          <div className="p-4 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
             {availableCards.map(card => (
               <div key={card.id} className="flex justify-center">
                 <Card 
                   card={card} 
                   small 
                   onClick={() => {
                     onSetCard(selectingSlot, card);
                     setSelectingSlot(null);
                   }}
                 />
               </div>
             ))}
             {availableCards.length === 0 && (
               <div className="col-span-full text-center text-slate-500 py-8">
                 No available cards in deck.
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSelectionModal()}

      {/* Hand Display */}
      <div className="flex justify-center gap-2 sm:gap-4 select-none">
        {hand.map((card, index) => {
           // Highlight card if it's part of the best move
           const isSuggested = bestMove && card && bestMove.cards.some(c => c.id === card.id);
           
           return (
             <div key={index} className="flex flex-col items-center gap-2">
                <div className="relative">
                  <Card 
                    card={card} 
                    onClick={() => setSelectingSlot(index)} 
                    selected={!!isSuggested}
                    className={isSuggested ? 'ring-4 ring-yellow-400/80 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
                  />
                  {card && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); onClearCard(index); }}
                      className="absolute -top-2 -right-2 bg-slate-700 hover:bg-red-500 text-white rounded-full p-0.5 border border-slate-500 shadow-md"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                
                {/* Individual Discard Action if Hand is Full and No Good Moves or User Choice */}
                {card && isFullHand && (
                  <button
                    onClick={() => onDiscard(card)}
                    className="text-[10px] uppercase font-bold tracking-wider text-slate-500 hover:text-red-400 bg-slate-800/50 px-2 py-1 rounded border border-transparent hover:border-red-900/50 transition-colors"
                  >
                    Discard
                  </button>
                )}
             </div>
           );
        })}
      </div>

      {/* Action Area */}
      {isFullHand ? (
        <div className="space-y-4">
          
          {/* 1. Best Move Suggestion */}
          {bestMove ? (
            <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-emerald-400 font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 size={20} />
                    Best Move Available!
                  </h4>
                  <p className="text-slate-300 text-sm mt-1">
                    Play <span className="font-bold text-white">{bestMove.type.toUpperCase()}</span> for <span className="text-yellow-400 font-bold text-xl">{bestMove.score}</span> points.
                  </p>
                </div>
                <button
                  onClick={() => onExecuteMove(bestMove.cards, bestMove.score)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg transform active:scale-95 transition-all"
                >
                  Play Move (+{bestMove.score})
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-2 bg-slate-800/50 rounded border border-slate-700 text-slate-400 text-sm">
              No combinations found. You must discard.
            </div>
          )}

          {/* 2. Discard Analytics */}
          {discardSuggestions.length > 0 && (
             <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
               <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-700 flex items-center gap-2">
                 <ArrowDown size={16} className="text-blue-400"/>
                 <h4 className="font-bold text-slate-200">Discard Analysis</h4>
                 <span className="text-xs text-slate-500 ml-auto">Simulated against remaining deck</span>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
                     <tr>
                       <th className="px-4 py-2">Discard</th>
                       <th className="px-4 py-2" title="Chance to get a valid move on next draw">Hit Prob</th>
                       <th className="px-4 py-2" title="How safe it is to discard (Higher = Safer)">Safety</th>
                       <th className="px-4 py-2" title="Average expected score">Exp. Val</th>
                       <th className="px-4 py-2 text-right">Action</th>
                     </tr>
                   </thead>
                   <tbody>
                     {discardSuggestions.map((sugg, idx) => (
                       <tr key={sugg.cardToRemove.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                         <td className="px-4 py-2 flex items-center gap-2">
                           <span className={`w-3 h-3 rounded-full ${sugg.cardToRemove.color === 'red' ? 'bg-red-500' : sugg.cardToRemove.color === 'blue' ? 'bg-blue-500' : 'bg-yellow-400'}`}></span>
                           <span className="font-mono font-bold text-slate-300">{sugg.cardToRemove.number}</span>
                           {idx === 0 && <span className="ml-2 text-[10px] bg-blue-900 text-blue-200 px-1.5 rounded">BEST</span>}
                         </td>
                         <td className="px-4 py-2">
                           <div className="flex items-center gap-2">
                             <span className={`${sugg.probability > 0.4 ? 'text-green-400' : 'text-slate-400'}`}>
                               {(sugg.probability * 100).toFixed(0)}%
                             </span>
                             <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                               <div className="h-full bg-blue-500" style={{ width: `${sugg.probability * 100}%` }}></div>
                             </div>
                           </div>
                         </td>
                         <td className="px-4 py-2">
                           <div className="flex items-center gap-2 text-slate-300">
                              <ShieldCheck size={14} className={sugg.safeDiscardScore >= 90 ? 'text-green-400' : sugg.safeDiscardScore < 80 ? 'text-orange-400' : 'text-slate-500'}/>
                              <span>{sugg.safeDiscardScore}</span>
                           </div>
                         </td>
                         <td className="px-4 py-2 font-mono text-slate-400">
                           {sugg.averagePotentialScore.toFixed(1)}
                         </td>
                         <td className="px-4 py-2 text-right">
                           <button
                             onClick={() => onDiscard(sugg.cardToRemove)}
                             className="text-xs bg-slate-700 hover:bg-red-500/80 hover:text-white text-slate-300 px-2 py-1 rounded transition-colors"
                           >
                             Discard
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}
          
        </div>
      ) : (
        <div className="text-center p-8 border-2 border-dashed border-slate-700 rounded-xl text-slate-500 bg-slate-800/20">
          <p>Select {5 - filledHand.length} more cards to analyze options</p>
        </div>
      )}
    </div>
  );
};

export default HandManager;