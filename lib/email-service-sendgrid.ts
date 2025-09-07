// lib/email-service-sendgrid.ts
// Using SendGrid's official SDK (more reliable than nodemailer)

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();
  
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  accountNumber: string;
}

class SendGridEmailService {
  private adminEmail: string;
  private fromEmail: string;

  constructor() {
    // Validate environment variables
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is required');
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('SENDGRID_FROM_EMAIL environment variable is required');
    }

    // Initialize SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@securebank.com';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL;

    console.log('✅ SendGrid email service initialized');
    console.log('   From email:', this.fromEmail);
    console.log('   Admin email:', this.adminEmail);
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(userData: UserData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Sending welcome email to:', userData.email);

      const welcomeEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SecureBank</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .account-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛡️ Welcome to SecureBank!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userData.firstName} ${userData.lastName},</h2>
              
              <p>Congratulations! Your SecureBank account has been successfully created. We're excited to have you join our community of satisfied customers who trust us with their financial future.</p>
              
              <div class="account-info">
                <h3>Your Account Details:</h3>
                <p><strong>Account Number:</strong> ${userData.accountNumber}</p>
                <p><strong>Account Holder:</strong> ${userData.firstName} ${userData.lastName}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Account Type:</strong> Complete Banking Package</p>
              </div>
              
              <h3>What's Next?</h3>
              <ul>
                <li>✅ Your account is now active and ready to use</li>
                <li>💳 You can access both checking and savings accounts</li>
                <li>🔒 Your account is protected with advanced security features</li>
                <li>📱 Access your account 24/7 through our secure platform</li>
              </ul>
              
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">
                  Access Your Account
                </a>
              </p>
              
              <h3>Important Security Reminders:</h3>
              <ul>
                <li>Never share your login credentials with anyone</li>
                <li>Always log out when using public computers</li>
                <li>Contact us immediately if you notice any suspicious activity</li>
                <li>We will never ask for your password or PIN via email</li>
              </ul>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our customer support team at <strong>support@securebank.com</strong> or call us at <strong>1-800-SECURE-1</strong>.</p>
              
              <p>Thank you for choosing SecureBank. We look forward to serving your banking needs!</p>
              
              <p>Best regards,<br>
              The SecureBank Team</p>
            </div>
            <div class="footer">
              <p>SecureBank - Your trusted financial partner since 2020</p>
              <p>This email was sent to ${userData.email}. If you didn't create this account, please contact us immediately.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const msg = {
        to: userData.email,
        from: {
          email: this.fromEmail,
          name: 'SecureBank'
        },
        subject: '🎉 Welcome to SecureBank - Your Account is Ready!',
        text: `Welcome to SecureBank, ${userData.firstName}! Your account ${userData.accountNumber} has been successfully created. You can now access your checking and savings accounts through our secure platform. Visit ${process.env.NEXT_PUBLIC_APP_URL}/login to get started.`,
        html: welcomeEmailHtml,
      };

      await sgMail.send(msg);
      console.log('✅ Welcome email sent successfully to:', userData.email);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error sending welcome email:', error);
      
      // SendGrid specific error handling
      if (error.response) {
        console.error('SendGrid API Error:', error.response.body);
        return { 
          success: false, 
          error: `SendGrid API Error: ${JSON.stringify(error.response.body)}` 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to send welcome email' 
      };
    }
  }

  /**
   * Send admin notification for new user registration
   */
  async sendAdminNotification(userData: UserData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Sending admin notification for:', userData.email);

      const adminEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New User Registration - SecureBank</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .user-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
            .timestamp { color: #666; font-size: 14px; margin-top: 20px; }
            .action-required { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            ul, ol { padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 New User Registration Alert</h1>
            </div>
            <div class="content">
              <h2>New SecureBank Account Created</h2>
              
              <p>A new user has successfully registered for a SecureBank account. Please review the details below:</p>
              
              <div class="user-info">
                <h3>User Information:</h3>
                <p><strong>Name:</strong> ${userData.firstName} ${userData.lastName}</p>
                <p><strong>Email:</strong> ${userData.email}</p>
                <p><strong>Account Number:</strong> ${userData.accountNumber}</p>
                <p><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div class="action-required">
                <h3>⚠️ Action Required:</h3>
                <ul>
                  <li>Verify uploaded driver's license documentation</li>
                  <li>Review account information for completeness</li>
                  <li>Activate full account privileges if verification passes</li>
                  <li>Send account welcome package if required</li>
                </ul>
              </div>
              
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Access the admin dashboard to review the full application</li>
                <li>Verify the uploaded identity documents</li>
                <li>Complete the account verification process</li>
                <li>Update account status accordingly</li>
              </ol>
              
              <div class="timestamp">
                <p>This notification was generated automatically on ${new Date().toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const msg = {
        to: this.adminEmail,
        from: {
          email: this.fromEmail,
          name: 'SecureBank System'
        },
        subject: `🚨 New User Registration: ${userData.firstName} ${userData.lastName}`,
        text: `New SecureBank user registered: ${userData.firstName} ${userData.lastName} (${userData.email}). Account Number: ${userData.accountNumber}. Registration time: ${new Date().toLocaleString()}. Please review and verify the account.`,
        html: adminEmailHtml,
      };

      await sgMail.send(msg);
      console.log('✅ Admin notification sent successfully to:', this.adminEmail);
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error sending admin notification:', error);
      
      // SendGrid specific error handling
      if (error.response) {
        console.error('SendGrid API Error:', error.response.body);
        return { 
          success: false, 
          error: `SendGrid API Error: ${JSON.stringify(error.response.body)}` 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Failed to send admin notification' 
      };
    }
  }

  /**
   * Send both welcome email and admin notification
   */
  async handleNewUserRegistration(userData: UserData): Promise<{
    welcomeEmailSent: boolean;
    adminNotificationSent: boolean;
    errors: string[];
  }> {
    console.log('🚀 Processing new user registration emails for:', userData.email);
    
    const errors: string[] = [];
    
    // Send welcome email
    const welcomeResult = await this.sendWelcomeEmail(userData);
    if (!welcomeResult.success && welcomeResult.error) {
      errors.push(`Welcome email failed: ${welcomeResult.error}`);
    }
    
    // Send admin notification
    const adminResult = await this.sendAdminNotification(userData);
    if (!adminResult.success && adminResult.error) {
      errors.push(`Admin notification failed: ${adminResult.error}`);
    }
    
    return {
      welcomeEmailSent: welcomeResult.success,
      adminNotificationSent: adminResult.success,
      errors,
    };
  }
}

export const sendGridEmailService = new SendGridEmailService();