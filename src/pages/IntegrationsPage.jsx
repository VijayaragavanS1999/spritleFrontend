import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

export default function IntegrationsPage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  // Freshdesk
  const [fdKey, setFdKey] = useState('');
  const [fdDomain, setFdDomain] = useState('');
  const [fdLoading, setFdLoading] = useState(false);

  // HubSpot — Private App Token status
  const [hsStatus, setHsStatus] = useState('checking'); // 'checking' | 'connected' | 'error'
  const [hsPortalId, setHsPortalId] = useState(null);

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

  useEffect(() => { checkHsStatus(); }, []);

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

  const webhookUrl = `${window.location.protocol}//${window.location.hostname}:5000/api/webhook/freshdesk`;

  return (
    <div style={styles.page} className="fade-in">
      <div style={styles.header}>
        <h1 style={styles.title}>Integrations</h1>
        <p style={styles.subtitle}>Connect your Freshdesk and HubSpot accounts to power the portal.</p>
      </div>

      <div style={styles.cards}>

        {/* Freshdesk Card */}
        <div className="card" style={styles.intCard}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrap}>
              <span style={{ fontSize: 24 }}>🟢</span>
            </div>
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
                <p style={styles.fieldHint}>
                  Find your API key at: Profile Settings → Your API Key
                </p>
              </div>
              <button className="btn btn-primary" type="submit" disabled={fdLoading}>
                {fdLoading ? <span className="spinner spinner-sm" /> : null}
                Connect Freshdesk
              </button>
            </form>
          )}
        </div>

        {/* HubSpot Card */}
        <div className="card" style={styles.intCard}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrap}>
              <span style={{ fontSize: 24 }}>🟠</span>
            </div>
            <div style={styles.cardInfo}>
              <h2 style={styles.cardTitle}>HubSpot</h2>
              <p style={styles.cardDesc}>Uses a Private App Token configured in the server <code style={{fontSize:11,color:'#f59e0b'}}>.env</code> file.</p>
            </div>
            <span className={`badge badge-${hsStatus === 'connected' ? 'connected' : hsStatus === 'checking' ? 'pending' : 'disconnected'}`}>
              {hsStatus === 'checking' ? 'Checking…' : hsStatus === 'connected' ? 'Connected' : 'Not configured'}
            </span>
          </div>

          <div style={styles.connectedInfo}>
            {hsStatus === 'connected' ? (
              <>
                <div style={styles.connectedRow}>
                  <span style={styles.connectedLabel}>Auth Method</span>
                  <code style={styles.connectedVal}>Private App Token</code>
                </div>
                <div style={styles.connectedRow}>
                  <span style={styles.connectedLabel}>Portal ID</span>
                  <code style={styles.connectedVal}>{hsPortalId || '—'}</code>
                </div>
                <div style={styles.connectedRow}>
                  <span style={styles.connectedLabel}>Token</span>
                  <code style={styles.connectedVal}>pat-na2-••••••••</code>
                </div>
              </>
            ) : (
              <div style={styles.oauthDesc}>
                <p style={{ fontSize: 13, color: '#8b92a5', lineHeight: 1.7, marginBottom: 12 }}>
                  Add your Private App Token to <code style={{color:'#f59e0b',fontSize:12}}>backend/.env</code>:
                </p>
                <div className="code-block" style={{ fontSize: 12 }}>
                  {`HUBSPOT_PRIVATE_TOKEN=pat-na2-your-token-here`}
                </div>
                <p style={{ fontSize: 11, color: '#555c6e', marginTop: 10, lineHeight: 1.6 }}>
                  Get it from: <strong style={{color:'#8b92a5'}}>HubSpot → Settings → Integrations → Private Apps → Create</strong>
                  <br />Required scope: <code style={{color:'#3b82f6',fontSize:11}}>crm.objects.contacts.read</code>
                </p>
                <button className="btn btn-secondary btn-sm" style={{marginTop:12}} onClick={checkHsStatus}>
                  ↻ Re-check connection
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Webhook Setup Card */}
        <div className="card" style={{ ...styles.intCard, gridColumn: '1 / -1' }}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrap}>
              <span style={{ fontSize: 24 }}>⚡</span>
            </div>
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
                  Create a new rule and add a <em>Trigger Webhook</em> action.
                  Paste the URL above and set method to <code>POST</code>.
                </p>
              </div>
            </div>
            <div style={styles.webhookStep}>
              <div style={styles.stepNum}>3</div>
              <div style={styles.stepBody}>
                <div style={styles.stepTitle}>Verify in Webhook Logs</div>
                <p style={styles.stepDesc}>
                  Create or update a ticket in Freshdesk — the event will appear in the
                  <strong> Webhook Logs</strong> page within seconds.
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
  fieldHint: { fontSize: 11, color: '#555c6e', marginTop: 4 },
  inputGroup: { display: 'flex' },
  inputSuffix: {
    background: '#22262f', border: '1px solid #2a2e38',
    borderLeft: 'none', borderRadius: '0 6px 6px 0',
    padding: '10px 14px', fontSize: 12, color: '#555c6e',
    display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
  },
  connectedInfo: { borderTop: '1px solid #2a2e38', paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 },
  connectedRow: { display: 'flex', alignItems: 'center', gap: 12 },
  connectedLabel: { fontSize: 11, color: '#555c6e', width: 80 },
  connectedVal: { fontSize: 12, color: '#f59e0b', background: '#f59e0b0a', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' },
  hsActions: { display: 'flex', gap: 8, marginTop: 4 },
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
