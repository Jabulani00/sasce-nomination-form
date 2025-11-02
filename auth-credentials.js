// Encrypted credentials file - DO NOT MODIFY
// This file contains obfuscated admin credentials
(function() {
    // Simple obfuscation using base64 encoding
    const encoded = {
        emails: ['d2FuYUBzYXNjZS5uZXQ=', 'bWF0c2VrZUBzYXNjZS5uZXQ=', 'YWRtaW5Ac2FzY2UubmV0', 'amFidWxhN0BvdXRsb29rLmNvbQ=='],
        password: 'UGFzc3dvcmRAMDE='
    };
    
    // Decode function
    window.getAuthCredentials = function() {
        return {
            allowedEmails: encoded.emails.map(e => atob(e)),
            password: atob(encoded.password)
        };
    };
})();

