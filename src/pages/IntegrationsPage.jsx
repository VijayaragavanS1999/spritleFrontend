import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function IntegrationsPage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Freshdesk
  const [fdKey, setFdKey] = useState('');
  const [fdDomain, setFdDomain] = useState('');
  const [fdLoading, setFdLoading] = useState(false);

  // HubSpot OAuth
  const [hsLoading, setHsLoading] = useState(false);
  const [hsStatus, setHsStatus] = useState('idle'); // idle | checking | connected | error
  const [hsPortalId, setHsPortalId] = useState(null);

  // Check HubSpot status on load
  const checkHsStatus = async () => {
    setHsStatus('checking');
    try {
      const res = await api.get('/hubspot/status');
      if (res.data.connected) {
        setHsStatus('connected');
        setHsPortalId(res.data.portalId);
      } else {
        setHsStatus('error');
      }
    } catch {
      setHsStatus('error');
    }
  };

  // Handle OAuth redirect back from HubSpot
  useEffect(() => {
    const hubspotResult = searchParams.get('hubspot');
    if (hubspotResult === 'connected') {
      addToast('HubSpot connected successfully!', 'success');
      setSearchParams({});
      refreshUser();
      checkHsStatus();
    } else if (hubspotResult === 'error') {
      addToast('HubSpot connection failed. Please try again.', 'error');
      setSearchParams({});
    }
    checkHsStatus();
  }, []);

  const connectFreshdesk = async (e) => {
    e.preventDefault();
    if (!fdKey || !fdDomain) return;
    setFdLoading(true);
    try {
      const res = await api.post('/freshdesk/connect', { apiKey: fdKey, domain: fdDomain });
      addToast(`Freshdesk connected! Agent: ${res.data.agent?.name || 'OK'}`, 'success');
      setFdKey('');
      setFdDomain('');
      await refreshUser();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to connect Freshdesk', 'error');
    } finally {
      setFdLoading(false);
    }
  };

  const disconnectFreshdesk = async () => {
    try {
      await api.delete('/freshdesk/disconnect');
      addToast('Freshdesk disconnected', 'info');
      await refreshUser();
    } catch {
      addToast('Failed to disconnect', 'error');
    }
  };

  const connectHubSpot = async () => {
    setHsLoading(true);
    try {
      const res = await api.get('/hubspot/auth-url');
      // Redirect to HubSpot OAuth
      window.location.href = res.data.url;
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to start HubSpot OAuth', 'error');
      setHsLoading(false);
    }
  };

  const disconnectHubSpot = async () => {
    try {
      await api.delete('/hubspot/disconnect');
      addToast('HubSpot disconnected', 'info');
      setHsStatus('error');
      setHsPortalId(null);
      await refreshUser();
    } catch {
      addToast('Failed to disconnect HubSpot', 'error');
    }
  };

  const webhookUrl = `${window.location.protocol}//${window.location.hostname}:5000/api/webhook/freshdesk`;

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <h1 style={styles.title}>Integrations</h1>
        <p style={styles.subtitle}>
          Connect your Freshdesk and HubSpot accounts to power the portal.
        </p>
      </div>

      <div style={styles.cards}>

        {/* ── Freshdesk ── */}
        <div className="card" style={styles.intCard}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrap}><span style={{ fontSize: 24 }}>🟢</span></div>
            <div style={styles.cardInfo}>
              <h2 style={styles.cardTitle}>Freshdesk</h2>
              <p style={styles.cardDesc}>Connect via API key to view and manage support tickets.</p>
            </div>
            <span className={`badge badge-${user?.integrations?.freshdesk ? 'connected' : 'disconnected'}`}>
              {user?.integrations?.freshdesk ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {user?.integrations?.freshdesk ? (
            <div style={styles.connectedInfo}>
              <div style={styles.connectedRow}>
                <span style={styles.connectedLabel}>Domain</span>
                <code style={styles.connectedVal}>{user.freshdeskDomain}.freshdesk.com</code>
              </div>
              <div style={styles.connectedRow}>
                <span style={styles.connectedLabel}>API Key</span>
                <code style={styles.connectedVal}>••••••••••••••••</code>
              </div>
              <button className="btn btn-danger btn-sm" onClick={disconnectFreshdesk} style={{ marginTop: 12 }}>
                Disconnect Freshdesk
              </button>
            </div>
          ) : (
            <form onSubmit={connectFreshdesk} style={styles.form}>
              <div style={styles.field}>
                <label>Freshdesk Domain</label>
                <div style={styles.inputGroup}>
                  <input
                    type="text"
                    placeholder="yourcompany"
                    value={fdDomain}
                    onChange={e => setFdDomain(e.target.value)}
                    required
                    style={{ borderRadius: '6px 0 0 6px', borderRight: 'none' }}
                  />
                  <span style={styles.inputSuffix}>.freshdesk.com</span>
                </div>
              </div>
              <div style={styles.field}>
                <label>API Key</label>
                <input
                  type="password"
                  placeholder="Your Freshdesk API key"
                  value={fdKey}
                  onChange={e => setFdKey(e.target.value)}
                  required
                />
                <p style={styles.fieldHint}>Profile Settings → Your API Key (top-right avatar in Freshdesk)</p>
              </div>
              <button className="btn btn-primary" type="submit" disabled={fdLoading}>
                {fdLoading ? <span className="spinner spinner-sm" /> : null}
                Connect Freshdesk
              </button>
            </form>
          )}
        </div>

        {/* ── HubSpot ── */}
        <div className="card" style={styles.intCard}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrap}><span style={{ fontSize: 24 }}>🟠</span></div>
            <div style={styles.cardInfo}>
              <h2 style={styles.cardTitle}>HubSpot</h2>
              <p style={styles.cardDesc}>Connect via OAuth to look up contacts in your CRM.</p>
            </div>
            <span className={`badge badge-${hsStatus === 'connected' ? 'connected' : hsStatus === 'checking' ? 'pending' : 'disconnected'}`}>
              {hsStatus === 'checking' ? 'Checking…' : hsStatus === 'connected' ? 'Connected' : 'Not connected'}
            </span>
          </div>

          {hsStatus === 'connected' ? (
            <div style={styles.connectedInfo}>
              <div style={styles.connectedRow}>
                <span style={styles.connectedLabel}>Auth Method</span>
                <code style={styles.connectedVal}>OAuth 2.0</code>
              </div>
              <div style={styles.connectedRow}>
                <span style={styles.connectedLabel}>Portal ID</span>
                <code style={styles.connectedVal}>{hsPortalId || '—'}</code>
              </div>
              <div style={styles.connectedRow}>
                <span style={styles.connectedLabel}>Token</span>
                <code style={styles.connectedVal}>Active ✓</code>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={connectHubSpot} disabled={hsLoading}>
                  {hsLoading ? <span className="spinner spinner-sm" /> : 'Reconnect'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={disconnectHubSpot}>
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.form}>
              <p style={styles.oauthDesc}>
                Click below to authorize this portal to access your HubSpot CRM.
                You'll be redirected to HubSpot to approve access.
              </p>
              <div style={styles.oauthScopes}>
                <span style={styles.scope}>crm.objects.contacts.read</span>
                <span style={styles.scope}>crm.objects.contacts.write</span>
                <span style={styles.scope}>oauth</span>
              </div>
              <button className="btn btn-primary" onClick={connectHubSpot} disabled={hsLoading}>
                {hsLoading ? <span className="spinner spinner-sm" /> : '🟠'}
                Connect with HubSpot
              </button>
              
            </div>
          )}
        </div>

        {/* ── Webhook Setup ── */}
        <div className="card" style={{ ...styles.intCard, gridColumn: '1 / -1' }}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrap}><span style={{ fontSize: 24 }}>⚡</span></div>
            <div style={styles.cardInfo}>
              <h2 style={styles.cardTitle}>Freshdesk Webhook</h2>
              <p style={styles.cardDesc}>Configure Freshdesk to send events to your portal in real time.</p>
            </div>
          </div>

          <div style={styles.webhookSetup}>
            <div style={styles.webhookStep}>
              <div style={styles.stepNum}>1</div>
              <div style={styles.stepBody}>
                <div style={styles.stepTitle}>Copy your Webhook URL</div>
                <div style={styles.urlBox}>
                  <code style={styles.webhookUrl}>{webhookUrl}</code>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { navigator.clipboard.writeText(webhookUrl); addToast('Copied!', 'success'); }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
            <div style={styles.webhookStep}>
              <div style={styles.stepNum}>2</div>
              <div style={styles.stepBody}>
                <div style={styles.stepTitle}>Create an Automation in Freshdesk</div>
                <p style={styles.stepDesc}>
                  Go to <strong>Admin → Workflows → Automations → Ticket Creation / Updates</strong>.
                  Add a <em>Trigger Webhook</em> action with method <code>POST</code> and paste the URL above.
                </p>
              </div>
            </div>
            <div style={styles.webhookStep}>
              <div style={styles.stepNum}>3</div>
              <div style={styles.stepBody}>
                <div style={styles.stepTitle}>Verify in Webhook Logs</div>
                <p style={styles.stepDesc}>
                  Create or update a ticket in Freshdesk — it will appear in the <strong>Webhook Logs</strong> page within seconds.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: { padding: '32px 40px' },
  header: { marginBottom: 28 },
  title: { fontFamily: 'DM Serif Display', fontSize: 28, color: '#f0f2f7', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#8b92a5' },
  cards: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  intCard: { display: 'flex', flexDirection: 'column', gap: 20 },
  cardHeader: { display: 'flex', alignItems: 'flex-start', gap: 14 },
  iconWrap: { flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 600, color: '#f0f2f7', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#8b92a5', lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid #2a2e38', paddingTop: 20 },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldHint: { fontSize: 11, color: '#555c6e', marginTop: 4, lineHeight: 1.6 },
  inputGroup: { display: 'flex' },
  inputSuffix: {
    background: '#22262f', border: '1px solid #2a2e38',
    borderLeft: 'none', borderRadius: '0 6px 6px 0',
    padding: '10px 14px', fontSize: 12, color: '#555c6e',
    display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
  },
  connectedInfo: { borderTop: '1px solid #2a2e38', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  connectedRow: { display: 'flex', alignItems: 'center', gap: 12 },
  connectedLabel: { fontSize: 11, color: '#555c6e', width: 90 },
  connectedVal: { fontSize: 12, color: '#f59e0b', background: '#f59e0b0a', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' },
  oauthDesc: { fontSize: 13, color: '#8b92a5', lineHeight: 1.7 },
  oauthScopes: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  scope: { background: '#3b82f618', color: '#3b82f6', fontSize: 11, padding: '3px 8px', borderRadius: 4, fontFamily: 'monospace' },
  webhookSetup: { display: 'flex', flexDirection: 'column', gap: 20, borderTop: '1px solid #2a2e38', paddingTop: 20 },
  webhookStep: { display: 'flex', gap: 16, alignItems: 'flex-start' },
  stepNum: { width: 28, height: 28, borderRadius: '50%', background: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 13, fontWeight: 600, color: '#f0f2f7', marginBottom: 6 },
  stepDesc: { fontSize: 12, color: '#8b92a5', lineHeight: 1.7 },
  urlBox: { display: 'flex', alignItems: 'center', gap: 10, background: '#0d0e11', border: '1px solid #2a2e38', borderRadius: 6, padding: '8px 14px', marginTop: 6 },
  webhookUrl: { flex: 1, fontSize: 11, color: '#f59e0b', fontFamily: 'monospace', wordBreak: 'break-all' },
};