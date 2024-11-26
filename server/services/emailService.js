const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Verification Code',
    html: `
      <h1>Password Reset Request</h1>
      <p>Your verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>`
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendDocumentNotification = async (orgEmail, documents, organization) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: orgEmail,
    subject: 'New Documents Received',
    html: `
      <h2>New Documents Received</h2>
      <p>The following documents have been received for ${organization}:</p>
      <ul>
        ${documents.map(doc => `
          <li>
            Document: ${doc.documentName}<br>
            Serial Number: ${doc.serialNumber}<br>
            From: ${doc.originalSender}
          </li>
        `).join('')}
      </ul>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

module.exports = { 
  sendVerificationCode,
  sendDocumentNotification 
}; 