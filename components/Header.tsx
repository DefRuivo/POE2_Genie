import React from 'react';
import { UserMenu } from './UserMenu';

interface Props {
  onMenuClick?: () => void;
  onHomeClick?: () => void;
}

const Header: React.FC<Props> = ({ onMenuClick, onHomeClick }) => {
  return (
    <header className="poe-surface sticky top-0 z-50 px-4 py-3 md:px-5 md:py-3.5 border-b border-poe-borderStrong backdrop-blur-md bg-poe-surface1 shadow-[0_8px_22px_rgba(0,0,0,0.32)]">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Brand Section */}
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="w-9 h-9 flex items-center justify-center rounded-xl poe-input poe-focus-ring hover:border-poe-gold hover:text-poe-gold text-poe-text2 transition-all xl:hidden"
              aria-label="Open navigation"
            >
              <i className="fas fa-bars"></i>
            </button>
          )}
          <div
            onClick={onHomeClick}
            className={`flex items-center gap-2 ${onHomeClick ? 'cursor-pointer' : ''} group select-none`}
          >
            <div className="p-1.5 rounded-lg bg-poe-bronze group-hover:bg-poe-gold group-hover:scale-105 transition-all shadow-[0_6px_12px_rgba(0,0,0,0.3)] border border-poe-borderStrong">
              <i className="fas fa-shield-halved text-poe-bg0 text-sm"></i>
            </div>
            <h1 className="text-xl md:text-[1.35rem] font-black tracking-tight poe-title leading-none">
              POE2 <span className="text-poe-gold">Genie</span>
            </h1>
          </div>
        </div>

        {/* Right Section: User Menu */}
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
