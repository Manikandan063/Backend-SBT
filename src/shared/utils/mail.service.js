import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Mail Service
 * Handles sending automated emails for student/parent onboarding.
 */

// Create a transporter using environment variables
const getTransporter = () => {
  const config = {
    host: process.env.MAIL_HOST || 'smtp.ethereal.email',
    port: process.env.MAIL_PORT || 587,
    secure: process.env.MAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.MAIL_USER || 'ethereal.user',
      pass: process.env.MAIL_PASS || 'ethereal.pass',
    },
  };

  // If using Gmail, it's better to use the service shortcut
  if (process.env.MAIL_HOST?.includes('gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: config.auth
    });
  }

  return nodemailer.createTransport(config);
};

const transporter = getTransporter();

export const sendOnboardingEmail = async (parent, student, schoolName, rawPassword) => {
  const mailOptions = {
    from: `"${schoolName} Admin" <${process.env.MAIL_FROM || 'admin@schoolbus.app'}>`,
    to: parent.email,
    subject: `🎒 Welcome to ${schoolName} - School Bus Tracking Login Details`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #333;">
        ${(() => {
          const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
          return `
        <h1 style="color: #88B04B; font-size: 24px; font-weight: 800; line-height: 1.3; text-transform: uppercase; margin-bottom: 25px;">
          WELCOME TO ${schoolName}
        </h1>
        
        <p style="font-size: 16px; margin-bottom: 15px;">Hello <strong>${parent.parentName}</strong>,</p>
        
        <p style="font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
          Your child, <strong>${student.studentName}</strong>, has been successfully registered for the School Bus Tracking system.
        </p>
        
        <div style="background-color: #F8F9FA; border-radius: 16px; padding: 30px; margin-bottom: 30px;">
          <h3 style="color: #666; font-size: 14px; font-weight: 800; text-transform: uppercase; margin-top: 0; margin-bottom: 20px; letter-spacing: 0.5px;">
            LOGIN CREDENTIALS
          </h3>
          
          <p style="font-size: 16px; margin: 10px 0;">
            <strong style="width: 80px; display: inline-block;">Mobile:</strong> ${parent.mobileNumber}
          </p>
          <p style="font-size: 16px; margin: 10px 0;">
            <strong style="width: 80px; display: inline-block;">Password:</strong> 
            <span style="background: #E9ECEF; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${rawPassword}</span>
          </p>
        </div>

        <p style="font-size: 16px; margin-bottom: 30px;">
          You can now track your child's journey in real-time through our Parent PWA.
        </p>
        
        <div style="display: flex; gap: 15px; margin-bottom: 40px;">
          <a href="${baseUrl}/login" style="display: inline-block; background-color: #88B04B; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
            Login to Dashboard
          </a>
          <a href="${baseUrl}/download" style="display: inline-block; background-color: #262626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px;">
            Download App
          </a>
        </div>
        `;
        })()}
        
        <hr style="border: 0; border-top: 1px solid #EEE; margin-bottom: 20px;">
        <p style="font-size: 12px; color: #999; line-height: 1.5;">
          If you didn't expect this email, please contact the school administration immediately.
        </p>
      </div>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #999;">If you didn't expect this email, please contact the school administration immediately.</p>
      </div>
    `,
  };

  try {
    // If not configured, just log it
    if (!process.env.MAIL_USER || process.env.MAIL_USER === 'ethereal.user') {
      console.log('\n--- [EMAIL SIMULATION] ---');
      console.log(`To: ${parent.email}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Content: Credentials sent for student ${student.studentName}`);
      console.log('--------------------------\n');
      return true;
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};
