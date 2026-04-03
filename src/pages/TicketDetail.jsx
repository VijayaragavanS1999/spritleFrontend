import { startTransition, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const STATUS_MAP = { 2: 'open', 3: 'pending', 4: 'resolved', 5: 'closed' };
const PRIORITY_MAP = { 1: 'low', 2: 'medium', 3: 'high', 4: 'urgent' };

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [hubspotContact, setHubspotContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hsLoading, setHsLoading] = useState(false);
  const [hsError, setHsError] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const [ticketRes, convoRes] = await Promise.all([
          api.get(`/freshdesk/tickets/${id}`),
          api.get(`/freshdesk/tickets/${id}/conversations`),
        ]);
        setTicket(ticketRes.data);
        setConversations(convoRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load ticket');
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  // Look up HubSpot contact when ticket loads
  useEffect(() => {
    if (!ticket || !user?.integrations?.hubspot) return;
    const email = ticket.requester?.email;
    if (!email) return;

    const lookupContact = async () => {
      setHsLoading(true);
      setHsError(null);
      try {
        const res = await api.get(`/hubspot/contact?email=${encodeURIComponent(email)}`);
        setHubspotContact(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setHsError('not_found');
        } else {
          setHsError('error');
        }
      } finally {
        setHsLoading(false);
      }
    };
    lookupContact();
  }, [ticket, user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>❌ {error}</div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
      </div>
    );
  }

  const status = STATUS_MAP[ticket?.status] || 'open';
  const priority = PRIORITY_MAP[ticket?.priority] || 'low';

  const formatDate = (str) => str ? new Date(str).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '—';

  return (
    <div style={styles.page} className="fade-in">
      {/* Back */}
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')} style={{ marginBottom: 20 }}>
        ← Back to Tickets
      </button>

      <div style={styles.layout}>
        {/* Main column */}
        <div style={styles.main}>
          {/* Ticket header */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={styles.ticketMeta}>
              <span style={styles.ticketId}>#{ticket.id}</span>
              <span className={`badge badge-${status}`}>{status}</span>
              <span className={`badge badge-${priority}`}>{priority}</span>
            </div>
            <h1 style={styles.subject}>{ticket.subject}</h1>
            <div style={styles.metaRow}>
              <MetaItem label="Requester" value={ticket.requester?.name || '—'} />
              <MetaItem label="Email" value={ticket.requester?.email || '—'} />
              <MetaItem label="Created" value={formatDate(ticket.created_at)} />
              <MetaItem label="Updated" value={formatDate(ticket.updated_at)} />
            </div>
          </div>

          {/* Description */}
          {ticket.description_text && (
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={styles.sectionTitle}>Description</h3>
              <p style={styles.description}>{ticket.description_text}</p>
            </div>
          )}

          {/* Conversations */}
          <div className="card">
            <h3 style={styles.sectionTitle}>
              Conversations
              <span style={styles.count}>{conversations.length}</span>
            </h3>
            {conversations.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-state-icon">💬</div>
                <h3>No conversations yet</h3>
              </div>
            ) : (
              <div style={styles.convList}>
                {conversations.map((conv) => (
                  <ConversationItem key={conv.id} conv={conv} formatDate={formatDate} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: HubSpot panel */}
        <div style={styles.sidepanel}>
          <div className="card">
            <div style={styles.hubspotHeader}>
              <span style={styles.hubspotLogo}>🟠</span>
              <h3 style={styles.hubspotTitle}>HubSpot CRM</h3>
            </div>

            {!user?.integrations?.hubspot ? (
              <div style={styles.hsNote}>
                <p style={{ fontSize: 12, color: '#8b92a5', lineHeight: 1.6 }}>
                  Connect HubSpot on the Integrations page to see CRM info for this contact.
                </p>
              </div>
            ) : hsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <div className="spinner" />
              </div>
            ) : hsError === 'not_found' ? (
              <div style={styles.hsNote}>
                <div style={styles.hsNotFound}>Contact not found</div>
                <p style={{ fontSize: 12, color: '#555c6e', marginTop: 6 }}>
                  No HubSpot contact matches<br />
                  <code style={{ fontSize: 11, color: '#f59e0b' }}>{ticket.requester?.email}</code>
                </p>
              </div>
            ) : hsError === 'error' ? (
              <div style={styles.hsNote}>
                <p style={{ fontSize: 12, color: '#ef4444' }}>Failed to fetch contact.</p>
              </div>
            ) : hubspotContact ? (
              <div style={styles.contactCard}>
                <div style={styles.contactAvatar}>
                  {hubspotContact.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={styles.contactName}>{hubspotContact.name}</div>
                <div style={styles.contactEmail}>{hubspotContact.email}</div>
                <hr className="divider" />
                <div style={styles.contactProps}>
                  <ContactProp label="Lifecycle Stage" value={hubspotContact.lifecycleStage} />
                  <ContactProp label="Phone" value={hubspotContact.phone} />
                  <ContactProp label="Company" value={hubspotContact.company} />
                  <ContactProp label="Job Title" value={hubspotContact.jobTitle} />
                  <ContactProp label="Lead Status" value={hubspotContact.leadStatus} />
                </div>
                <div style={styles.contactDates}>
                  <div style={styles.contactDateRow}>
                    <span style={styles.contactDateLabel}>Created</span>
                    <span style={styles.contactDateVal}>
                      {hubspotContact.createdAt ? new Date(hubspotContact.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div style={styles.contactDateRow}>
                    <span style={styles.contactDateLabel}>Updated</span>
                    <span style={styles.contactDateVal}>
                      {hubspotContact.updatedAt ? new Date(hubspotContact.updatedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationItem({ conv, formatDate }) {
  const isPrivate = conv.private;
  return (
    <div style={{ ...styles.convItem, ...(isPrivate ? styles.convPrivate : {}) }}>
      <div style={styles.convHeader}>
        <div style={styles.convAvatar}>
          {conv.from_email?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={styles.convMeta}>
          <span style={styles.convFrom}>{conv.from_email || 'Agent'}</span>
          {isPrivate && <span style={styles.privateTag}>Private Note</span>}
        </div>
        <span style={styles.convTime}>{formatDate(conv.created_at)}</span>
      </div>
      <div
        style={styles.convBody}
        dangerouslySetInnerHTML={{ __html: conv.body || conv.body_text || '' }}
      />
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div style={styles.metaItem}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  );
}

function ContactProp({ label, value }) {
  if (!value) return null;
  return (
    <div style={styles.contactProp}>
      <span style={styles.propLabel}>{label}</span>
      <span style={styles.propValue}>{value}</span>
    </div>
  );
}

const styles = {
  page: { padding: '32px 40px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' },
  main: { display: 'flex', flexDirection: 'column' },
  ticketMeta: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  ticketId: { fontSize: 12, color: '#555c6e', fontFamily: 'monospace' },
  subject: { fontFamily: 'DM Serif Display', fontSize: 24, color: '#f0f2f7', marginBottom: 16, lineHeight: 1.3 },
  metaRow: { display: 'flex', gap: 24, flexWrap: 'wrap' },
  metaItem: { display: 'flex', flexDirection: 'column', gap: 2 },
  metaLabel: { fontSize: 10, color: '#555c6e', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  metaValue: { fontSize: 13, color: '#f0f2f7' },
  sectionTitle: { fontSize: 14, fontWeight: 600, color: '#f0f2f7', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 },
  count: { background: '#22262f', color: '#8b92a5', fontSize: 11, padding: '2px 7px', borderRadius: 99, fontWeight: 400 },
  description: { fontSize: 13, color: '#8b92a5', lineHeight: 1.7 },
  convList: { display: 'flex', flexDirection: 'column', gap: 16 },
  convItem: { border: '1px solid #2a2e38', borderRadius: 10, padding: 16 },
  convPrivate: { borderColor: '#f59e0b33', background: '#f59e0b05' },
  convHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 },
  convAvatar: { width: 28, height: 28, borderRadius: '50%', background: '#22262f', color: '#8b92a5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0 },
  convMeta: { flex: 1, display: 'flex', alignItems: 'center', gap: 8 },
  convFrom: { fontSize: 12, fontWeight: 500, color: '#f0f2f7' },
  convTime: { fontSize: 11, color: '#555c6e' },
  privateTag: { fontSize: 10, background: '#f59e0b22', color: '#f59e0b', padding: '2px 6px', borderRadius: 4, fontWeight: 600 },
  convBody: { fontSize: 13, color: '#8b92a5', lineHeight: 1.7 },
  sidepanel: {},
  hubspotHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
  hubspotLogo: { fontSize: 16 },
  hubspotTitle: { fontSize: 14, fontWeight: 600, color: '#f0f2f7' },
  hsNote: { padding: '8px 0' },
  hsNotFound: { fontSize: 13, fontWeight: 500, color: '#555c6e' },
  contactCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 8 },
  contactAvatar: { width: 52, height: 52, borderRadius: '50%', background: '#ff7a5922', color: '#ff7a59', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, marginBottom: 12 },
  contactName: { fontSize: 15, fontWeight: 600, color: '#f0f2f7', marginBottom: 4 },
  contactEmail: { fontSize: 11, color: '#8b92a5', marginBottom: 4 },
  contactProps: { width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 10 },
  contactProp: { display: 'flex', flexDirection: 'column', gap: 2 },
  propLabel: { fontSize: 10, color: '#555c6e', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  propValue: { fontSize: 12, color: '#f0f2f7', textTransform: 'capitalize' },
  contactDates: { width: '100%', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 },
  contactDateRow: { display: 'flex', justifyContent: 'space-between' },
  contactDateLabel: { fontSize: 11, color: '#555c6e' },
  contactDateVal: { fontSize: 11, color: '#8b92a5' },
  errorBox: { background: '#ef444418', border: '1px solid #ef4444', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#ef4444', marginBottom: 16 },
};