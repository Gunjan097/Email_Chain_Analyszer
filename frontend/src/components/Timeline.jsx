import React from 'react';

export default function Timeline({ chain }) {
  if (!chain || chain.length === 0) {
    return <div className="muted">No received headers found.</div>;
  }
  return (
    <ol className="timeline">
      {chain.map((hop, i) => (
        <li key={i} className="timeline-item">
          <div className="dot" />
          <div className="hop">
            <div className="hop-server">{hop}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
