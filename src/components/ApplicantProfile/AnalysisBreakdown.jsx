import React from 'react';

const AnalysisBreakdown = ({ academic, experience, potential }) => {
  const categories = [
    { label: 'Academic', score: academic, color: '#f0ab39' },
    { label: 'Experience', score: experience, color: '#ec4899' },
    { label: 'Potential', score: potential, color: '#7c3aed' },
  ];

  return (
    <div className="analysis-breakdown">
      {categories.map((cat, idx) => (
        <div className="breakdown-item" key={idx}>
          <div className="breakdown-label-group">
            <span className="dot" style={{ backgroundColor: cat.color }}></span>
            <span className="category-name">{cat.label}:</span>
          </div>
          <span className="category-score">{cat.score}%</span>
        </div>
      ))}
    </div>
  );
};

export default AnalysisBreakdown;
