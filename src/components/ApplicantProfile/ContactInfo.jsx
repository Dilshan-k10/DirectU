import React from 'react';

/**
 * ContactInfo - Displays applicant's email and phone contact details
 */
const ContactInfo = ({
  email = 'a.thorne@email.com',
  phone = '+1 555 1234 567',
}) => {
  return (
    <div className="contact-info">
      {/* Email Row */}
      <div className="contact-row">
        <span className="contact-label">Email</span>
        <span className="contact-value">{email}</span>
      </div>

      {/* Phone Row */}
      <div className="contact-row">
        <span className="contact-label">Phone</span>
        <div className="contact-phone-row">
          <span className="contact-value">{phone}</span>
          <span className="contact-phone-icon" title="Call">📞</span>
        </div>
      </div>
    </div>
  );
};

export default ContactInfo;
