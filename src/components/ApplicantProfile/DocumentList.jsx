import React from 'react';

const DocumentItem = ({ name, size, type }) => {
  const getIcon = (fileName) => {
    if (fileName.includes('.pdf')) return '📄';
    if (fileName.includes('.zip')) return '📦';
    return '📝';
  };

  return (
    <div className="document-item">
      <div className="doc-info-group">
        <span className="doc-icon">{getIcon(name)}</span>
        <div className="doc-meta">
          <span className="doc-name">{name}</span>
          <span className="doc-size">{size} KB</span>
        </div>
      </div>
      <div className="doc-actions">
        <button className="doc-btn view-btn" title="View Document">👁️</button>
        <button className="doc-btn download-btn" title="Download Document">📥</button>
      </div>
    </div>
  );
};

const DocumentList = ({ documents }) => {
  return (
    <div className="document-list-section">
      <h3 className="section-title">Uploaded Documents</h3>
      <div className="docs-container">
        {documents.map((doc, idx) => (
          <DocumentItem key={idx} {...doc} />
        ))}
      </div>
    </div>
  );
};

export default DocumentList;
