# Email Template Variables Guide 📧

## 🐛 **The Problem**
You tried to use `{{process.env.APP_NAME}}` directly in the Handlebars template, but:
- **Handlebars templates can't access `process.env` directly**
- **Environment variables need to be passed through the context**
- **Templates only have access to data passed in the `context` object**

## ✅ **Solution Applied**

### **1. Updated Mail Service**
Now passes environment variables and app info to all email templates:

```typescript
// In mail.service.ts
context: {
    data: templateData,               // Your user/entity data
    appName: process.env.APP_NAME || 'Our Platform',
    appHost: process.env.APP_HOST || 'localhost', 
    appPort: process.env.APP_PORT || '3000',
    currentYear: new Date().getFullYear(),
}
```

### **2. Updated Template**
Changed from:
```handlebars
<h1>Welcome to {{process.env.APP_NAME}}!</h1>
<p>&copy; 2025 {{process.env.APP_NAME}}. All rights reserved.</p>
```

To:
```handlebars
<h1>Welcome to {{appName}}!</h1>
<p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
```

## 🎯 **Available Template Variables**

### **App Information**
```handlebars
{{appName}}        <!-- Your app name from .env -->
{{appHost}}        <!-- App host (localhost, domain.com) -->
{{appPort}}        <!-- App port (3000, 8080, etc.) -->
{{currentYear}}    <!-- Current year (2025) -->
```

### **User Data**
```handlebars
{{data.name}}              <!-- User's name -->
{{data.email}}             <!-- User's email -->
{{data.email_verified_at}} <!-- Registration date -->
{{data.status}}            <!-- User status (true/false) -->
{{data._id}}               <!-- User ID -->
```

### **Conditional Display**
```handlebars
{{#if data.status}}
    <p>Your account is <strong>active</strong>!</p>
{{else}}
    <p>Please activate your account.</p>
{{/if}}
```

## 🔧 **Advanced Template Features**

### **1. Formatted Dates**
```handlebars
<!-- For better date formatting, pass formatted date from service -->
{{data.formattedDate}}
```

Update your service to include formatted dates:
```typescript
const templateData = {
    ...userData,
    formattedDate: new Date(userData.email_verified_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
    })
};
```

### **2. Dynamic URLs**
```handlebars
<a href="http://{{appHost}}:{{appPort}}/login" class="button">Login to Your Account</a>
<a href="http://{{appHost}}:{{appPort}}/reset-password?token={{data.resetToken}}" class="button">Reset Password</a>
```

### **3. Multiple App Information**
You can pass more app-specific data:

```typescript
// In mail.service.ts
context: {
    data: templateData,
    app: {
        name: process.env.APP_NAME || 'Our Platform',
        url: `http://${process.env.APP_HOST}:${process.env.APP_PORT}`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
        logo: process.env.APP_LOGO_URL || '/assets/logo.png',
    },
    currentYear: new Date().getFullYear(),
}
```

Then use in template:
```handlebars
<h1>Welcome to {{app.name}}!</h1>
<p>Visit us at: <a href="{{app.url}}">{{app.url}}</a></p>
<p>Need help? Contact: <a href="mailto:{{app.supportEmail}}">{{app.supportEmail}}</a></p>
```

## 📝 **Complete Template Example**

```handlebars
<!DOCTYPE html>
<html>
<head>
    <title>Welcome to {{appName}}</title>
</head>
<body>
    <div class="header">
        <h1>Welcome to {{appName}}!</h1>
    </div>
    
    <div class="content">
        <h2>Hello {{data.name}}!</h2>
        <p>Your account has been created successfully.</p>
        
        <div class="account-details">
            <h3>Account Information:</h3>
            <p><strong>Name:</strong> {{data.name}}</p>
            <p><strong>Email:</strong> {{data.email}}</p>
            <p><strong>Status:</strong> 
                {{#if data.status}}Active{{else}}Pending{{/if}}
            </p>
            <p><strong>Registered:</strong> {{data.formattedDate}}</p>
        </div>
        
        <p>
            <a href="http://{{appHost}}:{{appPort}}/login" class="button">
                Login to {{appName}}
            </a>
        </p>
    </div>
    
    <div class="footer">
        <p>Thank you for choosing {{appName}}!</p>
        <p>&copy; {{currentYear}} {{appName}}. All rights reserved.</p>
    </div>
</body>
</html>
```

## 🧪 **Testing Your Template**

### **1. Check Your .env File**
Make sure you have:
```bash
APP_NAME="Your App Name"
APP_HOST=localhost
APP_PORT=3000
```

### **2. Test Registration**
When you register a new user, the email will now show:
- ✅ `Welcome to Your App Name!` (instead of `{{process.env.APP_NAME}}`)
- ✅ `© 2025 Your App Name. All rights reserved.`
- ✅ Dynamic year that updates automatically

### **3. View Logs**
In your terminal, you'll see:
```bash
[Nest] LOG [MailService] Sending email to user@example.com with template: admin/mail/auth/register
[Nest] LOG [MailService] Email sent successfully to user@example.com
```

## 🎨 **Create More Templates**

You can now create other email templates using the same variables:

### **Password Reset Template** (`admin/mail/auth/password-reset.hbs`)
```handlebars
<h1>Password Reset - {{appName}}</h1>
<p>Hello {{data.name}},</p>
<p>You requested a password reset for your {{appName}} account.</p>
<a href="http://{{appHost}}:{{appPort}}/reset?token={{data.resetToken}}">Reset Password</a>
```

### **Welcome Email Template** (`admin/mail/auth/welcome.hbs`)
```handlebars
<h1>Welcome to {{appName}}!</h1>
<p>Hi {{data.name}}, thanks for joining {{appName}}!</p>
```

## 🚀 **Your Template Now Works!**

✅ **No more literal `{{process.env.APP_NAME}}`**  
✅ **Dynamic app name from environment variables**  
✅ **Automatic current year**  
✅ **Clean, professional email display**  

Your email template will now properly display your app name and other dynamic information! 🎉
