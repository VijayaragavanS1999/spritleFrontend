import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tickets: 0, webhooks: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const promises = [];
        if (user?.integrations?.freshdesk) {
          promises.push(api.get('/freshdesk/tickets?per_page=1').then(r => r.data));
        }
        promises.push(api.get('/webhook/logs?limit=5').then(r => r.data));

        const results = await Promise.allSettled(promises);
        let ticketCount = 0;
        let webhookData = { logs: [], pagination: { total: 0 } };

        if (user?.integrations?.freshdesk && results[0]?.status === 'fulfilled') {
          ticketCount = Array.isArray(results[0].value) ? results[0].value.length : 0;
          webhookData = results[1]?.value || webhookData;
        } else {
          webhookData = results[0]?.value || webhookData;
        }

        setStats({ tickets: ticketCount, webhooks: webhookData.pagination?.total || 0 });
        setRecentLogs(webhookData.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [user]);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div style={styles.page} className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Good {getGreeting()},{' '}
            <span style={styles.name}>{user?.name?.split(' ')[0] || 'there'}</span>
          </h1>
          <p style={styles.subtitle}>Here's what's happening with your support stack.</p>
        </div>
        <div style={styles.headerActions}>
          {!user?.integrations?.freshdesk && (
            <Link to="/integrations" className="btn btn-primary btn-sm">
              Connect Integrations →
            </Link>
          )}
        </div>
      </div>

      {/* Integration Banner if not connected */}
      {(!user?.integrations?.freshdesk || !user?.integrations?.hubspot) && (
        <div style={styles.banner}>
          <span style={styles.bannerIcon}>🔗</span>
          <div style={styles.bannerText}>
            <strong>Set up your integrations</strong>
            <span> — Connect Freshdesk and HubSpot to get started.</span>
          </div>
          <Link to="/integrations" className="btn btn-secondary btn-sm">Configure →</Link>
        </div>
      )}

      {/* Stats */}
      <div style={styles.statsGrid}>
        <StatCard
          icon="🎫"
          label="Total Tickets"
          value={loadingStats ? '—' : (user?.integrations?.freshdesk ? stats.tickets : 'N/A')}
          sub={user?.integrations?.freshdesk ? 'From Freshdesk' : 'Connect Freshdesk'}
          color="#3b82f6"
          link={user?.integrations?.freshdesk ? '/tickets' : '/integrations'}
        />
        <StatCard
          icon="⚡"
          label="Webhook Events"
          value={loadingStats ? '—' : stats.webhooks}
          sub="Total received"
          color="#f59e0b"
          link="/webhooks"
        />
        <StatCard
          icon="🟢"
          label="Freshdesk"
          value={user?.integrations?.freshdesk ? 'Connected' : 'Not connected'}
          sub={user?.freshdeskDomain ? `${user.freshdeskDomain}.freshdesk.com` : 'API key required'}
          color={user?.integrations?.freshdesk ? '#10b981' : '#555c6e'}
          link="/integrations"
        />
        <StatCard
          icon="🟠"
          label="HubSpot"
          value={user?.integrations?.hubspot ? 'Connected' : 'Not connected'}
          sub={user?.integrations?.hubspot ? 'OAuth active' : 'OAuth required'}
          color={user?.integrations?.hubspot ? '#ff7a59' : '#555c6e'}
          link="/integrations"
        />
      </div>

      {/* Recent Webhook Logs */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Webhook Events</h2>
          <Link to="/webhooks" style={styles.seeAll}>See all →</Link>
        </div>
        {loadingStats ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : recentLogs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">⚡</div>
            <h3>No webhook events yet</h3>
            <p>Configure a Freshdesk webhook to start receiving events. Check the Integrations page for instructions.</p>
          </div>
        ) : (
          <div style={styles.logList}>
            {recentLogs.map((log) => (
              <div key={log._id} style={styles.logRow}>
                <div style={styles.logType}>
                  <span style={styles.logDot} />
                  <code style={styles.logTypeText}>{log.eventType}</code>
                </div>
                <span style={styles.logSource}>{log.source}</span>
                <span style={styles.logTime}>{timeAgo(log.createdAt)}</span>
                <span className={`badge badge-${log.status === 'processed' ? 'resolved' : 'open'}`}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div style={styles.quickLinks}>
        {[
          { icon: '🎫', label: 'View Tickets', desc: 'Browse all Freshdesk tickets', to: '/tickets' },
          { icon: '⚡', label: 'Webhook Logs', desc: 'Inspect incoming events', to: '/webhooks' },
          { icon: '🔗', label: 'Integrations', desc: 'Manage API connections', to: '/integrations' },
        ].map(({ icon, label, desc, to }) => (
          <Link key={to} to={to} style={styles.quickLink} className="card-hover">
            <span style={styles.qlIcon}>{icon}</span>
            <div>
              <div style={styles.qlLabel}>{label}</div>
              <div style={styles.qlDesc}>{desc}</div>
            </div>
            <span style={styles.qlArrow}>→</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, link }) {
  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div className="card card-hover" style={styles.statCard}>
        <div style={{ ...styles.statIcon, background: color + '18', color }}>
          {icon}
        </div>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
        <div style={styles.statSub}>{sub}</div>
      </div>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = {
  page: { padding: '32px 40px', maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  title: { fontFamily: 'DM Serif Display', fontSize: 32, color: '#f0f2f7', marginBottom: 6 },
  name: { color: '#f59e0b' },
  subtitle: { fontSize: 14, color: '#8b92a5' },
  headerActions: { display: 'flex', gap: 8, alignItems: 'center' },
  banner: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#f59e0b0a', border: '1px solid #f59e0b33',
    borderRadius: 10, padding: '14px 18px', marginBottom: 28,
  },
  bannerIcon: { fontSize: 18 },
  bannerText: { flex: 1, fontSize: 13, color: '#8b92a5' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
  statCard: { display: 'flex', flexDirection: 'column', gap: 8, padding: 20 },
  statIcon: { width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 },
  statValue: { fontSize: 22, fontWeight: 700, color: '#f0f2f7', fontFamily: 'DM Serif Display' },
  statLabel: { fontSize: 12, fontWeight: 600, color: '#8b92a5', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statSub: { fontSize: 11, color: '#555c6e' },
  section: { background: '#1a1d24', border: '1px solid #2a2e38', borderRadius: 14, padding: 24, marginBottom: 24 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#f0f2f7' },
  seeAll: { fontSize: 12, color: '#f59e0b', textDecoration: 'none' },
  logList: { display: 'flex', flexDirection: 'column', gap: 10 },
  logRow: { display: 'flex', alignItems: 'center', gap: 16, padding: '10px 14px', background: '#14161b', borderRadius: 8, border: '1px solid #1f2229' },
  logType: { display: 'flex', alignItems: 'center', gap: 8, flex: 1 },
  logDot: { width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 },
  logTypeText: { fontSize: 12, color: '#8b92a5', fontFamily: 'monospace' },
  logSource: { fontSize: 11, color: '#555c6e', textTransform: 'uppercase', letterSpacing: '0.05em' },
  logTime: { fontSize: 11, color: '#555c6e' },
  quickLinks: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 },
  quickLink: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#1a1d24', border: '1px solid #2a2e38',
    borderRadius: 12, padding: '16px 20px', textDecoration: 'none',
  },
  qlIcon: { fontSize: 22, flexShrink: 0 },
  qlLabel: { fontSize: 14, fontWeight: 600, color: '#f0f2f7', marginBottom: 2 },
  qlDesc: { fontSize: 12, color: '#555c6e' },
  qlArrow: { marginLeft: 'auto', color: '#555c6e', fontSize: 16 },
};
