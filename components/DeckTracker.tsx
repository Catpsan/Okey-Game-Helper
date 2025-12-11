import React from 'react';
import { COLORS, FULL_DECK } from '../constants';
import Card from './Card';

interface DeckTrackerProps {
  removedIds: Set<string>;
  handIds: (string | null)[];
  onToggle: (id: string) => void;
}

const DeckTracker: React.FC<DeckTrackerProps> = ({ removedIds, handIds, onToggle }) => {
  const isAvailable = (id: string) => !removedIds.has(id);
  const isInHand = (id: string) => handIds.includes(id);

  // Group cards by color for rows
  const getCardsByColor = (color: string) => FULL_DECK.filter(c => c.color === color);

  // Map backend color to Tailwind Text/Border colors for headers
  const headerColorMap: Record<string, string> = {
    red: 'text-red-400 border-red-500/30',
    blue: 'text-blue-400 border-blue-500/30',
    yellow: 'text-yellow-400 border-yellow-500/30'
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
        <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <span>Card Tracker</span>
        </h3>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Remaining
            </span>
            <span className="text-2xl font-mono font-bold text-emerald-400 drop-shadow-sm">
                {24 - removedIds.size}
                <span className="text-slate-500 text-lg">/24</span>
            </span>
        </div>
      </div>

      <div className="space-y-4">
        {COLORS.map(color => (
          <div key={color} className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-700/30">
            {/* Color Label */}
            <div className={`w-full sm:w-20 text-center uppercase font-bold text-xs tracking-wider border-b-2 sm:border-b-0 sm:border-r-2 ${headerColorMap[color]} pb-2 sm:pb-0 sm:pr-4`}>
                {color}
            </div>
            
            {/* Cards Row */}
            <div className="flex flex-wrap justify-center gap-2 flex-1">
                {getCardsByColor(color).map((card) => {
                const gone = !isAvailable(card.id);
                const inHand = isInHand(card.id);
                
                return (
                    <div key={card.id} className="relative group">
                    <Card 
                        card={card} 
                        small 
                        dimmed={gone} 
                        onClick={() => onToggle(card.id)}
                        className={`transition-all duration-300 ${inHand ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900 scale-110 z-10' : ''}`}
                    />
                    {/* Status Indicator Overlay */}
                    {gone && (
                        <div className="absolute inset-0 bg-slate-900/60 rounded-lg flex items-center justify-center pointer-events-none backdrop-grayscale">
                            <span className="text-slate-500 font-bold text-lg">✕</span>
                        </div>
                    )}
                    </div>
                );
                })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center">
        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
            Click cards above to correct mistakes
        </span>
      </div>
    </div>
  );
};

export default DeckTracker;