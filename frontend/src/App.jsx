import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Timeline from './components/Timeline';

function ESPBadge({ esp }) {
  const colors = {
    'Gmail / Google': '#DB4437',
    'Outlook / Microsoft 365': '#0078D4',
    'Amazon SES': '#FF9900',
    'SendGrid': '#00C7FF',
    'Mailgun': '#FF6F61',
    'Mailchimp': '#FFE01B',
    'Unknown': '#6B7280',
  };
  const color = colors[esp] || '#6B7280';
  return (
    <span style={{
      background: color,
      color: '#fff',
      padding: '4px 8px',
      borderRadius: 12,
      fontSize: 12,
      display: 'inline-block'
    }}>{esp}</span>
  );
}

export default function App() {
  const [config, setConfig] = useState({});
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchConfig = async () => {
    const res = await axios.get('/api/emails/test-config');
    setConfig(res.data);
  };

  const fetchEmails = async () => {
    setLoading(true);
    const res = await axios.get('/api/emails?limit=30');
    setEmails(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchConfig();
    fetchEmails();
    const t = setInterval(fetchEmails, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="page">
      <header className="header">
        <h1>Email Receiving Chain Analyzer</h1>
        <p className="muted">Send a test email to this address with the subject shown below.</p>
      </header>

      <section className="card">
        <h3>Test mailbox</h3>
        <div><strong>Address:</strong> {config.testAddress}</div>
        <div><strong>Subject to use:</strong> {config.subject || '(any subject if blank)'}</div>
      </section>

      <section className="card">
        <h3>Processed emails</h3>
        {loading && <div>Loading…</div>}
        <div className="emails-list">
          {emails.length === 0 && <div>No processed emails yet.</div>}
          {emails.map(e => (
            <div className="email-card" key={e._id}>
              <div className="email-top">
                <div>
                  <div className="subject">{e.subject}</div>
                  <div className="meta">{e.from} • {new Date(e.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <ESPBadge esp={e.esp || 'Unknown'} />
                </div>
              </div>

              <div className="chain">
                <Timeline chain={e.receivingChain || []} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
