import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthProvider';
import Modal from '../components/Modal';

export default function Attendance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { student_id: boolean }
  const [originalAttendance, setOriginalAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Session Creation State
  const [newSessionTopic, setNewSessionTopic] = useState('');
  const [newSessionDuration, setNewSessionDuration] = useState('2.0');
  const [newSessionType, setNewSessionType] = useState('offline');

  // Modal State
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Fetch active students
      const { data: stdData } = await supabase
        .from('students')
        .select('id, name, usn, branch_code')
        .eq('is_active', true)
        .order('name');
        
      setStudents(stdData || []);

      // Fetch session for selected date
      const { data: sessData } = await supabase
        .from('sessions')
        .select('*')
        .eq('date', date)
        .single();
        
      setSession(sessData || null);

      if (sessData) {
        // Fetch existing attendance
        const { data: attData } = await supabase
          .from('attendance')
          .select('student_id, present')
          .eq('session_id', sessData.id);
          
        const attMap = {};
        if (attData) {
          attData.forEach(a => attMap[a.student_id] = a.present);
        }
        setAttendance(attMap);
        setOriginalAttendance({ ...attMap });
      } else {
        setAttendance({});
        setOriginalAttendance({});
      }
      
      setLoading(false);
    }
    
    fetchData();
  }, [date]);

  const handleCheckboxChange = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleSelectAll = (present) => {
    const newAtt = {};
    students.forEach(s => newAtt[s.id] = present);
    setAttendance(newAtt);
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        date,
        topic: newSessionTopic,
        duration_hours: parseFloat(newSessionDuration),
        session_type: newSessionType,
        month_number: 4 // Hardcoded for demo, normally derived
      })
      .select()
      .single();
      
    if (!error && data) {
      setSession(data);
    }
    setSaving(false);
  };

  const handleSaveClick = () => {
    // Check if we are overwriting
    const isOverwriting = Object.keys(originalAttendance).length > 0;
    if (isOverwriting) {
      setShowModal(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    setSaving(true);
    setShowModal(false);
    
    const displayName = user?.user_metadata?.display_name || 'Mentor';
    
    const payload = students.map(s => ({
      student_id: s.id,
      session_id: session.id,
      present: attendance[s.id] || false,
      marked_by: displayName
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'student_id,session_id' });

    setSaving(false);
    
    if (!error) {
      // Simulate toast
      navigate('/dashboard');
    } else {
      alert("Error saving attendance");
    }
  };

  const isSaveDisabled = Object.keys(attendance).length === 0 || saving;
  const isUpdating = Object.keys(originalAttendance).length > 0;
  
  // Counts
  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-h1 text-fg-primary">Mark Attendance</h1>

      {/* Controls Row */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="w-full md:w-64 bg-surface rounded-xl p-6 shadow-[var(--shadow-card)] border border-border-subtle shrink-0">
          <label className="text-label text-fg-tertiary block mb-2">DATE</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            min="2025-08-04"
            className="w-full bg-surface-inset border border-border-default rounded-md px-3 h-11 text-fg-primary font-mono focus:border-accent-glow focus:outline-none"
          />
        </div>

        <div className="flex-1 bg-surface rounded-xl p-6 shadow-[var(--shadow-card)] border border-border-subtle w-full">
          {loading ? (
            <div className="animate-pulse h-11 bg-surface-raised rounded"></div>
          ) : session ? (
            <div>
              <div className="text-label text-fg-tertiary mb-1">SESSION TOPIC</div>
              <div className="text-h2 text-fg-primary mb-2">{session.topic}</div>
              <div className="flex gap-2">
                <span className="text-caption text-fg-secondary bg-surface-inset px-2 py-1 rounded border border-border-default">{session.duration_hours}h</span>
                <span className="text-caption text-fg-secondary bg-surface-inset px-2 py-1 rounded border border-border-default capitalize">{session.session_type}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="text-label text-fg-tertiary mb-2">CREATE SESSION FOR THIS DATE</div>
              <input 
                type="text" 
                placeholder="Topic (e.g., ReAct Agent Pattern)" 
                required
                value={newSessionTopic}
                onChange={e => setNewSessionTopic(e.target.value)}
                className="w-full bg-surface-inset border border-border-default rounded-md px-3 h-11 text-fg-primary font-body text-[14px]"
              />
              <div className="flex gap-4">
                <input 
                  type="number" step="0.5" placeholder="Hours" required
                  value={newSessionDuration} onChange={e => setNewSessionDuration(e.target.value)}
                  className="w-24 bg-surface-inset border border-border-default rounded-md px-3 h-11 text-fg-primary"
                />
                <select 
                  value={newSessionType} onChange={e => setNewSessionType(e.target.value)}
                  className="flex-1 bg-surface-inset border border-border-default rounded-md px-3 h-11 text-fg-primary"
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
                <button type="submit" disabled={saving} className="bg-fg-primary text-canvas px-4 rounded-md font-medium text-[14px]">
                  {saving ? '...' : 'Create'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Student List */}
      {session && (
        <div className="bg-surface rounded-xl shadow-[var(--shadow-card)] border border-border-subtle flex flex-col">
          <div className="p-6 border-b border-border-subtle flex justify-between items-center">
            <h3 className="text-h3 text-fg-primary">Students ({students.length})</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSelectAll(true)}
                className="text-caption font-medium text-success bg-success-bg px-3 py-1.5 rounded-md hover:bg-[rgba(16,185,129,0.2)]"
              >
                Select All Present
              </button>
              <button 
                onClick={() => handleSelectAll(false)}
                className="text-caption font-medium text-danger bg-danger-bg px-3 py-1.5 rounded-md hover:bg-[rgba(244,63,94,0.2)]"
              >
                Select All Absent
              </button>
            </div>
          </div>
          
          <div className="flex-1 max-h-[500px] overflow-y-auto p-2">
            {students.map(student => (
              <label key={student.id} className="flex items-center gap-4 p-4 hover:bg-surface-raised cursor-pointer rounded-lg border-b border-border-subtle last:border-0 transition-colors">
                <input 
                  type="checkbox" 
                  checked={attendance[student.id] || false}
                  onChange={() => handleCheckboxChange(student.id)}
                  className="w-5 h-5 rounded border-border-strong text-accent-glow focus:ring-accent-glow bg-surface-inset cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-body-lg text-fg-primary font-medium">{student.name}</div>
                  <div className="text-caption font-mono text-fg-tertiary mt-0.5">{student.usn}</div>
                </div>
                <div className="text-micro bg-surface-inset border border-border-default px-2 py-1 rounded text-fg-secondary">
                  {student.branch_code}
                </div>
              </label>
            ))}
          </div>
          
          {/* Sticky Bottom Bar */}
          <div className="p-4 border-t border-border-subtle bg-surface-raised rounded-b-xl flex justify-between items-center sticky bottom-0">
            <div className="text-body-sm text-fg-secondary">
              <span className="text-fg-primary font-medium">{presentCount} present</span>, {absentCount} absent
            </div>
            <button 
              onClick={handleSaveClick}
              disabled={isSaveDisabled}
              className="bg-fg-primary text-canvas px-6 py-2.5 rounded-md font-medium text-[14px] hover:bg-[#E5E5E7] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : isUpdating ? 'Update Attendance' : 'Save Attendance'}
            </button>
          </div>
        </div>
      )}

      <Modal 
        isOpen={showModal} 
        title="Overwrite Existing Records?" 
        destructive={true}
        confirmText="Yes, Update"
        onConfirm={executeSave}
        onCancel={() => setShowModal(false)}
      >
        You are about to modify attendance that has already been recorded for this session. Are you sure you want to proceed?
      </Modal>

    </div>
  );
}
