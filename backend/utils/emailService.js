const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Send OTP email
  async sendOTPEmail(email, otp, username) {
    const mailOptions = {
      from: `"DevLink" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - DevLink",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">DevLink</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Developer Social Platform</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Hi ${username || "there"},
            </p>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your DevLink account. 
              Use the following OTP (One-Time Password) to complete the password reset process:
            </p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #374151; line-height: 1.6; margin-bottom: 20px; padding-left: 20px;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>If you didn't request this password reset, please ignore this email</li>
              <li>Never share this OTP with anyone</li>
            </ul>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Security Tip:</strong> For your security, this OTP will expire in 10 minutes. 
                If you need a new OTP, please request another password reset.
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              If you have any questions or need assistance, please contact our support team.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2024 DevLink. All rights reserved.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">
                This is an automated email, please do not reply.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("OTP Email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending OTP email:", error);
      throw new Error("Failed to send OTP email");
    }
  }

  // Send password reset success email
  async sendPasswordResetSuccessEmail(email, username) {
    const mailOptions = {
      from: `"DevLink" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Successful - DevLink",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">DevLink</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Developer Social Platform</p>
            </div>
            
            <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Successful</h2>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Hi ${username || "there"},
            </p>
            
            <div style="background-color: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #065f46; margin: 0; font-weight: bold;">
                ✅ Your password has been successfully reset!
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Your DevLink account password has been updated successfully. You can now log in with your new password.
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>Security Notice:</strong> If you didn't perform this password reset, 
                please contact our support team immediately as your account may have been compromised.
              </p>
            </div>
            
            <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Thank you for using DevLink!
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                © 2024 DevLink. All rights reserved.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 5px 0 0 0;">
                This is an automated email, please do not reply.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Password reset success email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending password reset success email:", error);
      throw new Error("Failed to send password reset success email");
    }
  }

  // Verify email configuration
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service is ready");
      return true;
    } catch (error) {
      console.error("Email service configuration error:", error);
      return false;
    }
  }
}

module.exports = EmailService;
