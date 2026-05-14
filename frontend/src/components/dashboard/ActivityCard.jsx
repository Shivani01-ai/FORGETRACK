import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Clock, CheckSquare, Upload } from 'lucide-react';

export default function ActivityCard() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        // Fetch latest attendance marks
        const { data: attData } = await supabase
          .from('attendance')
          .select('session_id, marked_at, marked_by, sessions(topic)')
          .order('marked_at', { ascending: false })
          .limit(10);

        const uniqueSessions = new Set();
        const mappedAtt = [];
        if (attData) {
          for (const row of attData) {
            if (!uniqueSessions.has(row.session_id)) {
              uniqueSessions.add(row.session_id);
              mappedAtt.push({
                id: `att-${row.session_id}`,
                type: 'attendance',
                desc: `Attendance marked for "${row.sessions?.topic}"`,
                by: row.marked_by,
                date: new Date(row.marked_at)
              });
              if (mappedAtt.length >= 3) break;
            }
          }
        }

        // Fetch latest imports
        const { data: impData } = await supabase
          .from('import_log')
          .select('id, filename, uploaded_at, uploaded_by')
          .order('uploaded_at', { ascending: false })
          .limit(2);

        const mappedImp = impData ? impData.map(row => ({
          id: `imp-${row.id}`,
          type: 'import',
          desc: `Imported CSV: ${row.filename}`,
          by: row.uploaded_by,
          date: new Date(row.uploaded_at)
        })) : [];

        const combined = [...mappedAtt, ...mappedImp]
          .sort((a, b) => b.date - a.date)
          .slice(0, 5);

        setActivities(combined);
      } catch (err) {
        console.error('Activity fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  return (
    <div className="bg-surface rounded-xl p-8 shadow-[var(--shadow-card)] border border-border-subtle h-full flex flex-col">
      <div className="text-label text-fg-tertiary uppercase tracking-widest mb-6 flex items-center gap-2">
        <Clock size={14} /> RECENT ACTIVITY
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-raised shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-surface-raised rounded w-3/4"></div>
                <div className="h-3 bg-surface-raised rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : activities.length > 0 ? (
        <div className="flex-1 flex flex-col gap-6">
          {activities.map(item => (
            <div key={item.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-inset border border-border-default flex items-center justify-center shrink-0 text-fg-secondary">
                {item.type === 'attendance' ? <CheckSquare size={14} /> : <Upload size={14} />}
              </div>
              <div>
                <div className="text-body-sm text-fg-primary">{item.desc}</div>
                <div className="text-caption text-fg-tertiary mt-1">
                  By {item.by} • {item.date.toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-body text-fg-tertiary">No recent activity.</p>
        </div>
      )}
    </div>
  );
}
