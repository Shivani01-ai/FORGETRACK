import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AttendanceCard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchAttendance() {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's session
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('id')
          .eq('date', today)
          .maybeSingle();
          
        if (!sessionData) {
          setLoading(false);
          return;
        }

        // Get attendance + student names
        const { data: attData } = await supabase
          .from('attendance')
          .select('present, students(name)')
          .eq('session_id', sessionData.id);

        if (attData && attData.length > 0) {
          const total = attData.length;
          const present = attData.filter(a => a.present).length;
          const absentList = attData.filter(a => !a.present).map(a => a.students?.name || 'Unknown');
          
          setData({
            total,
            present,
            pct: Math.round((present / total) * 100),
            absentList
          });
        }
      } catch (err) {
        console.error('Attendance fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAttendance();
  }, []);

  return (
    <div className="bg-surface rounded-2xl p-10 shadow-[var(--shadow-card)] border border-border-subtle bg-[image:var(--card-gradient)] flex flex-col h-full">
      <div className="text-label text-fg-tertiary uppercase tracking-widest mb-2 flex items-center gap-2">
        <Users size={14} /> TODAY'S ATTENDANCE
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4 mt-4 flex-1">
          <div className="h-16 bg-surface-raised rounded w-full"></div>
          <div className="h-4 bg-surface-raised rounded w-full"></div>
        </div>
      ) : data ? (
        <div className="flex-1 flex flex-col mt-4">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-display-md text-fg-primary tabular-nums leading-tight">{data.pct}%</span>
            <span className="text-body text-fg-secondary">({data.present} of {data.total} present)</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-surface-raised rounded-full overflow-hidden mb-8">
            <div 
              className={`h-full ${data.pct >= 75 ? 'bg-success' : data.pct >= 60 ? 'bg-warning' : 'bg-danger'}`} 
              style={{ width: `${data.pct}%` }}
            ></div>
          </div>

          <div className="mt-auto">
            <h4 className="text-caption text-fg-tertiary uppercase tracking-wider mb-3">Absent Students</h4>
            {data.absentList.length > 0 ? (
              <ul className="space-y-2">
                {data.absentList.slice(0, 5).map((name, i) => (
                  <li key={i} className="flex items-center gap-2 text-body-sm text-fg-secondary">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger shrink-0"></div>
                    {name}
                  </li>
                ))}
                {data.absentList.length > 5 && (
                  <li className="text-caption text-fg-tertiary pt-1">
                    and {data.absentList.length - 5} more...
                  </li>
                )}
              </ul>
            ) : (
              <p className="text-body-sm text-success flex items-center gap-2">
                Perfect attendance! 🎉
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-start mt-6 border border-dashed border-border-default rounded-xl p-6 bg-surface-inset">
          <p className="text-body text-fg-secondary mb-4">Not marked yet.</p>
          <button 
            onClick={() => navigate('/attendance')}
            className="bg-surface-raised border border-border-strong text-fg-primary rounded-md px-5 py-3 font-body font-medium text-[14px] hover:bg-surface transition-colors"
          >
            Mark Now
          </button>
        </div>
      )}
    </div>
  );
}
