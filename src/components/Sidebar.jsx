import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/tickets', icon: '🎫', label: 'Tickets' },
  { to: '/webhooks', icon: '⚡', label: 'Webhook Logs' },
  { to: '/integrations', icon: '🔗', label: 'Integrations' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.logo}>SB</div>
        <div>
          <div style={styles.brandName}>SupportBridge</div>
          <div style={styles.brandSub}>Portal</div>
        </div>
      </div>

      {/* Integration status pills */}
      <div style={styles.statusBar}>
        <div style={styles.statusPill}>
          <span style={{ ...styles.dot, background: user?.integrations?.freshdesk ? '#10b981' : '#f44227' }} />
          <span style={styles.statusLabel}>Freshdesk</span>
        </div>
        <div style={styles.statusPill}>
          <span style={{ ...styles.dot, background: user?.integrations?.hubspot ? '#10b981' : '#f44227' }} />
          <span style={styles.statusLabel}>HubSpot</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={styles.nav}>
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navActive : {}),
            })}
          >
            <span style={styles.navIcon}>{icon}</span>
            <span>{label}</span>
            {to === '/webhooks' && (
              <span style={styles.liveIndicator} title="Live" />
            )}
          </NavLink>
        ))}
      </nav>

      <div style={styles.spacer} />

      {/* User section */}
      <div style={styles.userSection}>
        <div style={styles.avatar}>{initials}</div>
        <div style={styles.userInfo}>
          <div style={styles.userName}>{user?.name || 'User'}</div>
          <div style={styles.userEmail}>{user?.email}</div>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Sign out">
          ⎋
        </button>
      </div>
    </aside>
  );
}

const styles = {
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '24px 20px 20px',
    borderBottom: '1px solid #1f2229',
  },
  logo: {
    width: 34, height: 34,
    background: '#f59e0b', color: '#000',
    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 12, flexShrink: 0,
  },
  brandName: { fontSize: 14, fontWeight: 600, color: '#f0f2f7' },
  brandSub: { fontSize: 10, color: '#555c6e', textTransform: 'uppercase', letterSpacing: '0.08em' },
  statusBar: {
    display: 'flex', flexDirection: 'column', gap: 6,
    padding: '14px 20px',
    borderBottom: '1px solid #1f2229',
  },
  statusPill: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  statusLabel: { fontSize: 11, color: '#8b92a5' },
  nav: { display: 'flex', flexDirection: 'column', gap: 2, padding: '12px 10px' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 13, fontWeight: 500,
    color: '#8b92a5',
    textDecoration: 'none',
    transition: 'all 0.15s',
    position: 'relative',
  },
  navActive: {
    background: '#22262f',
    color: '#f0f2f7',
  },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  liveIndicator: {
    marginLeft: 'auto',
    width: 6, height: 6,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 6px #10b981',
    animation: 'pulse 2s infinite',
  },
  spacer: { flex: 1 },
  userSection: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '16px 16px',
    borderTop: '1px solid #1f2229',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: '#f59e0b22', color: '#f59e0b',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 600, flexShrink: 0,
    border: '1px solid #f59e0b44',
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: 12, fontWeight: 600, color: '#f0f2f7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: 10, color: '#555c6e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: {
    background: 'none', border: 'none',
    color: '#555c6e', fontSize: 16, cursor: 'pointer',
    padding: 4, borderRadius: 4,
    transition: 'color 0.15s',
    flexShrink: 0,
  },
};
