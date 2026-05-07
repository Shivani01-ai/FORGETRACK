import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthProvider';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function MeAttendance() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ pct: 0, present: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyAttendance() {
      if (!user) return;
      const studentId = user.user_metadata?.student_id;
      if (!studentId) {
        setLoading(false);
        return;
      }

      // Fetch all past sessions and user's attendance
      // In Supabase, we can join from sessions to attendance where student_id = ...
      // For simplicity, fetch all past sessions, then fetch all attendance for this student.
      const today = new Date().toISOString().split('T')[0];
      
      const { data: sessData } = await supabase
        .from('sessions')
        .select('*')
        .lte('date', today)
        .order('date', { ascending: false });

      const { data: attData } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', studentId);

      const attMap = {};
      let presentCount = 0;
      
      if (attData) {
        attData.forEach(a => {
          attMap[a.session_id] = a.present;
          if (a.present) presentCount++;
        });
      }

      const total = sessData ? sessData.length : 0;
      const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0;

      const merged = sessData ? sessData.map(s => ({
        ...s,
        status: attMap[s.id] === true ? 'present' : attMap[s.id] === false ? 'absent' : 'pending'
      })) : [];

      setStats({ pct, present: presentCount, total });
      setAttendance(merged);
      setLoading(false);
    }
    fetchMyAttendance();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-h1 text-fg-primary">My Attendance</h1>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-40 bg-surface rounded-2xl w-full"></div>
          <div className="h-64 bg-surface rounded-2xl w-full"></div>
        </div>
      ) : (
        <>
          {/* Hero Stat Card */}
          <div className="bg-surface rounded-2xl p-8 shadow-[var(--shadow-card)] border border-border-subtle bg-[image:var(--card-gradient)] flex items-center justify-between">
            <div>
              <div className="text-label text-fg-tertiary uppercase tracking-widest mb-2">OVERALL ATTENDANCE</div>
              <div className="text-display-lg text-fg-primary tabular-nums leading-none mb-2">
                {stats.pct}%
              </div>
              <div className="text-body text-fg-secondary">
                You have attended {stats.present} out of {stats.total} total sessions.
              </div>
            </div>
            
            {/* Circular Progress (CSS based) */}
            <div className="relative w-32 h-32 hidden sm:block">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" className="stroke-surface-raised" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" 
                  className={`transition-all duration-1000 ease-out ${stats.pct >= 75 ? 'stroke-success' : stats.pct >= 60 ? 'stroke-warning' : 'stroke-danger'}`} 
                  strokeWidth="8" 
                  strokeDasharray={`${stats.pct * 2.51} 251`} 
                  strokeLinecap="round" 
                />
              </svg>
            </div>
          </div>

          {/* History List */}
          <div className="bg-surface rounded-2xl overflow-hidden shadow-[var(--shadow-card)] border border-border-subtle">
            <div className="p-6 border-b border-border-subtle">
              <h3 className="text-h3 text-fg-primary">Session History</h3>
            </div>
            
            {attendance.length > 0 ? (
              <div className="divide-y divide-border-subtle">
                {attendance.map(session => (
                  <div key={session.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-surface-raised transition-colors">
                    <div>
                      <div className="text-caption font-mono text-fg-tertiary mb-1">{session.date}</div>
                      <div className="text-body-lg font-medium text-fg-primary">{session.topic}</div>
                    </div>
                    
                    <div>
                      {session.status === 'present' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold tracking-wider uppercase bg-success-bg text-success border border-success-border">
                          <CheckCircle2 size={14} /> Present
                        </span>
                      ) : session.status === 'absent' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold tracking-wider uppercase bg-danger-bg text-danger border border-danger-border">
                          <XCircle size={14} /> Absent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold tracking-wider uppercase bg-surface-inset text-fg-tertiary border border-border-default">
                          <Clock size={14} /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-body text-fg-secondary">No past sessions found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
