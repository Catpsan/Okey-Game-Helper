import React from 'react';
import { COLORS, FULL_DECK } from '../constants';
import { CardData } from '../types';
import Card from './Card';
import { MousePointer2, Trash2 } from 'lucide-react';

interface DeckTrackerProps {
  removedIds: Set<string>;
  handIds: (string | null)[];
  onCardClick: (card: CardData) => void;
  onCardRightClick: (card: CardData) => void;
}

const DeckTracker: React.FC<DeckTrackerProps> = ({ removedIds, handIds, onCardClick, onCardRightClick }) => {
  const isAvailable = (id: string) => !removedIds.has(id) && !handIds.includes(id);
  const isInHand = (id: string) => handIds.includes(id);

  // Group cards by color for rows
  const getCardsByColor = (color: string) => FULL_DECK.filter(c => c.color === color);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
          Deck &amp; Input
        </h3>
        <div className="text-xs font-mono">
            <span className="text-emerald-400 font-bold">{24 - removedIds.size}</span>
            <span className="text-slate-600">/24</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {COLORS.map(color => (
          <div key={color} className="flex items-center gap-3">
            {/* Color Label */}
            <div className={`w-6 flex justify-center shrink-0`}>
                <div className={`w-3 h-3 rounded-full ${color === 'red' ? 'bg-red-500' : color === 'blue' ? 'bg-blue-500' : 'bg-yellow-400'} shadow-sm`}></div>
            </div>
            
            {/* Cards Row - Centered */}
            <div className="flex flex-wrap gap-1.5 flex-1 justify-center content-center">
                {getCardsByColor(color).map((card) => {
                const gone = removedIds.has(card.id);
                const inHand = isInHand(card.id);
                
                return (
                    <div 
                        key={card.id} 
                        className="relative group"
                        onContextMenu={(e) => {
                            e.preventDefault();
                            onCardRightClick(card);
                        }}
                    >
                        <Card 
                            card={card} 
                            small 
                            dimmed={gone} 
                            onClick={() => onCardClick(card)}
                            className={`
                                transition-all duration-150
                                ${inHand ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-slate-800 scale-105 z-10 brightness-110' : ''}
                                ${gone ? 'opacity-20 scale-90 grayscale' : 'hover:scale-110 hover:z-20 hover:brightness-125'}
                            `}
                        />
                    </div>
                );
                })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Interaction Legend */}
      <div className="bg-slate-900/80 px-4 py-2 border-t border-slate-800 flex justify-around text-[10px] text-slate-400 font-medium uppercase tracking-wide">
         <div className="flex items-center gap-1.5">
            <MousePointer2 size={12} className="text-indigo-400" />
            <span>Click to Add</span>
         </div>
         <div className="w-px bg-slate-700 h-3"></div>
         <div className="flex items-center gap-1.5">
            <Trash2 size={12} className="text-red-400" />
            <span>R-Click to Burn</span>
         </div>
      </div>
    </div>
  );
};

export default DeckTracker;