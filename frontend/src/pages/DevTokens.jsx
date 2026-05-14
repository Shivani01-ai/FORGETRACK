import React from 'react';

export default function DevTokens() {
  return (
    <div className="app-main p-8 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="text-h1 mb-8">Design Tokens Test</h1>
        
        <section className="space-y-4">
          <h2 className="text-label text-tertiary">1. CARD & SURFACES</h2>
          <div className="bg-surface rounded-xl p-8 shadow-[var(--shadow-card)] border border-border-subtle bg-[image:var(--card-gradient)]">
            <h3 className="text-h3 mb-2">Glass Surface Card</h3>
            <p className="text-body text-secondary">
              This card uses --bg-surface, --card-gradient, and --shadow-card.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-label text-tertiary">2. BUTTONS</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-fg-primary text-canvas rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors">
              Primary Button
            </button>
            <button className="bg-surface-raised text-fg-primary border border-border-default rounded-md px-5 py-3 font-body text-[14px] hover:bg-surface transition-colors">
              Secondary Button
            </button>
            <button className="bg-surface-raised text-danger border border-danger-border rounded-md px-5 py-3 font-body text-[14px] hover:bg-danger-bg transition-colors">
              Destructive Button
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-label text-tertiary">3. INPUTS</h2>
          <div className="max-w-sm flex flex-col gap-2">
            <label className="text-label text-secondary">Email Address</label>
            <input 
              type="email" 
              placeholder="you@example.com"
              className="bg-surface-inset border border-border-default rounded-md px-4 h-[44px] text-fg-primary font-body text-[14px] placeholder-fg-tertiary focus:border-accent-glow focus:shadow-[var(--shadow-focus)] focus:outline-none"
            />
            <span className="text-caption text-fg-tertiary">We'll never share your email.</span>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-label text-tertiary">4. STATUS PILLS</h2>
          <div className="flex gap-4">
            <span className="inline-flex items-center gap-1 px-[10px] py-1 rounded-full font-body font-semibold text-[12px] tabular-nums bg-success-bg text-success border border-success-border">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              Present
            </span>
            <span className="inline-flex items-center gap-1 px-[10px] py-1 rounded-full font-body font-semibold text-[12px] tabular-nums bg-danger-bg text-danger border border-danger-border">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              Absent
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
