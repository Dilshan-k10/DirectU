import React from 'react';
import './ApplicantProfile.css';
import ProfileHeader from './ProfileHeader';
import ContactInfo from './ContactInfo';
import StatusBadge from './StatusBadge';
import HistoryDetails from './HistoryDetails';
import AIScoreChart from './AIScoreChart';
import AnalysisBreakdown from './AnalysisBreakdown';
import SystemFlags from './SystemFlags';
import DocumentList from './DocumentList';

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
            <HistoryDetails
              degree="Bachelor of Science in Computer Science"
              university="University of Tech"
              gpa="3.8/4.0"
            />
            <div className="center-flex-group">
              <AIScoreChart score={92} />
              <AnalysisBreakdown
                academic={95}
                experience={88}
                potential={94}
              />
            </div>
            <SystemFlags />
          </div>

          {/* Right Column - Documents */}
          <div className="modal-col modal-col-right">
            <DocumentList
              documents={[
                { name: 'CV.pdf', size: 35.3, type: 'pdf' },
                { name: 'Transcript.pdf', size: 33.7, type: 'pdf' },
                { name: 'Statement.pdf', size: 32.2, type: 'pdf' },
                { name: 'Certificates.zip', size: 33.7, type: 'zip' },
              ]}
            />
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
