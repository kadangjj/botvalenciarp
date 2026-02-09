const nodemailer = require('nodemailer');
const config = require('../config.json');

const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email Server Error:', error);
  } else {
    console.log('✅ Email Server Ready');
  }
});

// ===== FUNCTION 1: Send Verification Code =====
async function sendVerificationCode(recipientEmail, data) {
  const { ucpName, verificationCode } = data;

  const mailOptions = {
    from: {
      name: 'Valencia UCP reset password',
      address: config.email.user
    },
    to: recipientEmail,
    subject: 'Kode Verifikasi - Change Password',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px;">
                
                <tr>
                  <td style="background: linear-gradient(135deg, #4715A3 0%, #6B21A8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Kode Verifikasi</h1>
                    <p style="color: #e0e0e0; margin: 10px 0 0 0;">Change Password Request</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="color: #333; font-size: 16px;">Halo <strong>${ucpName}</strong>,</p>
                    <p style="color: #666; font-size: 14px;">Gunakan kode verifikasi berikut untuk mengubah password:</p>

                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin: 30px 0;">
                      <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0;">KODE VERIFIKASI</p>
                      <p style="color: #ffffff; font-size: 42px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: monospace;">
                        ${verificationCode}
                      </p>
                    </div>

                    <p style="color: #666; font-size: 14px;">
                      Kode berlaku selama <strong style="color: #4715A3;">5 menit</strong>. Jangan bagikan kode ini!
                    </p>

                    <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin-top: 25px;">
                      <p style="margin: 0; color: #856404; font-size: 13px; text-align: center;">
                        <strong>⚠️ PERHATIAN:</strong> Jika Anda tidak melakukan request ini, abaikan email ini.
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Valencia UCP System
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Kode Verifikasi: ${verificationCode}

Halo ${ucpName}, gunakan kode di atas untuk mengubah password.
Kode berlaku selama 5 menit.

© ${new Date().getFullYear()} UCP System
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification code sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending verification code:', error);
    return { success: false, error: error.message };
  }
}

// ===== FUNCTION 2: Send Account Info =====
async function sendAccountInfo(recipientEmail, accountData) {
  const { ucpName, verifycode, characters } = accountData;
  
  const charList = characters.length > 0
    ? characters.map((char, index) => `${index + 1}. ${char}`).join('\n')
    : 'Tidak ada karakter.';

  const mailOptions = {
    from: {
      name: 'UCP System',
      address: config.email.user
    },
    to: recipientEmail,
    subject: '🔐 Informasi Akun UCP Anda',
    html: `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
        <h2>Informasi Akun UCP</h2>
        <p><strong>UCP:</strong> ${ucpName}</p>
        <p><strong>PIN:</strong> ${verifycode}</p>
        <p><strong>Karakter:</strong></p>
        <pre>${charList}</pre>
      </body>
      </html>
    `,
    text: `
UCP: ${ucpName}
PIN: ${verifycode}
Karakter: ${charList}
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Account info sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending account info:', error);
    return { success: false, error: error.message };
  }
}

// ===== EXPORT SEMUA FUNCTION =====
module.exports = {
  sendVerificationCode,
  sendAccountInfo
};