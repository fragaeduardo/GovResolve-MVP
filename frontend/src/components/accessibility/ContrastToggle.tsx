import React from 'react';
import { IconContrast } from '../common/Icons';

interface ContrastToggleProps {
  isHighContrast: boolean;
  onToggle: () => void;
}

export const ContrastToggle: React.FC<ContrastToggleProps> = ({
  isHighContrast,
  onToggle
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isHighContrast}
      aria-label="Alto contraste (WCAG AAA / e-MAG)"
      title="Alternar modo de alto contraste acessível"
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f4a261] header-contrast-toggle shrink-0 ${
        isHighContrast
          ? 'bg-yellow-300 text-black border-2 border-yellow-300 shadow-xs'
          : 'bg-[#173f43] hover:bg-[#20545a] text-slate-200 border border-[#3c6468] hover:text-white'
      }`}
    >
      <IconContrast size={16} className={isHighContrast ? 'text-black' : 'text-slate-200'} />
    </button>
  );
};
