import React from 'react';

/**
 * StatusBadge - Displays the applicant's current review status
 * Styled with golden border/text to match the design
 */
const StatusBadge = ({ status = 'UNDER REVIEW' }) => {
  // Map status to style variant
  const getStatusClass = (statusText) => {
    switch (statusText.toUpperCase()) {
      case 'UNDER REVIEW':
        return 'status-under-review';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'status-under-review';
    }
  };

  return (
    <div className={`status-badge ${getStatusClass(status)}`}>
      <span className="status-badge-icon">📋</span>
      <span className="status-badge-text">{status}</span>
    </div>
  );
};

export default StatusBadge;
