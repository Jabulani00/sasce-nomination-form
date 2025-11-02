# EmailJS Setup Guide for SASCE Voting System

## Overview
This guide will help you configure EmailJS to send voting invitation emails to approved voters.

---

## EmailJS Configuration

### 1. Login to EmailJS Dashboard
- Go to: https://dashboard.emailjs.com/
- Login with your EmailJS account

### 2. Service Setup
**Service ID:** `service_o1ayaah`  
**Public Key:** `ySMuhBiOuKBR2t0Gl`

If you need to create a new service:
1. Go to **Email Services** → **Add New Service**
2. Choose your email provider (Gmail, Outlook, etc.)
3. Follow the setup instructions
4. Note down your Service ID

### 3. Template Setup
**Template ID:** `template_l9m00ai`

#### Create New Template:
1. Go to **Email Templates** → **Add New Template**
2. Set Template ID to: `template_l9m00ai`
3. Select Service: `service_o1ayaah`

#### Configure Template Settings:

**To Email:**
```
{{to_email}}
```

**From Name:**
```
SASCE Election Committee
```

**From Email:**
Leave this blank or use your default email service email (configured in your EmailJS service)

**Use Default Email Address:**
✅ Check this box (if available)

**Reply To:**
```
jtechnologies87@gmail.com
```

**Bcc:** (Leave blank)

**Cc:** (Leave blank)

#### Configure Template Content:

**Subject Line:**
```
SASCE Voting Ballot - {{position_name}}
```

**Email Body:**
- Open the file `SASCE_Voting_Email_Template.html`
- Copy the ENTIRE HTML content
- Paste it into the EmailJS template editor

**Important:** Make sure you're pasting the HTML into the template editor. The editor should accept HTML.

---

## Template Variables

The template uses these variables (automatically filled by the system):

1. **{{to_email}}** - Recipient's email address (REQUIRED for To Email field)
   - Example: "john.smith@university.edu"

2. **{{voter_name}}** - Full name of the voter
   - Example: "John Smith"

3. **{{position_name}}** - Position being voted for
   - Examples: "President", "Deputy President", "General Secretary", etc.

4. **{{organization}}** - Voter's organization name
   - Example: "University of Cape Town"

5. **{{membership_number}}** - Voter's membership number
   - Example: "MEM12345"

6. **{{voting_link}}** - Unique voting link with security token
   - Example: "https://sasce-nomination-form.vercel.app/ballot.html?token=abc123&position=president"

---

## Testing Your Template

### 1. Test in EmailJS Dashboard
1. Click **Test** in the template editor
2. Enter test values for each variable:
   ```
   to_email: your-test-email@example.com
   voter_name: John Doe
   position_name: President
   organization: Test University
   membership_number: TEST001
   voting_link: https://sasce-nomination-form.vercel.app/ballot.html?token=test123&position=president
   ```
3. Click **Send Test Email**
4. Check your email inbox

### 2. Test from Admin Panel
1. Go to: https://sasce-nomination-form.vercel.app/admin-voting-control.html
2. Select a position (e.g., "President")
3. Click **Send Test Email** button
4. Check your email inbox

---

## Email Appearance

### Desktop View
- Clean, professional design
- SASCE branding colors
- Responsive layout
- Prominent voting button

### Mobile View
- Optimized for mobile devices
- Touch-friendly button
- Readable text on small screens
- Proper formatting

---

## Troubleshooting

### Email Not Sending
1. Check Service ID is correct: `service_o1ayaah`
2. Verify Template ID: `template_l9m00ai`
3. Confirm Public Key: `ySMuhBiOuKBR2t0Gl`
4. Check email service provider limits

### Template Not Displaying Correctly
1. Ensure HTML is pasted correctly
2. Check for any HTML errors in EmailJS editor
3. Test in different email clients (Gmail, Outlook)
4. Verify CSS is supported by email clients

### Variables Not Working
1. Make sure variable names match exactly (case-sensitive)
2. Variables must use double curly braces: `{{variable_name}}`
3. Test with sample data in EmailJS dashboard
4. Check browser console for JavaScript errors

### Link Not Working
1. Verify domain is correct: `https://sasce-nomination-form.vercel.app/`
2. Check that token is being generated properly
3. Ensure ballot.html page is accessible
4. Test the link manually

---

## Security Features

### Unique Links
- Each voter receives a unique voting link
- Link contains a security token
- Token cannot be shared or reused

### Voter Information
- Auto-filled from the invitation link
- Cannot be modified by the voter
- Validated against the database

### Access Control
- Only approved voters can access the ballot
- Invalid or missing tokens are rejected
- One vote per voter per position

---

## Email Delivery

### Bulk Sending
- Admin can send to all approved voters at once
- Progress tracking shows success/failure counts
- Failed emails are logged for review

### Individual Sending
- Test emails sent to first approved voter
- Useful for verifying template and link

### Best Practices
1. Send test email before bulk sending
2. Monitor delivery success rates
3. Keep backup of voter email addresses
4. Document any issues encountered

---

## Support

For technical support:
- **Email:** admin@sasce.net
- **Check:** EmailJS documentation at https://www.emailjs.com/docs/

---

## Quick Reference

| Component | Value |
|-----------|-------|
| **Service ID** | service_o1ayaah |
| **Template ID** | template_l9m00ai |
| **Public Key** | ySMuhBiOuKBR2t0Gl |
| **Domain** | https://sasce-nomination-form.vercel.app/ |
| **Template File** | SASCE_Voting_Email_Template.html |

---

## Next Steps

1. ✅ Configure EmailJS service
2. ✅ Create template with HTML from `SASCE_Voting_Email_Template.html`
3. ✅ Test email delivery
4. ✅ Verify link functionality
5. ✅ Send test from admin panel
6. ✅ Ready for production use!

---

**Need Help?** Check the troubleshooting section or contact admin@sasce.net

