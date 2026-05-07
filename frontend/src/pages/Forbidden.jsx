import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthProvider';

export default function Forbidden() {
  const navigate = useNavigate();
  const { role, user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-border-default rounded-2xl p-8 max-w-md w-full text-center shadow-[var(--shadow-raised)]">
        <div className="w-16 h-16 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center mx-auto mb-6 text-danger">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-h2 text-fg-primary mb-3">Access Denied</h1>
        <p className="text-body text-fg-secondary mb-2">
          You don't have permission to access this page. If you believe this is an error, please contact your administrator.
        </p>
        <div className="mb-8 p-3 bg-surface-inset rounded text-caption text-fg-tertiary">
          Debug Info: Logged in as {user?.email || 'Unknown'} (Role: {role || 'None'})
        </div>
        <button 
          onClick={() => navigate('/')}
          className="w-full bg-fg-primary text-canvas rounded-md py-3 font-medium text-[15px] hover:bg-[#E5E5E7] transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
