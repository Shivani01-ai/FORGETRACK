import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

export default function TopBar() {
  const { user } = useAuth();
  const location = useLocation();
  const displayName = user?.user_metadata?.display_name || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  // Simple breadcrumb logic based on pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.length > 0 
    ? pathParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')
    : 'Dashboard';

  return (
    <header className="h-16 border-b border-border-subtle flex items-center justify-between px-6 md:px-8 lg:px-12 bg-canvas/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <span className="text-label text-fg-tertiary">OVERVIEW / </span>
        <span className="text-body font-medium text-fg-primary">{breadcrumb}</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={16} />
          <input 
            type="text" 
            placeholder="Search students, sessions..." 
            className="bg-surface-inset border border-border-default rounded-md pl-10 pr-4 h-[36px] w-64 text-fg-primary font-body text-[14px] placeholder-fg-tertiary focus:border-accent-glow focus:shadow-[var(--shadow-focus)] focus:outline-none transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 pl-6 border-l border-border-subtle">
          <div className="text-right hidden sm:block">
            <div className="text-body-sm font-medium text-fg-primary">{displayName}</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-surface-raised border border-border-default flex items-center justify-center text-fg-primary font-medium text-sm">
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
