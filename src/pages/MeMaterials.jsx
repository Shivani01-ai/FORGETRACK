import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Video, Link as LinkIcon, FileText, Search } from 'lucide-react';

export default function MeMaterials() {
  const [sessions, setSessions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchMaterials() {
      // Only fetch sessions that have occurred (date <= today) or all sessions.
      // Usually, materials are posted after the session.
      const { data: sessData } = await supabase.from('sessions').select('*').order('date', { ascending: false });
      const { data: matData } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
      
      setSessions(sessData || []);
      setMaterials(matData || []);
      setLoading(false);
    }
    fetchMaterials();
  }, []);

  const getIconForType = (type) => {
    switch (type) {
      case 'slides': return <BookOpen size={16} />;
      case 'recording': return <Video size={16} />;
      case 'link': return <LinkIcon size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (searchQuery && !s.topic.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-h1 text-fg-primary mb-2">Class Materials</h1>
          <p className="text-body text-fg-secondary">Access slides, recordings, and resources for your classes.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" size={16} />
          <input 
            type="text" 
            placeholder="Search topics..." 
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
          <p className="text-body text-fg-secondary">No materials found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSessions.map(session => {
            const sessionMaterials = materials.filter(m => m.session_id === session.id);
            // Hide empty sessions for students
            if (sessionMaterials.length === 0) return null;

            return (
              <div key={session.id} className="bg-surface rounded-2xl shadow-[var(--shadow-card)] border border-border-subtle flex flex-col overflow-hidden transition-all hover:border-border-strong">
                <div className="p-5 border-b border-border-subtle bg-surface-raised">
                  <div className="text-caption font-mono text-fg-tertiary mb-1">{session.date}</div>
                  <h3 className="text-h3 text-fg-primary leading-tight">{session.topic}</h3>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3 bg-[image:var(--card-gradient)]">
                  {sessionMaterials.map(m => (
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
