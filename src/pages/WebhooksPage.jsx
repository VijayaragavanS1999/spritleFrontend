import { useEffect, useState, useCallback } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function WebhooksPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { addToast } = useToast();

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      const res = await api.get(`/webhook/logs?page=${page}&limit=50`);
      setLogs(res.data.logs || []);
      setPagination(res.data.pagination || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh every 5s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchLogs(pagination.page), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs, pagination.page]);

  const clearAll = async () => {
    if (!window.confirm('Clear all webhook logs?')) return;
    await api.delete('/webhook/logs');
    setLogs([]);
    setSelected(null);
    addToast('All logs cleared', 'info');
  };

  const deleteLog = async (id, e) => {
    e.stopPropagation();
    await api.delete(`/webhook/logs/${id}`);
    setLogs(prev => prev.filter(l => l._id !== id));
    if (selected?._id === id) setSelected(null);
    addToast('Log deleted', 'info');
  };

  const formatTime = (str) => new Date(str).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div style={styles.page} className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Webhook Logs</h1>
          <p style={styles.subtitle}>{pagination.total} total events received</p>
        </div>
        <div style={styles.actions}>
          <button
            className={`btn btn-sm ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAutoRefresh(a => !a)}
          >
            <span style={{ ...styles.liveDot, background: autoRefresh ? '#10b981' : '#555c6e' }} />
            {autoRefresh ? 'Live' : 'Paused'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchLogs(pagination.page)}>
            ↻ Refresh
          </button>
          {logs.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={clearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      <div style={styles.layout}>
        {/* Log list */}
        <div style={styles.logList}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <div className="spinner spinner-lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚡</div>
              <h3>No webhook events yet</h3>
              <p>Configure a Freshdesk webhook pointing to your backend endpoint. Events will appear here in real time.</p>
              <div style={styles.endpointHint}>
                <code style={styles.endpointCode}>POST /api/webhook/freshdesk</code>
              </div>
            </div>
          ) : (
            <>
              {logs.map((log) => (
                <div
                  key={log._id}
                  onClick={() => setSelected(log)}
                  style={{
                    ...styles.logRow,
                    ...(selected?._id === log._id ? styles.logRowActive : {}),
                  }}
                >
                  <div style={styles.logLeft}>
                    <div style={styles.logIndicator} />
                    <div>
                      <div style={styles.logEventType}>{log.eventType}</div>
                      <div style={styles.logTime}>{formatTime(log.createdAt)}</div>
                    </div>
                  </div>
                  <div style={styles.logRight}>
                    <span style={styles.logSource}>{log.source}</span>
                    <span className={`badge badge-${log.status === 'processed' ? 'resolved' : 'open'}`}>
                      {log.status}
                    </span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={(e) => deleteLog(log._id, e)}
                      style={{ color: '#555c6e', padding: '2px 6px' }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div style={styles.pagination}>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => fetchLogs(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        <div style={styles.detailPanel}>
          {selected ? (
            <div className="fade-in">
              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>Event Detail</h3>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelected(null)}
                  style={{ color: '#555c6e' }}
                >
                  ×
                </button>
              </div>

              <div style={styles.detailMeta}>
                <DetailRow label="Event Type" value={selected.eventType} mono />
                <DetailRow label="Source" value={selected.source} />
                <DetailRow label="Status" value={selected.status} />
                <DetailRow label="Received" value={formatTime(selected.createdAt)} />
                <DetailRow label="IP Address" value={selected.ipAddress || '—'} mono />
              </div>

              <div style={styles.payloadLabel}>Payload</div>
              <div className="code-block">
                {JSON.stringify(selected.payload, null, 2)}
              </div>

              {selected.headers && Object.keys(selected.headers).length > 0 && (
                <>
                  <div style={{ ...styles.payloadLabel, marginTop: 16 }}>Headers</div>
                  <div className="code-block">
                    {JSON.stringify(selected.headers, null, 2)}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div style={styles.detailEmpty}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>⚡</div>
              <p style={{ fontSize: 12, color: '#555c6e' }}>Select an event to inspect its payload</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: '#555c6e', width: 90, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#f0f2f7', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}

const styles = {
  page: { padding: '32px 40px', height: '100%', display: 'flex', flexDirection: 'column' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexShrink: 0 },
  title: { fontFamily: 'DM Serif Display', fontSize: 28, color: '#f0f2f7', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#8b92a5' },
  actions: { display: 'flex', gap: 8, alignItems: 'center' },
  liveDot: { width: 6, height: 6, borderRadius: '50%', display: 'inline-block' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, flex: 1, minHeight: 0 },
  logList: { overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 },
  logRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', background: '#1a1d24', border: '1px solid #2a2e38',
    borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
  },
  logRowActive: { borderColor: '#f59e0b', background: '#f59e0b08' },
  logLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  logIndicator: { width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 },
  logEventType: { fontSize: 12, fontWeight: 500, color: '#f0f2f7', fontFamily: 'monospace', marginBottom: 3 },
  logTime: { fontSize: 10, color: '#555c6e' },
  logRight: { display: 'flex', alignItems: 'center', gap: 8 },
  logSource: { fontSize: 10, color: '#555c6e', textTransform: 'uppercase', letterSpacing: '0.05em' },
  pagination: { display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 },
  detailPanel: {
    background: '#1a1d24', border: '1px solid #2a2e38',
    borderRadius: 14, padding: 20, overflowY: 'auto',
  },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  detailTitle: { fontSize: 14, fontWeight: 600, color: '#f0f2f7' },
  detailMeta: { background: '#14161b', border: '1px solid #1f2229', borderRadius: 8, padding: 14, marginBottom: 16 },
  payloadLabel: { fontSize: 11, color: '#555c6e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 },
  detailEmpty: { height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  endpointHint: { marginTop: 16, background: '#14161b', border: '1px solid #2a2e38', borderRadius: 8, padding: '10px 16px' },
  endpointCode: { fontSize: 12, color: '#f59e0b', fontFamily: 'monospace' },
};
