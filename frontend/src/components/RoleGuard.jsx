import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

export default function RoleGuard({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="app-main flex flex-col items-center justify-center gap-4 text-fg-primary">
        <div className="w-8 h-8 border-4 border-t-accent-glow border-r-accent-glow border-b-border-subtle border-l-border-subtle animate-spin rounded-full"></div>
        <div className="text-caption uppercase tracking-widest opacity-50">Initializing ForgeTrack...</div>
      </div>
    );
  }

  if (!user) {
    // Not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Logged in but wrong role
    return <Navigate to="/403" replace />;
  }

  return children;
}
