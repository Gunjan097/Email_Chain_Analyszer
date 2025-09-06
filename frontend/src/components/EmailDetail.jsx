// frontend/src/components/EmailDetail.jsx
import React from 'react';

function ESPIcon({ esp, size = 18 }) {
  // Minimal inline icons (SVG) for a few providers
  const common = { width: size, height: size, style: { verticalAlign: 'middle', marginRight: 8 } };
  if (!esp) return null;
  if (esp.includes('Gmail')) {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 6.5v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-11" stroke="#DB4437" strokeWidth="1.5"/>
        <path d="M22 6 12 13 2 6" stroke="#0F9D58" strokeWidth="1.5"/>
      </svg>
    );
  }
  if (esp.includes('Amazon SES') || esp.toLowerCase().includes('amazon')) {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="none">
        <path d="M3 12c3-3 6-5 9-5s6 2 9 5" stroke="#FF9900" strokeWidth="1.6"/>
      </svg>
    );
  }
  if (esp.includes('Cloudinary')) {
    return (
      <svg {...common} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="#6B7280" strokeWidth="1.6"/>
      </svg>
    );
  }
  return (
    <svg {...common} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6B7280" strokeWidth="1.2" />
    </svg>
  );
}

export default function EmailDetail({ email, onClose }) {
  if (!email) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-header">
          <ESPIcon esp={email.esp} size={22} />
          <div>
            <h2 style={{margin:0}}>{email.subject}</h2>
            <div className="muted">{email.from} • {new Date(email.date).toLocaleString()}</div>
          </div>
        </div>

        <div className="modal-body">
          <h4>Receiving Chain</h4>
          {(!email.receivingChain || email.receivingChain.length === 0) && (
            <div className="muted">No Received headers found.</div>
          )}
          <ol className="timeline">
            {(email.receivingChain || []).map((hop, idx) => (
              <li key={idx} className="timeline-item">
                <div className="dot" />
                <div className="hop">
                  <div className="hop-server">{hop}</div>
                </div>
              </li>
            ))}
          </ol>

          <h4>Raw body / text</h4>
          <pre style={{whiteSpace:'pre-wrap', maxHeight:220, overflow:'auto', background:'#fbfcfe', padding:12, borderRadius:6}}>{email.text || '(no text)'}</pre>

          <h4>Full JSON</h4>
          <pre style={{whiteSpace:'pre-wrap', maxHeight:220, overflow:'auto', background:'#f7f7f8', padding:12, borderRadius:6}}>
            {JSON.stringify(email, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
