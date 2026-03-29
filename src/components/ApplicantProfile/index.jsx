import React from 'react';
import './ApplicantProfile.css';

/**
 * ApplicantProfileModal - Main modal component for viewing applicant details
 * Displays comprehensive profile info including AI analysis and documents
 */
const ApplicantProfileModal = ({ onClose }) => {
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="applicant-modal-overlay" onClick={handleOverlayClick}>
      <div className="applicant-modal-container">
        {/* Modal Header */}
        <div className="modal-header">
          <h1 className="modal-title">
            Applicant Profile: <span className="modal-title-name">Alexander Thorne</span>
          </h1>
          <button
            className="modal-close-btn"
            onClick={() => onClose?.()}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfileModal;
