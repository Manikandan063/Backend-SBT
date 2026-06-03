import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const sendOnboardingEmail = async (
  parent,
  student,
  schoolName,
  rawPassword
) => {
  try {
    if (!parent.email) {
      console.log('[EMAIL] Parent email is missing. Skipping email dispatch.');
      return false;
    }

    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      console.log('[EMAIL] SMTP credentials missing');
      return false;
    }

    const baseUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: process.env.MAIL_PORT || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${schoolName} Admin" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
      to: parent.email,
      subject: `🎒 Welcome to ${schoolName} - School Bus Tracking Login Details`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width:600px; margin:auto; padding:30px;">
          <h2 style="color:#1e3a8a;">Welcome to ${schoolName}</h2>

          <p>Hello <strong>${parent.parentName}</strong>,</p>

          <p>
            Your child <strong>${student.studentName}</strong>
            has been registered successfully in School Bus Tracking.
          </p>

          <div style="background:#f5f5f5; padding:20px; border-radius:10px; margin:20px 0;">
            <p><strong>Parent Mobile:</strong> ${parent.mobileNumber}</p>
            <p><strong>Password:</strong> ${rawPassword}</p>
          </div>

          <p>Open Parent Dashboard:</p>

          <a href="${baseUrl}/login"
             style="display:inline-block; background:#2563eb; color:#fff; padding:12px 20px; text-decoration:none; border-radius:8px;">
            Login Now
          </a>

          ${process.env.APK_DOWNLOAD_URL ? `
          <div style="margin-top:20px;">
            <p>Download Parent App:</p>
            <a href="${process.env.APK_DOWNLOAD_URL}"
               style="display:inline-block; background:#16a34a; color:#fff; padding:12px 20px; text-decoration:none; border-radius:8px; margin-top:12px;">
              📲 Download Parent App
            </a>
          </div>
          ` : ''}

          <p style="margin-top:30px;">
            Thanks,<br/>
            ${schoolName} Admin
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Nodemailer email sent:', info.messageId);

    return true;
  } catch (error) {
    console.error('[EMAIL] Nodemailer failed:', error.message);
    return false;
  }
};

export default {
  sendOnboardingEmail,
};