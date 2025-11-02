// Login Script with Failed Attempts Tracking
class LoginSystem {
    constructor() {
        this.maxAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15 minutes in milliseconds
        this.credentials = window.getAuthCredentials();
        this.init();
    }

    init() {
        const form = document.getElementById('loginForm');
        const passwordToggle = document.getElementById('passwordToggle');
        
        form.addEventListener('submit', (e) => this.handleLogin(e));
        passwordToggle.addEventListener('click', () => this.togglePasswordVisibility());
        
        this.checkLockoutStatus();
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('passwordToggle').querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        }
    }

    checkLockoutStatus() {
        const lockoutData = this.getLockoutData();
        const loginInfo = document.getElementById('loginInfo');
        const loginBtn = document.getElementById('loginBtn');
        const attemptsInfo = document.getElementById('attemptsInfo');

        if (lockoutData && lockoutData.isLocked) {
            const remainingTime = lockoutData.lockoutEnd - Date.now();
            
            if (remainingTime > 0) {
                const minutes = Math.floor(remainingTime / 60000);
                const seconds = Math.floor((remainingTime % 60000) / 1000);
                
                loginInfo.style.display = 'block';
                loginInfo.className = 'login-info error';
                attemptsInfo.innerHTML = `Account temporarily locked. Try again in ${minutes}:${seconds.toString().padStart(2, '0')}`;
                loginBtn.disabled = true;
                
                // Update countdown every second
                const countdown = setInterval(() => {
                    const newRemainingTime = lockoutData.lockoutEnd - Date.now();
                    if (newRemainingTime <= 0) {
                        clearInterval(countdown);
                        this.clearLockout();
                        this.checkLockoutStatus();
                        return;
                    }
                    const newMinutes = Math.floor(newRemainingTime / 60000);
                    const newSeconds = Math.floor((newRemainingTime % 60000) / 1000);
                    attemptsInfo.innerHTML = `Account temporarily locked. Try again in ${newMinutes}:${newSeconds.toString().padStart(2, '0')}`;
                }, 1000);
            } else {
                this.clearLockout();
                this.checkLockoutStatus();
            }
        } else {
            const failedAttempts = this.getFailedAttempts();
            if (failedAttempts > 0) {
                loginInfo.style.display = 'block';
                loginInfo.className = 'login-info warning';
                const remaining = this.maxAttempts - failedAttempts;
                attemptsInfo.innerHTML = `Warning: ${failedAttempts} failed ${failedAttempts === 1 ? 'attempt' : 'attempts'}. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining before lockout.`;
            } else {
                loginInfo.style.display = 'none';
            }
        }
    }

    getFailedAttempts() {
        const data = localStorage.getItem('sasce_login_attempts');
        if (!data) return 0;
        
        try {
            const parsed = JSON.parse(data);
            // Reset if more than 1 hour has passed
            if (Date.now() - parsed.timestamp > 3600000) {
                localStorage.removeItem('sasce_login_attempts');
                return 0;
            }
            return parsed.count || 0;
        } catch {
            return 0;
        }
    }

    incrementFailedAttempts() {
        const data = localStorage.getItem('sasce_login_attempts');
        let attempts = 0;
        let timestamp = Date.now();
        
        if (data) {
            try {
                const parsed = JSON.parse(data);
                // Only increment if within last hour
                if (Date.now() - parsed.timestamp < 3600000) {
                    attempts = parsed.count || 0;
                }
            } catch {}
        }
        
        attempts++;
        localStorage.setItem('sasce_login_attempts', JSON.stringify({
            count: attempts,
            timestamp: timestamp
        }));

        // Lock account if max attempts reached
        if (attempts >= this.maxAttempts) {
            this.lockAccount();
        }

        return attempts;
    }

    clearFailedAttempts() {
        localStorage.removeItem('sasce_login_attempts');
    }

    lockAccount() {
        const lockoutEnd = Date.now() + this.lockoutDuration;
        localStorage.setItem('sasce_login_lockout', JSON.stringify({
            isLocked: true,
            lockoutEnd: lockoutEnd,
            timestamp: Date.now()
        }));
    }

    getLockoutData() {
        const data = localStorage.getItem('sasce_login_lockout');
        if (!data) return null;
        
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    clearLockout() {
        localStorage.removeItem('sasce_login_lockout');
        this.clearFailedAttempts();
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        successDiv.style.display = 'none';
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        errorDiv.style.display = 'none';
    }

    hideMessages() {
        document.getElementById('errorMessage').style.display = 'none';
        document.getElementById('successMessage').style.display = 'none';
    }

    validateCredentials(email, password) {
        const emailLower = email.toLowerCase().trim();
        const allowedEmails = this.credentials.allowedEmails.map(e => e.toLowerCase());
        
        return allowedEmails.includes(emailLower) && password === this.credentials.password;
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const lockoutData = this.getLockoutData();
        if (lockoutData && lockoutData.isLocked && lockoutData.lockoutEnd > Date.now()) {
            this.showError('Account is temporarily locked due to too many failed login attempts.');
            this.checkLockoutStatus();
            return;
        }

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');

        // Hide previous messages
        this.hideMessages();

        // Validate credentials
        if (this.validateCredentials(email, password)) {
            // Clear failed attempts on successful login
            this.clearFailedAttempts();
            this.clearLockout();
            
            // Store session
            localStorage.setItem('sasce_admin_session', JSON.stringify({
                email: email.toLowerCase(),
                timestamp: Date.now(),
                loggedIn: true
            }));

            // Show success and redirect
            this.showSuccess('Login successful! Redirecting...');
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
            
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            // Increment failed attempts
            const attempts = this.incrementFailedAttempts();
            const remaining = this.maxAttempts - attempts;
            
            if (attempts >= this.maxAttempts) {
                this.showError(`Too many failed login attempts. Account locked for 15 minutes.`);
                this.checkLockoutStatus();
            } else {
                this.showError(`Invalid email or password. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining before lockout.`);
                this.checkLockoutStatus();
            }
            
            // Clear password field
            document.getElementById('password').value = '';
        }
    }
}

// Initialize login system when page loads
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
});

