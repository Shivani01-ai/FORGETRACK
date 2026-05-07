import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BookOpen, 
  Upload, 
  UserCheck, 
  Calendar, 
  LogOut,
  Sparkles
} from 'lucide-react';

export default function Sidebar() {
  const { role, signOut, user } = useAuth();
  const displayName = user?.user_metadata?.display_name || 'User';

  const mentorLinks = [
    { label: 'Overview', items: [{ to: '/dashboard', icon: LayoutDashboard, name: 'Dashboard' }] },
    { label: 'Activity', items: [
      { to: '/attendance', icon: CheckSquare, name: 'Mark Attendance' },
      { to: '/history', icon: Users, name: 'Student History' },
      { to: '/materials', icon: BookOpen, name: 'Materials' },
    ]},
    { label: 'Data', items: [{ to: '/upload', icon: Upload, name: 'Upload CSV' }] }
  ];

  const studentLinks = [
    { label: 'Overview', items: [
      { to: '/me/attendance', icon: UserCheck, name: 'My Attendance' },
      { to: '/me/upcoming', icon: Calendar, name: 'Upcoming' },
      { to: '/me/materials', icon: BookOpen, name: 'Materials' },
    ]}
  ];

  const sections = role === 'mentor' ? mentorLinks : studentLinks;

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside className="w-64 h-screen bg-canvas border-r border-border-subtle flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-accent-glow flex items-center justify-center text-white">
          <Sparkles size={18} />
        </div>
        <span className="font-display font-bold text-lg text-fg-primary tracking-tight">ForgeTrack</span>
      </div>

      <div className="p-4 border-b border-border-subtle">
        <div className="text-caption text-fg-tertiary mb-1">Welcome Back</div>
        <div className="text-body font-medium text-fg-primary truncate">{displayName}</div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-6">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="text-label text-fg-tertiary mb-2 px-3">{section.label}</div>
            <div className="flex flex-col space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-body font-medium transition-colors
                      ${isActive 
                        ? 'bg-surface-raised text-fg-primary border-l-2 border-accent-glow shadow-[inset_1px_0_0_0_transparent]' 
                        : 'text-fg-secondary hover:bg-surface hover:text-fg-primary border-l-2 border-transparent'
                      }
                    `}
                  >
                    <Icon size={20} strokeWidth={1.75} />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border-subtle">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-body font-medium text-fg-secondary hover:bg-surface hover:text-fg-primary transition-colors"
        >
          <LogOut size={20} strokeWidth={1.75} />
          Logout
        </button>
      </div>
    </aside>
  );
}
