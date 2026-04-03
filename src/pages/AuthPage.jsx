import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        addToast('Welcome back!', 'success');
      } else {
        await signup(form.name, form.email, form.password);
        addToast('Account created!', 'success');
      }
      navigate('/dashboard');
    } catch (err) {
      addToast(err.response?.data?.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background grid */}
      <div style={styles.grid} aria-hidden />

      <div style={styles.left}>
        <div style={styles.brand}>
          <div style={styles.logo}>SB</div>
          <span style={styles.brandName}>SupportBridge</span>
        </div>
        <h1 style={styles.headline}>
          Your support stack,<br />
          <em style={styles.italic}>unified.</em>
        </h1>
        <p style={styles.sub}>
          Connect Freshdesk tickets with HubSpot CRM data
          in one seamless portal.
        </p>
        <div style={styles.features}>
          {['Freshdesk ticket viewer', 'HubSpot CRM lookup', 'Webhook event logs'].map(f => (
            <div key={f} style={styles.feature}>
              <span style={styles.featureDot} />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card} className="fade-up">
          <div style={styles.tabs}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{ ...styles.tab, ...(mode === m ? styles.tabActive : {}) }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {mode === 'signup' && (
              <div style={styles.field}>
                <label>Full Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            )}
            <div style={styles.field}>
              <label>Email Address</label>
              <input
                name="email"
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
            <div style={styles.field}>
              <label>Password</label>
              <input
                name="password"
                type="password"
                placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? <span className="spinner spinner-sm" /> : null}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    position: 'relative',
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(245,158,11,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,158,11,0.03) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
  },
  left: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '60px 80px',
    position: 'relative',
  },
  right: {
    width: 460,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 60px',
    borderLeft: '1px solid #1f2229',
    background: 'rgba(20,22,27,0.8)',
    backdropFilter: 'blur(20px)',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48,
  },
  logo: {
    width: 40, height: 40,
    background: '#f59e0b',
    color: '#000',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14, fontFamily: 'DM Sans',
    letterSpacing: '0.05em',
  },
  brandName: {
    fontSize: 18, fontWeight: 600, color: '#f0f2f7',
    fontFamily: 'DM Sans',
  },
  headline: {
    fontFamily: 'DM Serif Display',
    fontSize: 52,
    lineHeight: 1.15,
    color: '#f0f2f7',
    marginBottom: 20,
    letterSpacing: '-0.01em',
  },
  italic: {
    color: '#f59e0b',
    fontStyle: 'italic',
  },
  sub: {
    fontSize: 16,
    color: '#8b92a5',
    lineHeight: 1.7,
    maxWidth: 380,
    marginBottom: 40,
  },
  features: { display: 'flex', flexDirection: 'column', gap: 12 },
  feature: {
    display: 'flex', alignItems: 'center', gap: 12,
    fontSize: 14, color: '#8b92a5',
  },
  featureDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#f59e0b', flexShrink: 0,
  },
  card: {
    background: '#1a1d24',
    border: '1px solid #2a2e38',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
  },
  tabs: {
    display: 'flex',
    background: '#14161b',
    borderRadius: 8,
    padding: 4,
    marginBottom: 28,
    gap: 4,
  },
  tab: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: 6,
    border: 'none',
    background: 'transparent',
    color: '#555c6e',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'DM Sans',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: '#1a1d24',
    color: '#f0f2f7',
    boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  field: { display: 'flex', flexDirection: 'column' },
  hint: {
    marginTop: 20,
    fontSize: 12,
    color: '#555c6e',
    textAlign: 'center',
  },
  code: {
    background: '#22262f',
    padding: '1px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#f59e0b',
  },
};
