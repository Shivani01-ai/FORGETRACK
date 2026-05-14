import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SessionCard() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchToday() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('date', today)
          .maybeSingle(); // Use maybeSingle to avoid error if no session
          
        if (error) console.error('Error fetching session:', error);
        setSession(data);
      } catch (err) {
        console.error('Session fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchToday();
  }, []);

  return (
    <div className="bg-surface rounded-2xl p-10 shadow-[var(--shadow-card)] border border-border-subtle bg-[image:var(--card-gradient)] flex flex-col h-full">
      <div className="text-label text-fg-tertiary uppercase tracking-widest mb-2 flex items-center gap-2">
        <CalendarDays size={14} /> TODAY'S SESSION
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4 mt-4 flex-1">
          <div className="h-10 bg-surface-raised rounded w-3/4"></div>
          <div className="h-6 bg-surface-raised rounded w-1/4"></div>
        </div>
      ) : session ? (
        <div className="flex-1 flex flex-col mt-4">
          <h2 className="text-display-sm text-fg-primary mb-4 leading-tight">{session.topic}</h2>
          <div className="flex gap-3 mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-raised border border-border-default text-caption text-fg-secondary capitalize">
              {session.session_type}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-raised border border-border-default text-caption text-fg-secondary">
              {session.duration_hours} Hours
            </span>
          </div>
          <div className="mt-auto">
            <button 
              onClick={() => navigate('/attendance')}
              className="bg-surface-raised border border-border-strong text-fg-primary rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-surface transition-colors"
            >
              Manage Session
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-start mt-6 border border-dashed border-border-default rounded-xl p-6 bg-surface-inset">
          <p className="text-body text-fg-secondary mb-4">No session scheduled for today.</p>
          <button 
            onClick={() => navigate('/attendance')}
            className="bg-fg-primary text-canvas rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors"
          >
            Create Session
          </button>
        </div>
      )}
    </div>
  );
}
