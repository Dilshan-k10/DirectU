import React from 'react';

const HistoryDetails = ({ degree, university, gpa }) => {
  return (
    <div className="history-details-section">
      <h3 className="section-title">Details Analyzed History</h3>
      <div className="history-content">
        <p className="history-degree">{degree}</p>
        <p className="history-university">{university}</p>
        <p className="history-gpa">GPA <span className="gpa-value">{gpa}</span></p>
      </div>
    </div>
  );
};

export default HistoryDetails;
