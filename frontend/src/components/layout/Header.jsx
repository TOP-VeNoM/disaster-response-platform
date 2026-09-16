import { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../common/SearchBar.jsx';
import NotificationBell from '../common/NotificationBell.jsx';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="flex h-16 items-center justify-between gap-3 px-4 pt-4 sm:gap-4 sm:px-6">
      <button onClick={onMenuClick} className="shrink-0 text-text-muted hover:text-text-primary lg:hidden" title="Open menu">
        <Menu size={20} />
      </button>

      <SearchBar />

      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        <NotificationBell />
        {user && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-mint text-xs font-bold text-surface-shell">
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium text-text-primary">{user.name}</p>
                <p className="text-[10px] text-text-muted">{user.role}</p>
              </div>
              <ChevronDown size={12} className="hidden text-text-muted sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-2 w-36 rounded-md bg-surface-card py-1 shadow-lg">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text-secondary hover:bg-surface-tile hover:text-text-primary"
                >
                  <LogOut size={13} /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}



