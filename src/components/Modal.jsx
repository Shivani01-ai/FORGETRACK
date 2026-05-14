import React from 'react';

export default function Modal({ isOpen, title, children, onConfirm, onCancel, confirmText = 'Confirm', destructive = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-[rgba(7,7,11,0.7)] backdrop-blur-sm"
        onClick={onCancel}
      ></div>
      
      {/* Modal Dialog */}
      <div className="relative bg-surface-raised border border-border-default rounded-2xl shadow-[var(--shadow-raised)] p-10 max-w-[560px] w-full">
        <h2 className="text-h2 text-fg-primary mb-4">{title}</h2>
        
        <div className="text-body-lg text-fg-secondary mb-8">
          {children}
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="bg-surface-inset border border-border-default text-fg-primary rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`rounded-md px-5 py-3 font-body font-medium text-[14px] transition-colors ${
              destructive 
                ? 'bg-danger-bg border border-danger-border text-danger hover:bg-[rgba(244,63,94,0.2)]' 
                : 'bg-fg-primary text-canvas hover:bg-[#E5E5E7]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
