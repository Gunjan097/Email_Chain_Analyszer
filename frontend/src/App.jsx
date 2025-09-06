import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Timeline from './components/Timeline';
import EmailDetail from './components/EmailDetail';

function ESPBadge({ esp }) {
  const colors = {
    'Gmail / Google': '#DB4437',
    'Outlook / Microsoft 365': '#0078D4',
    'Amazon SES': '#FF9900',
    'SendGrid': '#00C7FF',
    'Mailgun': '#FF6F61',
    'Mailchimp': '#FFE01B',
    'Cloudinary': '#6B7280',
    'Quora': '#E01E5A',
    'Unknown': '#6B7280',
  };
  const color = colors[esp] || '#6B7280';
  return (
    <span style={{
      background: color,
      color: '#fff',
      padding: '6px 10px',
      borderRadius: 14,
      fontSize: 12,
      display: 'inline-block',
      minWidth: 90,
      textAlign: 'center'
    }}>{esp}</span>
  );
}

export default function App() {
  const [config, setConfig] = useState({});
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [espFilter, setEspFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/emails/test-config');
      setConfig(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmails = async (p = 1, esp = '') => {
    setLoading(true);
    try {
      const url = `/api/emails?limit=${limit}&page=${p}${esp ? `&esp=${encodeURIComponent(esp)}` : ''}`;
      const res = await axios.get(url);
      setEmails(res.data.items || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchEmails(1, '');
    const id = setInterval(() => fetchEmails(page, espFilter), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, []);

  const onFilterChange = (e) => {
    setEspFilter(e.target.value);
  };

  const applyFilter = () => {
    fetchEmails(1, espFilter);
  };

  const loadMore = () => {
    fetchEmails(page + 1, espFilter);
  };

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

        <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center' }}>
          <input placeholder="Filter by ESP (e.g. Gmail / Google)" value={espFilter} onChange={onFilterChange} style={{padding:8,flex:1}} />
          <button onClick={applyFilter} style={{padding:'8px 12px'}}>Filter</button>
        </div>

        {loading && <div>Loading…</div>}

        <div className="emails-list">
          {emails.length === 0 && !loading && <div>No processed emails yet.</div>}
          {emails.map(e => (
            <div className="email-card" key={e._id} onClick={() => setSelected(e)} style={{cursor:'pointer'}}>
              <div className="email-top">
                <div>
                  <div className="subject">{e.subject}</div>
                  <div className="meta">{e.from} • {new Date(e.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <ESPBadge esp={e.esp || 'Unknown'} />
                </div>
              </div>

              <div className="chain" style={{paddingTop:8}}>
                <Timeline chain={e.receivingChain || []} />
              </div>
            </div>
          ))}
        </div>

        {total > emails.length && (
          <div style={{textAlign:'center', marginTop:12}}>
            <button onClick={loadMore} style={{padding:'8px 12px'}}>Load more</button>
          </div>
        )}
      </section>

      {selected && <EmailDetail email={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
