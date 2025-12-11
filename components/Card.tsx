import React from 'react';
import { CardData } from '../types';
import { COLOR_MAP } from '../constants';

interface CardProps {
  card: CardData | null;
  onClick?: () => void;
  selected?: boolean;
  dimmed?: boolean;
  small?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, onClick, selected, dimmed, small, className = '' }) => {
  if (!card) {
    return (
      <div 
        onClick={onClick}
        className={`
          ${small ? 'w-10 h-14' : 'w-16 h-24 md:w-20 md:h-28'} 
          border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center 
          bg-slate-800/50 text-slate-500 cursor-pointer hover:border-slate-400 transition-colors
          ${className}
        `}
      >
        <span className="text-xl">+</span>
      </div>
    );
  }

  const colorClass = COLOR_MAP[card.color];
  const sizeClass = small ? 'w-8 h-12 text-sm font-bold' : 'w-16 h-24 md:w-20 md:h-28 text-2xl font-black';

  return (
    <div
      onClick={onClick}
      className={`
        ${sizeClass}
        ${colorClass}
        relative rounded-lg flex items-center justify-center shadow-md select-none
        transition-all duration-200 border-b-4
        ${selected ? 'ring-2 ring-white scale-105 -translate-y-1' : ''}
        ${dimmed ? 'opacity-25 grayscale' : 'hover:scale-105 active:scale-95 cursor-pointer'}
        ${className}
      `}
    >
      {card.number}
    </div>
  );
};

export default Card;
