import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Plus, BookOpen, Video, Link as LinkIcon, FileText } from 'lucide-react';
import Modal from '../components/Modal';

export default function Materials() {
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [monthFilter, setMonthFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    session_id: '',
    title: '',
    type: 'slides',
    url: '',
    description: ''
  });

  const fetchMaterials = async () => {
    setLoading(true);
    // Fetch sessions
    const { data: sessData } = await supabase.from('sessions').select('*').order('date', { ascending: false });
    // Fetch materials
    const { data: matData } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    
    setSessions(sessData || []);
    setMaterials(matData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const { error } = await supabase.from('materials').insert([newMaterial]);
    
    if (!error) {
      setShowAddModal(false);
      setNewMaterial({ session_id: '', title: '', type: 'slides', url: '', description: '' });
      fetchMaterials(); // Reload
    } else {
      alert("Failed to add material.");
    }
    setSaving(false);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'slides': return <PresentationIcon />;
      case 'recording': return <Video size={16} />;
      case 'link': return <LinkIcon size={16} />;
      default: return <FileText size={16} />;
    }
  };

  // Fake icon component to keep things simple
  const PresentationIcon = () => <BookOpen size={16} />;

  // Group materials by session
  const filteredSessions = sessions.filter(s => {
    if (monthFilter && s.month_number.toString() !== monthFilter) return false;
    if (searchQuery && !s.topic.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-h1 text-fg-primary mb-2">Class Materials</h1>
          <p className="text-body text-fg-secondary">Manage and share session resources with students.</p>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-fg-primary text-canvas px-5 py-2.5 rounded-md font-medium text-[14px] flex items-center gap-2 hover:bg-[#E5E5E7] transition-colors"
        >
          <Plus size={18} />
          Add Material
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-surface rounded-xl p-4 border border-border-subtle">
        <select 
          value={monthFilter} 
          onChange={e => setMonthFilter(e.target.value)}
          className="bg-surface-inset border border-border-default rounded-md px-3 h-10 text-fg-primary font-body text-[14px] w-full sm:w-48 focus:border-accent-glow focus:outline-none"
        >
          <option value="">All Months</option>
          <option value="1">Month 1</option>
          <option value="2">Month 2</option>
          <option value="3">Month 3</option>
          <option value="4">Month 4</option>
        </select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={16} />
          <input 
            type="text" 
            placeholder="Search by session topic..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-surface-inset border border-border-default rounded-md pl-10 pr-4 h-10 text-fg-primary font-body text-[14px] focus:border-accent-glow focus:outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-surface rounded-2xl animate-pulse"></div>)}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-dashed border-border-default">
          <p className="text-body text-fg-secondary">No sessions found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSessions.map(session => {
            const sessionMaterials = materials.filter(m => m.session_id === session.id);
            if (sessionMaterials.length === 0 && !searchQuery) return null; // hide empty unless searching

            return (
              <div key={session.id} className="bg-surface rounded-2xl shadow-[var(--shadow-card)] border border-border-subtle flex flex-col overflow-hidden">
                <div className="p-5 border-b border-border-subtle bg-surface-raised">
                  <div className="text-caption font-mono text-fg-tertiary mb-1">{session.date} • Month {session.month_number}</div>
                  <h3 className="text-h3 text-fg-primary leading-tight">{session.topic}</h3>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3 bg-[image:var(--card-gradient)]">
                  {sessionMaterials.length === 0 ? (
                    <div className="text-body-sm text-fg-tertiary text-center py-4">No materials added yet.</div>
                  ) : (
                    sessionMaterials.map(m => (
                      <a 
                        key={m.id} 
                        href={m.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg border border-border-default bg-surface-inset hover:border-border-strong hover:bg-surface transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-md bg-surface border border-border-subtle flex items-center justify-center text-fg-secondary group-hover:text-accent-glow transition-colors shrink-0">
                          {getIconForType(m.type)}
                        </div>
                        <div>
                          <div className="text-body-sm font-medium text-fg-primary group-hover:text-accent-glow transition-colors">{m.title}</div>
                          {m.description && <div className="text-caption text-fg-tertiary mt-0.5">{m.description}</div>}
                        </div>
                      </a>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[rgba(7,7,11,0.7)] backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-surface-raised border border-border-default rounded-2xl shadow-[var(--shadow-raised)] p-8 max-w-md w-full">
            <h2 className="text-h2 text-fg-primary mb-6">Add Material</h2>
            
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-label text-fg-secondary block mb-1">SESSION</label>
                <select 
                  required
                  value={newMaterial.session_id}
                  onChange={e => setNewMaterial({...newMaterial, session_id: e.target.value})}
                  className="w-full bg-surface-inset border border-border-default rounded-md px-3 h-11 text-fg-primary"
                >
                  <option value="">Select a session...</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.date} - {s.topic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-label text-fg-secondary block mb-1">TITLE</label>
                <input 
                  required type="text" placeholder="e.g., Session 1 Slides"
                  value={newMaterial.title}
                  onChange={e => setNewMaterial({...newMaterial, title: e.target.value})}
                  className="w-full bg-surface-inset border border-border-default rounded-md px-3 h-11 text-fg-primary"
                />
              </div>

              <div>
                <label className="text-label text-fg-secondary block mb-1">TYPE</label>
                <select 
                  value={newMaterial.type}
                  onChange={e => setNewMaterial({...newMaterial, type: e.target.value})}
                  className="w-full bg-surface-inset border border-border-default rounded-md px-3 h-11 text-fg-primary"
                >
                  <option value="slides">Slides</option>
                  <option value="recording">Recording</option>
                  <option value="link">External Link</option>
                  <option value="document">Document</option>
                </select>
              </div>

              <div>
                <label className="text-label text-fg-secondary block mb-1">URL</label>
                <input 
                  required type="url" placeholder="https://..."
                  value={newMaterial.url}
                  onChange={e => setNewMaterial({...newMaterial, url: e.target.value})}
                  className="w-full bg-surface-inset border border-border-default rounded-md px-3 h-11 text-fg-primary"
                />
              </div>

              <div>
                <label className="text-label text-fg-secondary block mb-1">DESCRIPTION (OPTIONAL)</label>
                <input 
                  type="text" placeholder="Short description..."
                  value={newMaterial.description}
                  onChange={e => setNewMaterial({...newMaterial, description: e.target.value})}
                  className="w-full bg-surface-inset border border-border-default rounded-md px-3 h-11 text-fg-primary"
                />
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-surface-inset border border-border-default text-fg-primary rounded-md px-5 py-2.5 hover:bg-surface"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="bg-fg-primary text-canvas rounded-md px-5 py-2.5 hover:bg-[#E5E5E7] disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
