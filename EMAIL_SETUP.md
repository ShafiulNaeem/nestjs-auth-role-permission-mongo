# Email System Setup Guide

This guide explains how to configure and use the email system in your NestJS application.

## 🔧 Configuration

### 1. Environment Variables

Add the following variables to your `.env` file:

```bash
# Mail Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
```

### 2. Gmail Configuration (Most Common)

For Gmail, you'll need:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in `MAIL_PASS`

### 3. Other Email Providers

#### Outlook/Hotmail
```bash
MAIL_HOST=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USER=your-email@outlook.com
MAIL_PASS=your-password
```

#### Yahoo
```bash
MAIL_HOST=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_USER=your-email@yahoo.com
MAIL_PASS=your-app-password
```

#### Custom SMTP
```bash
MAIL_HOST=your-smtp-server.com
MAIL_PORT=587
MAIL_USER=your-username
MAIL_PASS=your-password
```

## 📧 Email Templates

### Template Location
Templates are stored in: `src/templates/`

### Template Structure
```
src/templates/
├── admin/
│   └── mail/
│       ├── auth/
│       │   ├── register.hbs
│       │   ├── password-reset.hbs
│       │   └── verification.hbs
│       └── welcome.hbs
└── user/
    └── mail/
        └── notifications/
```

### Creating New Templates

1. Create a new `.hbs` file in the appropriate directory
2. Use Handlebars syntax for dynamic content:

```handlebars
<!DOCTYPE html>
<html>
<head>
    <title>{{subject}}</title>
</head>
<body>
    <h1>Hello {{data.name}}!</h1>
    <p>Your email: {{data.email}}</p>
    
    {{#if data.status}}
        <p>Your account is active!</p>
    {{else}}
        <p>Please activate your account.</p>
    {{/if}}
</body>
</html>
```

## 🚀 Usage

### In Services

```typescript
import { MailService } from '../../utilis/mail/mail.service';

@Injectable()
export class YourService {
  constructor(private readonly mailService: MailService) {}

  async sendWelcomeEmail(user: any) {
    try {
      await this.mailService.sendMail(
        user.email,                           // Recipient email
        user,                                 // Data object for template
        'Welcome to Our Platform!',           // Subject
        'admin/mail/auth/register'            // Template path
      );
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  }
}
```

### Template Data

The `data` object passed to `sendMail()` is available in templates as `{{data.property}}`:

```typescript
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  status: true,
  created_at: new Date()
};

await this.mailService.sendMail(
  userData.email,
  userData,
  'Welcome!',
  'admin/mail/auth/register'
);
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Template Not Found Error
```
Error: ENOENT: no such file or directory, open '...template.hbs'
```

**Solution**: 
- Check template path in `src/templates/`
- Verify template name matches exactly
- Ensure `.hbs` extension is NOT included in the path when calling `sendMail()`

#### 2. Authentication Failed
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solution**:
- Use App Password for Gmail (not your regular password)
- Enable "Less secure app access" if not using 2FA
- Check username/password in `.env` file

#### 3. Connection Timeout
```
Error: connect ETIMEDOUT
```

**Solution**:
- Check SMTP host and port
- Verify firewall/network settings
- Try different ports (587, 465, 25)

#### 4. SSL/TLS Issues
```
Error: unable to verify the first certificate
```

**Solution**: Update mail configuration to handle SSL:

```typescript
// In mail.module.ts
transport: {
  host: process.env.MAIL_HOST,
  port: +process.env.MAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
},
```

## 📝 Email Templates Available

### 1. User Registration (`admin/mail/auth/register`)
- Sent when a new user account is created
- Includes user details and welcome message

### 2. Welcome Email (`welcome`)
- Basic welcome template
- Simple greeting message

## 🔒 Security Best Practices

1. **Never commit credentials** to version control
2. **Use App Passwords** instead of regular passwords
3. **Enable 2FA** on email accounts
4. **Use environment variables** for all sensitive data
5. **Validate email addresses** before sending
6. **Implement rate limiting** to prevent spam

## 🧪 Testing

### Test Email Configuration

```typescript
// Create a test endpoint
@Get('test-email')
async testEmail() {
  try {
    await this.mailService.sendMail(
      'test@example.com',
      { name: 'Test User' },
      'Test Email',
      'welcome'
    );
    return { message: 'Email sent successfully' };
  } catch (error) {
    return { error: error.message };
  }
}
```

### Development Mode

For development, consider using:
- **Mailtrap** - Email testing service
- **MailHog** - Local email testing
- **Gmail** with app passwords

```bash
# Mailtrap configuration
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your-mailtrap-username
MAIL_PASS=your-mailtrap-password
```

## 📚 Advanced Features

### Custom Email Provider

```typescript
// Custom transport configuration
transport: {
  host: 'your-custom-smtp.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
}
```

### Email Queues

For high-volume applications, consider implementing email queues using Bull or similar:

```typescript
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EmailQueueService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async addEmailToQueue(emailData: any) {
    await this.emailQueue.add('send-email', emailData);
  }
}
```
