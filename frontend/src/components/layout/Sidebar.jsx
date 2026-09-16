import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, ClipboardCheck, BookOpen, BarChart3, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ICON_SIZE = 15;

/**
 * Permanently visible at lg+ (a fixed sidebar makes sense once there's
 * enough width for it not to crowd out content). Below that, it renders as
 * a slide-in drawer controlled by `open`/`onClose` — hidden off-screen via
 * `-translate-x-full` until toggled open from Header's hamburger button.
 * A dark backdrop behind it (rendered by Layout.jsx) captures outside
 * clicks to close it, standard mobile-drawer behavior.
 */
export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const isResponder = user?.role === 'responder' || user?.role === 'admin';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col gap-1 bg-surface-shell p-4 transition-transform duration-200 lg:static lg:z-auto lg:w-44 lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="mb-5 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <LayoutDashboard size={18} className="text-accent-mint" strokeWidth={2.5} />
          <span className="text-sm font-bold text-text-primary">DR Platform</span>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary lg:hidden" title="Close menu">
          <X size={16} />
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        <NavLink to="/" end onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
          <LayoutDashboard size={ICON_SIZE} /> Dashboard
        </NavLink>
        <NavLink to="/reports" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
          <FileText size={ICON_SIZE} /> Reports
        </NavLink>
        <NavLink to="/reports/new" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
          <PlusCircle size={ICON_SIZE} /> New Report
        </NavLink>
        {isResponder && (
          <NavLink to="/agent" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
            <ClipboardCheck size={ICON_SIZE} /> Agent Review
          </NavLink>
        )}
        <NavLink to="/sops" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
          <BookOpen size={ICON_SIZE} /> SOPs
        </NavLink>
        <NavLink to="/analytics" onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}>
          <BarChart3 size={ICON_SIZE} /> Analytics
        </NavLink>
      </nav>
    </aside>
  );
}


