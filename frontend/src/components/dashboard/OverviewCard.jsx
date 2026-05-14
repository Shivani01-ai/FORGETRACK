import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Activity } from 'lucide-react';

export default function OverviewCard() {
  const [stats, setStats] = useState({ avg: 0, highest: '-', lowest: '-' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOverview() {
      try {
        const { data } = await supabase
          .from('attendance')
          .select('present, student_id, students(name)');

        if (data && data.length > 0) {
          const total = data.length;
          const present = data.filter(d => d.present).length;
          const avg = Math.round((present / total) * 100);

          const studentStats = {};
          data.forEach(row => {
            if (!row.students) return;
            const name = row.students.name;
            if (!studentStats[name]) studentStats[name] = { total: 0, present: 0 };
            studentStats[name].total += 1;
            if (row.present) studentStats[name].present += 1;
          });

          let highest = { name: '-', pct: -1 };
          let lowest = { name: '-', pct: 101 };

          for (const [name, counts] of Object.entries(studentStats)) {
            const pct = (counts.present / counts.total) * 100;
            if (pct > highest.pct) highest = { name, pct };
            if (pct < lowest.pct) lowest = { name, pct };
          }

          setStats({ avg, highest: highest.name, lowest: lowest.name });
        }
      } catch (err) {
        console.error('Overview fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOverview();
  }, []);

  return (
    <div className="bg-surface rounded-xl p-8 shadow-[var(--shadow-card)] border border-border-subtle h-full flex flex-col">
      <div className="text-label text-fg-tertiary uppercase tracking-widest mb-6 flex items-center gap-2">
        <Activity size={14} /> PROGRAM OVERVIEW
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-surface-raised rounded w-1/2"></div>
          <div className="h-4 bg-surface-raised rounded w-full mt-8"></div>
          <div className="h-4 bg-surface-raised rounded w-full"></div>
        </div>
      ) : stats.avg > 0 ? (
        <div className="flex-1 flex flex-col">
          <div className="mb-8">
            <div className="text-display-md text-fg-primary tabular-nums leading-tight">{stats.avg}%</div>
            <div className="text-body-sm text-fg-secondary">Average Attendance</div>
          </div>
          
          <div className="space-y-4 mt-auto">
            <div>
              <div className="text-caption text-fg-tertiary mb-1">HIGHEST ATTENDANCE</div>
              <div className="text-body font-medium text-fg-primary truncate">{stats.highest}</div>
            </div>
            <div>
              <div className="text-caption text-fg-tertiary mb-1">LOWEST ATTENDANCE</div>
              <div className="text-body font-medium text-fg-primary truncate">{stats.lowest}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-body text-fg-tertiary">No data recorded yet.</p>
        </div>
      )}
    </div>
  );
}
