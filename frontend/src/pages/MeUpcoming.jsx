import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MonitorPlay, Users } from 'lucide-react';

export default function MeUpcoming() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcoming() {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .gt('date', today)
        .order('date', { ascending: true });
        
      setSessions(data || []);
      setLoading(false);
    }
    fetchUpcoming();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-h1 text-fg-primary mb-2">Upcoming Sessions</h1>
        <p className="text-body text-fg-secondary">Plan ahead for your next classes.</p>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse"></div>)}
        </div>
      ) : sessions.length > 0 ? (
        <div className="grid gap-4">
          {sessions.map(session => (
            <div key={session.id} className="bg-surface rounded-2xl p-6 shadow-[var(--shadow-card)] border border-border-subtle flex flex-col sm:flex-row gap-6 hover:border-accent-glow transition-colors group">
              
              <div className="flex flex-col items-center justify-center bg-surface-inset border border-border-default rounded-xl w-24 h-24 shrink-0">
                <div className="text-caption text-fg-tertiary uppercase tracking-widest">{new Date(session.date).toLocaleString('default', { month: 'short' })}</div>
                <div className="text-display-md text-fg-primary tabular-nums leading-none mt-1">{new Date(session.date).getDate()}</div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-h3 text-fg-primary mb-3 group-hover:text-accent-glow transition-colors">{session.topic}</h3>
                
                <div className="flex flex-wrap gap-4 text-body-sm text-fg-secondary">
                  <span className="flex items-center gap-1.5">
                    <Clock size={16} className="text-fg-tertiary" /> {session.duration_hours} Hours
                  </span>
                  <span className="flex items-center gap-1.5 capitalize">
                    {session.session_type === 'online' ? <MonitorPlay size={16} className="text-fg-tertiary" /> : <Users size={16} className="text-fg-tertiary" />}
                    {session.session_type}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={16} className="text-fg-tertiary" /> Month {session.month_number}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-12 text-center border border-dashed border-border-default">
          <Calendar size={32} className="mx-auto text-fg-tertiary mb-4" />
          <h3 className="text-h3 text-fg-primary mb-2">No upcoming sessions</h3>
          <p className="text-body text-fg-secondary">Check back later for new schedule updates.</p>
        </div>
      )}
    </div>
  );
}
