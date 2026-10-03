import { useState } from 'react';
import { NavLink, Link, Outlet, Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Route,
  Target,
  Code2,
  Layers,
  BookOpen,
  FolderKanban,
  ClipboardCheck,
  Sparkles,
  UserRound,
  Settings,
  Menu,
  Bell,
  LogOut,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { Brand } from '../Brand';
import { useAuth } from '../../app/providers';
import { notificationsApi, userApi } from '../../api/domains';
import { useData, useAction } from '../../hooks/data';
import {
  Avatar,
  Button,
  Modal,
  LoadingState,
  ErrorState,
  PageState,
  EmptyState,
  dateLabel,
} from '../ui';
import { toast } from 'sonner';
const navigation = [
  { label: 'Overview', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Roadmaps', path: '/roadmaps', icon: Route },
  { label: 'Goals', path: '/goals', icon: Target },
  { label: 'Skills', path: '/skills', icon: Code2 },
  { label: 'Topics', path: '/topics', icon: Layers },
  { label: 'Resources', path: '/resources', icon: BookOpen },
  { label: 'Projects', path: '/projects', icon: FolderKanban },
  { label: 'Assessments', path: '/assessments', icon: ClipboardCheck },
  { label: 'Recommendations', path: '/recommendations', icon: Sparkles },
];
export default function Shell() {
  const auth = useAuth();
  const location = useLocation();
  const [drawer, setDrawer] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const profile = useData(['profile'], userApi.profile, !!auth.user);
  const notices = useData(
    ['notifications', 'header'],
    () => notificationsApi.list({ limit: 8 }),
    !!auth.user,
  );
  const read = useAction(notificationsApi.read, '');
  if (!auth.authenticated)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (auth.pending)
    return (
      <div className="boot">
        <Brand />
        <LoadingState />
      </div>
    );
  if (auth.error)
    return (
      <div className="boot">
        <Brand />
        <ErrorState error={auth.error} retry={() => window.location.reload()} />
      </div>
    );
  const name =
    profile.data?.full_name || auth.user?.full_name || auth.user?.username || 'Your account';
  const nav = (
    <>
      <div className="sidebar-head">
        <Brand />
        <span className="workspace-label">PERSONAL WORKSPACE</span>
      </div>
      <nav aria-label="Main navigation">
        {navigation.map((item, index) => (
          <div key={item.path}>
            {index === 3 && <span className="nav-section">YOUR LEARNING</span>}
            {index === 8 && <span className="nav-section">NEXT STEPS</span>}
            <NavLink
              to={item.path}
              onClick={() => setDrawer(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
              {item.path === '/recommendations' && <span className="nav-dot" />}
            </NavLink>
          </div>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <NavLink className="nav-item" to="/profile" onClick={() => setDrawer(false)}>
          <UserRound size={18} />
          Profile
        </NavLink>
        <NavLink className="nav-item" to="/settings" onClick={() => setDrawer(false)}>
          <Settings size={18} />
          Settings
        </NavLink>
        <div className="account-row">
          <Avatar name={name} url={profile.data?.avatar_url} />
          <div>
            <strong>{name}</strong>
            <span>@{auth.user?.username}</span>
          </div>
          <button className="icon-button" aria-label="Sign out" onClick={() => void auth.logout()}>
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">{nav}</aside>
      <Modal open={drawer} onClose={() => setDrawer(false)} title="Your workspace">
        <div className="mobile-nav">{nav}</div>
      </Modal>
      <div className="workspace">
        <header className="topbar">
          <div>
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setDrawer(true)}
            >
              <Menu size={22} />
            </button>
            <span className="topbar-workspace">Workspace</span>
            <ChevronRight size={14} />
            <strong>
              {navigation.find((n) => location.pathname.startsWith(n.path))?.label ||
                (location.pathname === '/profile' ? 'Profile' : 'Settings')}
            </strong>
          </div>
          <div>
            <span className="topbar-note">Make a little progress today.</span>
            <button
              className="icon-button notification-button"
              aria-label="Open notifications"
              onClick={() => setNotifications(true)}
            >
              <Bell size={19} />
              {notices.data?.some((n) => !n.read_at) && <span />}
            </button>
            <Link to="/profile" aria-label="Your profile">
              <Avatar name={name} url={profile.data?.avatar_url} />
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Small steps. Meaningful progress.</span>
          <Link to="/recommendations">
            Find your next step <ArrowUpRight size={14} />
          </Link>
        </footer>
      </div>
      <Modal
        open={notifications}
        onClose={() => setNotifications(false)}
        title="Notifications"
        description="Updates from your learning journey."
      >
        <PageState query={notices}>
          {notices.data?.length ? (
            notices.data.map((item) => (
              <div className="notification-item" key={item.id}>
                <div>
                  <strong>{item.message}</strong>
                  <p>{dateLabel(item.created_at)}</p>
                </div>
                {!item.read_at && (
                  <Button
                    variant="ghost"
                    disabled={read.isPending}
                    onClick={() => read.mutate(item.id, { onError: (e) => toast.error(e.message) })}
                  >
                    Mark read
                  </Button>
                )}
              </div>
            ))
          ) : (
            <EmptyState
              title="You’re all caught up"
              description="Generate a roadmap to receive your first update."
            />
          )}
        </PageState>
      </Modal>
    </div>
  );
}
