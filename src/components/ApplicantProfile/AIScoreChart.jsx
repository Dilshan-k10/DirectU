import React from 'react';

const AIScoreChart = ({ score = 92 }) => {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="ai-score-chart">
      <h3 className="section-title">AI Analysis Score</h3>
      <div className="chart-container">
        <svg className="circular-progress" width="120" height="120">
          <circle
            className="background-circle"
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            className="progress-circle"
            cx="60"
            cy="60"
            r={radius}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
          <text className="score-text" x="50%" y="50%" dominantBaseline="middle" textAnchor="middle">
            {score}%
          </text>
        </svg>
      </div>
    </div>
  );
};

export default AIScoreChart;
