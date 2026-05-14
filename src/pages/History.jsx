import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search } from 'lucide-react';

export default function History() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all students for the dropdown
  useEffect(() => {
    async function fetchStudents() {
      const { data } = await supabase.from('students').select('*').order('name');
      setStudents(data || []);
      setLoading(false);
    }
    fetchStudents();
  }, []);

  // Fetch history when student is selected
  useEffect(() => {
    if (!selectedStudentId) {
      setStudentData(null);
      return;
    }

    async function fetchHistory() {
      setLoading(true);
      
      const p1 = supabase.from('students').select('*').eq('id', selectedStudentId).single();
      const p2 = supabase.from('sessions').select('*').order('date', { ascending: false });
      const p3 = supabase.from('attendance').select('*').eq('student_id', selectedStudentId);

      const [resStudent, resSessions, resAtt] = await Promise.all([p1, p2, p3]);

      setStudentData(resStudent.data);
      setSessions(resSessions.data || []);
      setAttendance(resAtt.data || []);
      setLoading(false);
    }
    fetchHistory();
  }, [selectedStudentId]);

  // Derived stats
  let presentCount = 0;
  let totalSessions = sessions.length;
  const attMap = {}; // session_id -> present boolean
  
  attendance.forEach(a => {
    attMap[a.session_id] = a.present;
    if (a.present) presentCount++;
  });

  const pct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
  
  // Streak calculation
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  
  // Sort sessions oldest to newest for streak calculation
  const sortedSessions = [...sessions].reverse();
  sortedSessions.forEach(s => {
    if (attMap[s.id] === true) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else if (attMap[s.id] === false) {
      tempStreak = 0;
    }
  });
  currentStreak = tempStreak;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <h1 className="text-h1 text-fg-primary">Student History</h1>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={18} />
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full bg-surface-inset border border-border-default rounded-lg pl-10 pr-4 h-12 text-fg-primary font-body text-[14px] appearance-none focus:border-accent-glow focus:outline-none"
          >
            <option value="">Search or select a student...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.usn})</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedStudentId ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-dashed border-border-default">
          <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-4 text-fg-tertiary">
            <Search size={24} />
          </div>
          <h2 className="text-h2 text-fg-primary mb-2">Select a student</h2>
          <p className="text-body text-fg-secondary">Choose a student from the dropdown above to view their detailed attendance history.</p>
        </div>
      ) : loading ? (
        <div className="animate-pulse space-y-8">
          <div className="flex gap-6">
            <div className="h-64 bg-surface rounded-2xl w-1/3"></div>
            <div className="h-64 bg-surface rounded-2xl flex-1"></div>
          </div>
          <div className="h-64 bg-surface rounded-2xl w-full"></div>
        </div>
      ) : studentData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Card: Profile */}
            <div className="bg-surface rounded-2xl p-8 shadow-[var(--shadow-card)] border border-border-subtle bg-[image:var(--card-gradient)]">
              <h2 className="text-display-sm text-fg-primary mb-1">{studentData.name}</h2>
              <div className="text-body-sm text-fg-tertiary font-mono mb-8">{studentData.usn} • {studentData.branch_code}</div>
              
              <div className="mb-8">
                <div className={`text-display-md tabular-nums leading-none mb-1 ${
                  pct >= 75 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-danger'
                }`}>
                  {pct}%
                </div>
                <div className="text-caption text-fg-tertiary uppercase tracking-wider">Overall Attendance</div>
              </div>

              <div className="flex justify-between border-t border-border-subtle pt-4">
                <div>
                  <div className="text-body font-medium text-fg-primary">{presentCount} / {totalSessions}</div>
                  <div className="text-caption text-fg-tertiary uppercase">Sessions</div>
                </div>
                <div>
                  <div className="text-body font-medium text-fg-primary">{currentStreak}</div>
                  <div className="text-caption text-fg-tertiary uppercase">Cur. Streak</div>
                </div>
                <div>
                  <div className="text-body font-medium text-fg-primary">{maxStreak}</div>
                  <div className="text-caption text-fg-tertiary uppercase">Max Streak</div>
                </div>
              </div>
            </div>

            {/* Right Card: Heatmap Grid */}
            <div className="md:col-span-2 bg-surface rounded-2xl p-8 shadow-[var(--shadow-card)] border border-border-subtle">
              <div className="text-label text-fg-tertiary uppercase tracking-widest mb-6">Attendance Heatmap</div>
              <div className="flex flex-wrap gap-2">
                {sortedSessions.map(session => {
                  const isPresent = attMap[session.id];
                  let cellClass = "w-8 h-8 rounded-md shrink-0 flex items-center justify-center ";
                  let tooltip = `${session.date}: `;
                  
                  if (isPresent === true) {
                    cellClass += "bg-success-bg border border-success-border text-success";
                    tooltip += "Present";
                  } else if (isPresent === false) {
                    cellClass += "bg-danger-bg border border-danger-border text-danger";
                    tooltip += "Absent";
                  } else {
                    cellClass += "bg-surface-inset border border-border-default text-fg-tertiary";
                    tooltip += "No record";
                  }

                  return (
                    <div key={session.id} className={cellClass} title={tooltip}>
                      <span className="sr-only">{tooltip}</span>
                      {/* Optional: could show date day number */}
                      <span className="text-[10px] font-mono opacity-50">{session.date.slice(-2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Table */}
          <div className="bg-surface rounded-2xl overflow-hidden shadow-[var(--shadow-card)] border border-border-subtle">
            <div className="p-6 border-b border-border-subtle">
              <h3 className="text-h3 text-fg-primary">Session Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 pl-6 text-label text-fg-tertiary border-b border-border-subtle font-medium">DATE</th>
                    <th className="p-4 text-label text-fg-tertiary border-b border-border-subtle font-medium">TOPIC</th>
                    <th className="p-4 text-label text-fg-tertiary border-b border-border-subtle font-medium">DURATION</th>
                    <th className="p-4 pr-6 text-label text-fg-tertiary border-b border-border-subtle font-medium text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => {
                    const isPresent = attMap[session.id];
                    return (
                      <tr key={session.id} className="hover:bg-surface-raised transition-colors">
                        <td className="p-4 pl-6 text-body font-mono text-fg-secondary border-b border-border-subtle">{session.date}</td>
                        <td className="p-4 text-body text-fg-primary border-b border-border-subtle">{session.topic}</td>
                        <td className="p-4 text-body text-fg-secondary border-b border-border-subtle">{session.duration_hours}h</td>
                        <td className="p-4 pr-6 border-b border-border-subtle text-right">
                          {isPresent === true ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-success-bg text-success border border-success-border">
                              Present
                            </span>
                          ) : isPresent === false ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-danger-bg text-danger border border-danger-border">
                              Absent
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-surface-inset text-fg-tertiary border border-border-default">
                              No Record
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
