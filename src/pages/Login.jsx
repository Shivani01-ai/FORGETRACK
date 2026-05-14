import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthProvider';

export default function Login() {
  const [isMentor, setIsMentor] = useState(true);
  const [identifier, setIdentifier] = useState(''); // email or USN
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();

  // Redirect once auth is ready and role is known
  useEffect(() => {
    console.log('Login component auth state:', { role, authLoading });
    if (!authLoading && role) {
      if (role === 'mentor') navigate('/dashboard', { replace: true });
      else navigate('/me/attendance', { replace: true });
    }
  }, [role, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const email = isMentor ? identifier : `${identifier}@forge.local`;

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // role will be handled by useEffect above

    } catch (err) {
      setError('Invalid credentials or account not found.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-main flex items-center justify-center min-h-screen p-6">
      <div className="bg-surface rounded-2xl p-10 max-w-[440px] w-full shadow-[var(--shadow-raised)] border border-border-default bg-[image:var(--card-gradient)] relative overflow-hidden">
        
        {/* Glow effect inside card */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-accent-glow rounded-full mix-blend-screen filter blur-[100px] opacity-20 pointer-events-none"></div>

        <div className="flex flex-col items-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-accent-glow flex items-center justify-center text-white mb-6">
            <Sparkles size={24} />
          </div>
          <h1 className="text-h2 text-fg-primary text-center">Sign in to ForgeTrack</h1>
        </div>

        <div className="flex bg-surface-inset p-1 rounded-lg mb-8 border border-border-subtle">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isMentor ? 'bg-surface-raised text-fg-primary shadow-sm border border-border-default' : 'text-fg-tertiary hover:text-fg-primary'}`}
            onClick={() => { setIsMentor(true); setError(''); }}
          >
            Mentor Login
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isMentor ? 'bg-surface-raised text-fg-primary shadow-sm border border-border-default' : 'text-fg-tertiary hover:text-fg-primary'}`}
            onClick={() => { setIsMentor(false); setError(''); }}
          >
            Student Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-label text-fg-secondary">
              {isMentor ? 'EMAIL ADDRESS' : 'UNIVERSITY SEAT NUMBER (USN)'}
            </label>
            <input 
              type={isMentor ? "email" : "text"}
              required
              placeholder={isMentor ? "mentor@theboringpeople.in" : "4SH24CS001"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-surface-inset border border-border-default rounded-md px-4 h-11 text-fg-primary font-body text-[14px] placeholder-fg-tertiary focus:border-accent-glow focus:shadow-[var(--shadow-focus)] focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-label text-fg-secondary">PASSWORD</label>
              {isMentor && (
                <a href="#" className="text-caption text-accent-glow hover:underline">Forgot password?</a>
              )}
            </div>
            <input 
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-inset border border-border-default rounded-md px-4 h-11 text-fg-primary font-body text-[14px] placeholder-fg-tertiary focus:border-accent-glow focus:shadow-[var(--shadow-focus)] focus:outline-none transition-all"
            />
          </div>

          {error && (
            <div className="text-caption text-danger text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-fg-primary text-canvas rounded-md h-12 mt-2 font-body font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
