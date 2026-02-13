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

// ===== FUNCTION 1: Send Verification Code (Reset Password) =====
async function sendVerificationCode(recipientEmail, data) {
  const { ucpName, verificationCode } = data;

  const mailOptions = {
    from: {
      name: 'Valencia Roleplay',
      address: config.email.user
    },
    to: recipientEmail,
    subject: 'Verifikasi Reset Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background-color: #ffffff;">
                    <div style="width: 56px; height: 56px; margin: 0 auto 20px; background-color: #8B5CF6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 28px;">🔐</span>
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Reset Password</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #737373;">Kode verifikasi untuk ${ucpName}</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #525252;">
                      Masukkan kode berikut untuk melanjutkan reset password:
                    </p>

                    <!-- Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background-color: #f9fafb; border: 2px dashed #e5e5e5; border-radius: 8px; padding: 24px; text-align: center;">
                          <div style="font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #1a1a1a; font-family: 'Courier New', monospace;">
                            ${verificationCode}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 24px 0 0; font-size: 14px; line-height: 1.6; color: #737373; text-align: center;">
                      Kode berlaku selama <strong style="color: #1a1a1a;">5 menit</strong>
                    </p>

                    <!-- Warning -->
                    <div style="margin-top: 32px; padding: 16px; background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px;">
                      <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                        <strong>⚠️ Jangan bagikan kode ini!</strong><br>
                        Jika bukan Anda yang melakukan request, abaikan email ini.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                      © ${new Date().getFullYear()} Valencia Roleplay. All rights reserved.
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
Reset Password - Valencia Roleplay

Kode Verifikasi: ${verificationCode}

Halo ${ucpName},
Gunakan kode di atas untuk reset password Anda.
Kode berlaku selama 5 menit.

Jangan bagikan kode ini kepada siapapun!

© ${new Date().getFullYear()} Valencia Roleplay
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

// ===== FUNCTION 2: Send Registration Welcome Email =====
async function sendRegistrationEmail(recipientEmail, data) {
  const { ucpName, verifycode } = data;

  const mailOptions = {
    from: {
      name: 'Valencia Roleplay',
      address: config.email.user
    },
    to: recipientEmail,
    subject: '🎉 Selamat Datang di Valencia Roleplay!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background-color: #ffffff;">
                    <div style="width: 56px; height: 56px; margin: 0 auto 20px; background-color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 28px;">🎉</span>
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Selamat Datang!</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #737373;">Registrasi berhasil di Valencia Roleplay</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #525252;">
                      Selamat <strong>${ucpName}</strong>! Akun UCP Anda telah berhasil dibuat. Berikut informasi login Anda:
                    </p>
                    
                    <!-- Account Info Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e5e5e5;">
                          <p style="margin: 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Username</p>
                          <p style="margin: 6px 0 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">${ucpName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">PIN Code</p>
                          <p style="margin: 6px 0 0; font-size: 20px; font-weight: 700; color: #1a1a1a; font-family: 'Courier New', monospace; letter-spacing: 2px;">${verifycode}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Next Steps -->
                    <div style="background-color: #f0fdf4; border-left: 3px solid #10b981; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
                      <p style="margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #065f46;">Langkah Selanjutnya:</p>
                      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #065f46; line-height: 1.6;">
                        <li>Login ke UCP menggunakan username dan PIN di atas</li>
                        <li>Buat karakter pertama Anda</li>
                        <li>Mulai petualangan di Valencia Roleplay!</li>
                      </ul>
                    </div>

                    <!-- Security Notice -->
                    <div style="padding: 16px; background-color: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 6px;">
                      <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.5;">
                        <strong>🔒 Keamanan Akun</strong><br>
                        Jangan bagikan PIN Anda kepada siapapun, termasuk staff server!
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                      © ${new Date().getFullYear()} Valencia Roleplay. All rights reserved.
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
🎉 Selamat Datang di Valencia Roleplay!

Halo ${ucpName}!
Akun UCP Anda telah berhasil dibuat.

═══════════════════════════
INFORMASI LOGIN
═══════════════════════════
Username: ${ucpName}
PIN Code: ${verifycode}

Langkah Selanjutnya:
- Login ke UCP
- Buat karakter pertama
- Mulai bermain!

🔒 Jangan bagikan PIN kepada siapapun!

© ${new Date().getFullYear()} Valencia Roleplay
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Registration email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending registration email:', error);
    return { success: false, error: error.message };
  }
}

// ===== FUNCTION 3: Send Account Info (untuk /myaccount) =====
async function sendAccountInfo(recipientEmail, accountData) {
  const { ucpName, verifycode, characters } = accountData;
  
  const charList = characters.length > 0
    ? characters.map((char, index) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
            <span style="color: #525252; font-size: 14px;">${char}</span>
          </td>
        </tr>
      `).join('')
    : '<tr><td style="padding: 12px; color: #a3a3a3; font-size: 14px;">Tidak ada karakter</td></tr>';

  const mailOptions = {
    from: {
      name: 'Valencia Roleplay',
      address: config.email.user
    },
    to: recipientEmail,
    subject: 'Informasi Akun UCP',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background-color: #ffffff;">
                    <div style="width: 56px; height: 56px; margin: 0 auto 20px; background-color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 28px;">👤</span>
                    </div>
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a;">Informasi Akun</h1>
                    <p style="margin: 8px 0 0; font-size: 14px; color: #737373;">Detail akun UCP Anda</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 0 40px 40px;">
                    
                    <!-- Account Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px; overflow: hidden;">
                      <tr>
                        <td style="padding: 16px 20px; border-bottom: 1px solid #e5e5e5;">
                          <p style="margin: 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Username</p>
                          <p style="margin: 6px 0 0; font-size: 16px; font-weight: 600; color: #1a1a1a;">${ucpName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">PIN</p>
                          <p style="margin: 6px 0 0; font-size: 20px; font-weight: 700; color: #1a1a1a; font-family: 'Courier New', monospace; letter-spacing: 2px;">${verifycode}</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Characters -->
                    <div style="margin-top: 32px;">
                      <p style="margin: 0 0 12px; font-size: 12px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px;">Karakter Anda</p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafafa; border-radius: 8px; overflow: hidden;">
                        ${charList}
                      </table>
                    </div>

                    <!-- Security Notice -->
                    <div style="margin-top: 32px; padding: 16px; background-color: #dbeafe; border-left: 3px solid #3b82f6; border-radius: 6px;">
                      <p style="margin: 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
                        <strong>🔒 Keamanan Akun</strong><br>
                        Jangan bagikan informasi ini kepada siapapun, termasuk staff server.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px; background-color: #fafafa; border-top: 1px solid #f0f0f0; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #a3a3a3;">
                      © ${new Date().getFullYear()} Valencia Roleplay. All rights reserved.
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
Informasi Akun UCP - Valencia Roleplay

Username: ${ucpName}
PIN: ${verifycode}

Karakter:
${characters.length > 0 ? characters.map((char, i) => `${i + 1}. ${char}`).join('\n') : 'Tidak ada karakter'}

🔒 Jangan bagikan informasi ini kepada siapapun!

© ${new Date().getFullYear()} Valencia Roleplay
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
  sendRegistrationEmail,
  sendAccountInfo
};