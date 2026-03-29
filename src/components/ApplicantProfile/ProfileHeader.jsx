import React from 'react';

/**
 * ProfileHeader - Displays the applicant's avatar and name
 * Located at the top of the left profile panel
 */
const ProfileHeader = ({ name = 'Alexander Thorne' }) => {
  // Get initials for the avatar fallback
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="profile-header">
      <div className="profile-avatar">
        <div className="profile-avatar-inner">
          <span className="profile-avatar-initials">{initials}</span>
        </div>
      </div>
      <h2 className="profile-name">{name}</h2>
    </div>
  );
};

export default ProfileHeader;
