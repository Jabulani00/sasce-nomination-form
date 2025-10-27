# SASCE Nomination Form – 2025 Election of Office Bearers

A modern, responsive web application for the SASCE (South African Society for Continuing Education) nomination form for the 2025 Election of Office Bearers.

## Features

### 🎯 Complete Form Sections
- **Section 1**: Introduction and welcome
- **Section 2**: Personal & Membership Information
- **Section 3**: Career Details
- **Section 4**: Nomination Confirmation
- **Section 5**: Nominator Details
- **Section 6**: Nominee Acceptance
- **Section 7**: Rules & Eligibility
- **Section 8**: Criteria for Election
- **Section 9**: Constitution Reference

### ✨ Modern Features
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Multi-step Navigation**: Easy-to-use section-by-section navigation
- **Real-time Validation**: Instant feedback on form fields
- **File Upload Support**: Profile picture and CV/Bio upload with preview
- **Auto-save**: Form data is automatically saved to prevent data loss
- **Progress Tracking**: Visual progress bar showing completion status
- **Firebase Integration**: Secure data storage and file handling

### 🔧 Technical Features
- **Firebase Firestore**: For storing nomination data
- **Base64 File Storage**: Files are converted to base64 and stored directly in Firestore
- **Form Validation**: Client-side validation with error messages
- **Modern CSS**: Beautiful, professional styling with animations
- **Accessibility**: Proper form labels and keyboard navigation
- **Error Handling**: Comprehensive error handling and user feedback

## Setup Instructions

### Prerequisites
- A modern web browser
- Firebase project with Firestore and Storage enabled

### Installation
1. Clone or download the project files
2. Ensure you have the following files:
   - `index.html` - Main form page
   - `styles.css` - Styling and responsive design
   - `script.js` - Form logic and Firebase integration

### Firebase Configuration
The Firebase configuration is already included in the HTML file. Make sure your Firebase project has:
- Firestore Database enabled
- Proper security rules configured

### Security Rules
For Firestore, ensure you have appropriate security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /nominations/{document} {
      allow create: if true; // Allow anyone to create nominations
      allow read, update, delete: if false; // Restrict other operations
    }
  }
}
```

**Note**: Since files are stored as base64 strings in Firestore, no separate Storage security rules are needed.

## Usage

### For Nominators
1. Open `index.html` in a web browser
2. Fill out each section of the form step by step
3. Upload required documents (profile picture, CV/Bio)
4. Review all information before submission
5. Submit the nomination

### Form Validation
- Required fields are marked with asterisks (*)
- Real-time validation provides immediate feedback
- File uploads show preview and file size information
- Form cannot be submitted until all required fields are completed

### Data Storage
- All form data is securely stored in Firebase Firestore
- File uploads are converted to base64 and stored directly in Firestore
- Each nomination includes a timestamp and status tracking
- Files are stored with their original filename and MIME type for easy retrieval

## File Structure

```
sasce-nomination-form/
├── index.html          # Main HTML file with form structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript for form logic and Firebase
└── README.md           # This documentation file
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Security Considerations

- All form data is validated client-side and server-side
- File uploads are restricted to specific file types
- Files are converted to base64 for secure storage in Firestore
- Firebase security rules should be properly configured
- Sensitive data should be handled according to privacy regulations
- Base64 encoding ensures files are stored as text strings in the database

## Support

For technical support or questions about the form:
- Email: admin@sasce.net
- Phone: 083 315 2522 / 068 362 4199

## License

This form is created for SASCE (South African Society for Continuing Education) and is intended for official use only.
"# sasce-nomination-form" 
