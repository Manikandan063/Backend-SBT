import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export const sendOnboardingEmail = async (
  parent,
  student,
  schoolName,
  rawPassword
) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      console.log('[EMAIL] BREVO_API_KEY missing');
      return false;
    }

    if (!process.env.MAIL_FROM) {
      console.log('[EMAIL] MAIL_FROM missing');
      return false;
    }

    const baseUrl = (
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ).replace(/\/$/, '');

    const payload = {
      sender: {
        name: `${schoolName} Admin`,
        email: process.env.MAIL_FROM,
      },
      to: [
        {
          email: parent.email,
          name: parent.parentName,
        },
      ],
      subject: `🎒 Welcome to ${schoolName} - School Bus Tracking Login Details`,
      htmlContent: `
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

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      payload,
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
        },
      }
    );

    console.log('[EMAIL] Brevo API email sent:', response.data);

    return true;
  } catch (error) {
    console.error('[EMAIL] Brevo API failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return false;
  }
};

export default {
  sendOnboardingEmail,
};