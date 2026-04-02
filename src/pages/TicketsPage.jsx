import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const STATUS_MAP = { 2: 'open', 3: 'pending', 4: 'resolved', 5: 'closed' };
const PRIORITY_MAP = { 1: 'low', 2: 'medium', 3: 'high', 4: 'urgent' };

export default function TicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user?.integrations?.freshdesk) { setLoading(false); return; }
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/freshdesk/tickets?page=${page}&per_page=30`);
        setTickets(prev => page === 1 ? res.data : [...prev, ...res.data]);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user, page]);

  const filtered = tickets.filter(t => {
    const matchSearch = !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.requester?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || STATUS_MAP[t.status] === filterStatus;
    return matchSearch && matchStatus;
  });

  if (!user?.integrations?.freshdesk) {
    return (
      <div style={styles.page} className="fade-in">
        <div className="empty-state">
          <div className="empty-state-icon">🎫</div>
          <h3>Freshdesk not connected</h3>
          <p>Connect your Freshdesk account to view tickets.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/integrations')}>
            Connect Freshdesk
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Tickets</h1>
          <p style={styles.subtitle}>
            {loading ? 'Loading…' : `${filtered.length} ticket${filtered.length !== 1 ? 's' : ''} shown`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by subject or requester…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...styles.searchInput, flex: 1 }}
        />
        <div style={styles.statusFilters}>
          {['all', 'open', 'pending', 'resolved', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                ...styles.filterBtn,
                ...(filterStatus === s ? styles.filterBtnActive : {}),
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={styles.errorBox}>❌ {error}</div>
      )}

      {loading && page === 1 ? (
        <div style={styles.loadingCenter}>
          <div className="spinner spinner-lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎫</div>
          <h3>No tickets found</h3>
          <p>{search || filterStatus !== 'all' ? 'Try adjusting your filters.' : 'Your Freshdesk inbox is empty.'}</p>
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div style={styles.tableHeader}>
            <span style={{ flex: 3 }}>Subject</span>
            <span style={{ flex: 1 }}>Requester</span>
            <span style={{ width: 100 }}>Status</span>
            <span style={{ width: 90 }}>Priority</span>
            <span style={{ width: 110 }}>Created</span>
          </div>

          <div style={styles.ticketList}>
            {filtered.map((ticket, i) => (
              <TicketRow key={ticket.id} ticket={ticket} delay={i * 30} onClick={() => navigate(`/tickets/${ticket.id}`)} />
            ))}
          </div>

          {tickets.length > 0 && tickets.length % 30 === 0 && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(p => p + 1)}
                disabled={loading}
              >
                {loading ? <span className="spinner spinner-sm" /> : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TicketRow({ ticket, delay, onClick }) {
  const status = STATUS_MAP[ticket.status] || 'open';
  const priority = PRIORITY_MAP[ticket.priority] || 'low';

  const formatDate = (str) => {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      className="card-hover"
      onClick={onClick}
      style={{ ...styles.ticketRow, animationDelay: `${delay}ms` }}
    >
      <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={styles.subject}>{ticket.subject || '(No subject)'}</span>
        {ticket.description_text && (
          <span style={styles.preview}>
            {ticket.description_text.slice(0, 80)}…
          </span>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={styles.requesterName}>{ticket.requester?.name || '—'}</div>
        <div style={styles.requesterEmail}>{ticket.requester?.email || ''}</div>
      </div>
      <div style={{ width: 100 }}>
        <span className={`badge badge-${status}`}>{status}</span>
      </div>
      <div style={{ width: 90 }}>
        <span className={`badge badge-${priority}`}>{priority}</span>
      </div>
      <div style={{ width: 110, fontSize: 11, color: '#555c6e' }}>
        {formatDate(ticket.created_at)}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px 40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontFamily: 'DM Serif Display', fontSize: 28, color: '#f0f2f7', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#8b92a5' },
  filters: { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' },
  searchInput: { maxWidth: 340 },
  statusFilters: { display: 'flex', gap: 6, background: '#14161b', padding: 4, borderRadius: 8 },
  filterBtn: {
    padding: '5px 12px', borderRadius: 6, border: 'none',
    background: 'transparent', color: '#555c6e',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    fontFamily: 'DM Sans', transition: 'all 0.15s',
  },
  filterBtnActive: { background: '#22262f', color: '#f0f2f7' },
  errorBox: {
    background: '#ef444418', border: '1px solid #ef4444',
    borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#ef4444', marginBottom: 16,
  },
  loadingCenter: { display: 'flex', justifyContent: 'center', padding: 60 },
  tableHeader: {
    display: 'flex', alignItems: 'center',
    padding: '8px 20px', marginBottom: 6,
    fontSize: 11, fontWeight: 600, color: '#555c6e',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    gap: 12,
  },
  ticketList: { display: 'flex', flexDirection: 'column', gap: 6 },
  ticketRow: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 20px',
    background: '#1a1d24', border: '1px solid #2a2e38',
    borderRadius: 10,
    animation: 'fadeUp 0.35s ease forwards',
    opacity: 0,
    cursor: 'pointer',
  },
  subject: { fontSize: 14, fontWeight: 500, color: '#f0f2f7' },
  preview: { fontSize: 11, color: '#555c6e' },
  requesterName: { fontSize: 12, fontWeight: 500, color: '#8b92a5' },
  requesterEmail: { fontSize: 11, color: '#555c6e' },
};
