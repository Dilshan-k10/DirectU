import React from 'react';
import './ApplicantProfile.css';
import ProfileHeader from './ProfileHeader';
import ContactInfo from './ContactInfo';
import StatusBadge from './StatusBadge';

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

        {/* Modal Body - Three Column Layout */}
        <div className="modal-body">
          {/* Left Column - Profile Card */}
          <div className="modal-col modal-col-left">
            <ProfileHeader name="Alexander Thorne" />
            <ContactInfo email="a.thorne@email.com" phone="+1 555 1234 567" />
            <StatusBadge status="UNDER REVIEW" />
          </div>

          {/* Center Column - Details & AI Analysis */}
          <div className="modal-col modal-col-center">
            <p className="placeholder-text">AI Analysis</p>
          </div>

          {/* Right Column - Documents */}
          <div className="modal-col modal-col-right">
            <p className="placeholder-text">Documents</p>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="modal-actions">
          <button className="btn-update-status" id="btn-update-status">
            <span className="btn-icon">↻</span>
            Update Status
          </button>
          <button className="btn-save" id="btn-save">
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantProfileModal;
