import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthProvider';
import { Presentation, Users, Calendar, Activity } from 'lucide-react';

export default function HeroTicker() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || 'Mentor';
  const [stats, setStats] = useState({ totalSessions: 0, attendance: 0, activeStudents: 0, lastSession: '-' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTicker() {
      try {
        const p1 = supabase.from('sessions').select('id, date', { count: 'exact' }).order('date', { ascending: false }).limit(1);
        const p2 = supabase.from('students').select('id', { count: 'exact' }).eq('is_active', true);
        const p3 = supabase.from('attendance').select('present', { count: 'exact' });

        const [resSessions, resStudents, resAtt] = await Promise.all([p1, p2, p3]);

        let attendancePct = 0;
        if (resAtt.data && resAtt.data.length > 0) {
          const presentCount = resAtt.data.filter(a => a.present).length;
          attendancePct = Math.round((presentCount / resAtt.data.length) * 100);
        }

        setStats({
          totalSessions: resSessions.count || 0,
          activeStudents: resStudents.count || 0,
          attendance: attendancePct,
          lastSession: resSessions.data?.[0]?.date || '-'
        });
      } catch (err) {
        console.error('Ticker fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTicker();
  }, []);

  return (
    <div className="mb-12">
      <h1 className="text-display-hero text-fg-primary mb-8 tracking-tight">
        Welcome Back, <span className="text-fg-secondary">{displayName}</span>
      </h1>
      
      {/* Ticker Strip */}
      <div className="flex items-center overflow-x-auto pb-4 gap-6 no-scrollbar">
        <TickerItem icon={Presentation} label="TOTAL SESSIONS" value={loading ? '...' : stats.totalSessions} />
        <div className="w-px h-8 bg-border-subtle shrink-0"></div>
        <TickerItem icon={Activity} label="OVERALL ATTENDANCE" value={loading ? '...' : `${stats.attendance}%`} />
        <div className="w-px h-8 bg-border-subtle shrink-0"></div>
        <TickerItem icon={Users} label="ACTIVE STUDENTS" value={loading ? '...' : stats.activeStudents} />
        <div className="w-px h-8 bg-border-subtle shrink-0"></div>
        <TickerItem icon={Calendar} label="LAST SESSION" value={loading ? '...' : stats.lastSession} />
      </div>
    </div>
  );
}

function TickerItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className="text-fg-tertiary">
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <div>
        <div className="text-label text-fg-tertiary uppercase tracking-widest">{label}</div>
        <div className="text-display-md text-fg-primary tabular-nums font-bold leading-tight mt-1">{value}</div>
      </div>
    </div>
  );
}
