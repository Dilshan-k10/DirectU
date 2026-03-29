import React from 'react';

const SystemFlags = () => {
  const flags = [
    { label: 'Document Verified', status: 'verified', icon: '✅' },
    { label: 'English Proficiency Met', status: 'verified', icon: '✅' },
    { label: 'Reference Check Pending', status: 'pending', icon: '⚠️' },
  ];

  return (
    <div className="system-flags-section">
      <h3 className="section-title">System Flags</h3>
      <div className="flags-list">
        {flags.map((flag, idx) => (
          <div className={`flag-item ${flag.status}`} key={idx}>
            <span className="flag-icon">{flag.icon}</span>
            <span className="flag-label">{flag.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemFlags;
