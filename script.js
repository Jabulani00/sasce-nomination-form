// Form Management and Validation
class NominationForm {
    constructor() {
        this.currentSection = 1;
        this.totalSections = 6;
        this.formData = {};
        this.nominations = []; // Array to store multiple nominations
        this.selectedNominationIndex = -1;
        this.isEditing = false;
        this.editingIndex = -1;
        this.initializeEventListeners();
        this.updateProgress();
        this.showSection(1);
    }

    initializeEventListeners() {
        // Navigation buttons
        document.getElementById('nextBtn').addEventListener('click', () => this.nextSection());
        document.getElementById('prevBtn').addEventListener('click', () => this.prevSection());
        
        // Form submission
        document.getElementById('nominationForm').addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Multiple nominations management
        document.getElementById('addNominationBtn').addEventListener('click', () => this.addNomination());
        document.getElementById('addNewNominationBtn').addEventListener('click', () => this.startNewNomination());
        document.getElementById('submitAllBtn').addEventListener('click', () => this.submitAllNominations());
        document.getElementById('editNominationBtn').addEventListener('click', () => this.editSelectedNomination());
        document.getElementById('removeNominationBtn').addEventListener('click', () => this.removeSelectedNomination());
        
        // File upload previews
        document.getElementById('profilePicture').addEventListener('change', (e) => this.handleFilePreview(e, 'profilePreview'));
        
        // CV/Bio validation - ensure at least one is provided
        document.getElementById('cvBioText').addEventListener('input', () => this.validateCvBioInputs());
        document.getElementById('cvBioLink').addEventListener('input', () => this.validateCvBioInputs());
        
        // Real-time form validation
        this.addRealTimeValidation();
        
        // Update acceptance text with name
        document.getElementById('firstName').addEventListener('input', () => this.updateAcceptanceText());
        document.getElementById('surname').addEventListener('input', () => this.updateAcceptanceText());
        
        // Update acceptance status based on nomination type
        document.querySelectorAll('input[name="selfNomination"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateAcceptanceStatus());
        });
    }

    showSection(sectionNumber) {
        // Hide all sections
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show current section
        document.getElementById(`section${sectionNumber}`).classList.add('active');
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Update progress
        this.updateProgress();
    }

    nextSection() {
        if (this.validateCurrentSection()) {
            if (this.currentSection < this.totalSections) {
                this.currentSection++;
                this.showSection(this.currentSection);
            }
        }
    }

    prevSection() {
        if (this.currentSection > 1) {
            this.currentSection--;
            this.showSection(this.currentSection);
        }
    }

    validateCurrentSection() {
        const currentSectionElement = document.getElementById(`section${this.currentSection}`);
        const requiredFields = currentSectionElement.querySelectorAll('[required]');
        let isValid = true;
        
        // Clear previous error messages
        this.clearErrorMessages();
        
        // Skip validation for informational sections (1, 2, 3)
        if (this.currentSection <= 3) {
            return true;
        }
        
        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
                this.showFieldError(field, 'This field is required');
            }
        });
        
        // Special validation for specific sections
        if (this.currentSection === 6) {
            // Validate CV/Bio inputs - at least one must be provided
            if (!this.validateCvBioInputs()) {
                isValid = false;
            }
            
            // Validate infrastructure support question
            const infrastructureSupport = document.querySelector('input[name="infrastructureSupport"]:checked');
            if (!infrastructureSupport) {
                this.showSectionError('Please indicate if the person has infrastructure to support system in executive role');
                isValid = false;
            }
        }
        
        if (this.currentSection === 5) {
            const selfNomination = document.querySelector('input[name="selfNomination"]:checked');
            if (!selfNomination) {
                this.showSectionError('Please select a nomination type');
                isValid = false;
            }
        }
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        
        if (field.hasAttribute('required') && !value) {
            return false;
        }
        
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value);
        }
        
        if (field.type === 'url' && value) {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        }
        
        return true;
    }

    showFieldError(field, message) {
        field.style.borderColor = '#e74c3c';
        
        let errorElement = field.parentNode.querySelector('.field-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.style.color = '#e74c3c';
            errorElement.style.fontSize = '0.85rem';
            errorElement.style.marginTop = '5px';
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    showSectionError(message) {
        const currentSection = document.getElementById(`section${this.currentSection}`);
        let errorElement = currentSection.querySelector('.section-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'section-error error-message';
            currentSection.querySelector('.section-content').prepend(errorElement);
        }
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }

    clearErrorMessages() {
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        document.querySelectorAll('.section-error').forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
        document.querySelectorAll('input, textarea, select').forEach(field => {
            field.style.borderColor = '#e1e8ed';
        });
    }

    addRealTimeValidation() {
        document.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('blur', () => {
                if (field.hasAttribute('required')) {
                    this.validateField(field);
                }
            });
            
            field.addEventListener('input', () => {
                if (field.style.borderColor === 'rgb(231, 76, 60)') {
                    if (this.validateField(field)) {
                        field.style.borderColor = '#e1e8ed';
                        const errorElement = field.parentNode.querySelector('.field-error');
                        if (errorElement) {
                            errorElement.remove();
                        }
                    }
                }
            });
        });
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const addNominationBtn = document.getElementById('addNominationBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        prevBtn.style.display = this.currentSection === 1 ? 'none' : 'block';
        
        if (this.currentSection === this.totalSections) {
            nextBtn.style.display = 'none';
            addNominationBtn.style.display = 'block';
            addNominationBtn.textContent = this.isEditing ? 'Save Changes' : 'Move Forward';
            submitBtn.style.display = 'none';
        } else {
            nextBtn.style.display = 'block';
            addNominationBtn.style.display = 'none';
            submitBtn.style.display = 'none';
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        const percentage = (this.currentSection / this.totalSections) * 100;
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${this.currentSection} of ${this.totalSections}`;
    }

    handleFilePreview(event, previewId) {
        const file = event.target.files[0];
        const preview = document.getElementById(previewId);
        
        if (file) {
            preview.textContent = `Selected: ${file.name} (${this.formatFileSize(file.size)})`;
            preview.classList.add('show');
        } else {
            preview.classList.remove('show');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    validateCvBioInputs() {
        const cvBioText = document.getElementById('cvBioText').value.trim();
        const cvBioLink = document.getElementById('cvBioLink').value.trim();
        
        // At least one must be provided
        if (!cvBioText && !cvBioLink) {
            this.showFieldError(document.getElementById('cvBioText'), 'Please provide at least one option: text or link');
            this.showFieldError(document.getElementById('cvBioLink'), 'Please provide at least one option: text or link');
            return false;
        }
        
        // Clear any existing errors
        this.clearFieldError(document.getElementById('cvBioText'));
        this.clearFieldError(document.getElementById('cvBioLink'));
        
        return true;
    }

    clearFieldError(field) {
        field.style.borderColor = '#e1e8ed';
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    updateAcceptanceText() {
        const firstName = document.getElementById('firstName').value;
        const surname = document.getElementById('surname').value;
        const acceptanceName = document.getElementById('acceptanceName');
        
        if (firstName && surname) {
            acceptanceName.textContent = `${firstName} ${surname}`;
        } else {
            acceptanceName.textContent = '[Full Name]';
        }
    }

    updateAcceptanceStatus() {
        const selfNomination = document.querySelector('input[name="selfNomination"]:checked');
        const acceptanceStatus = document.getElementById('acceptanceStatus');
        
        if (selfNomination) {
            if (selfNomination.value === 'self') {
                acceptanceStatus.value = 'Accepted';
                acceptanceStatus.style.color = '#27ae60';
                acceptanceStatus.style.fontWeight = '600';
            } else if (selfNomination.value === 'third-party') {
                acceptanceStatus.value = 'Pending';
                acceptanceStatus.style.color = '#f39c12';
                acceptanceStatus.style.fontWeight = '600';
            }
        } else {
            acceptanceStatus.value = '';
            acceptanceStatus.style.color = '#6c757d';
            acceptanceStatus.style.fontWeight = 'normal';
        }
    }

    collectFormData() {
        const form = document.getElementById('nominationForm');
        const formData = new FormData(form);
        
        // Convert FormData to regular object with support for repeated fields (arrays)
        const data = {};
        for (let [key, value] of formData.entries()) {
            // Normalize checkbox/radio arrays using [] notation
            if (key.endsWith('[]')) {
                const normalizedKey = key.slice(0, -2);
                if (!Array.isArray(data[normalizedKey])) {
                    data[normalizedKey] = [];
                }
                if (value && value.trim() !== '') {
                    data[normalizedKey].push(value);
                }
            } else if (data[key] !== undefined) {
                // If the same key appears multiple times without [], aggregate into array
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }
        
        // Add file information
        const profilePicture = document.getElementById('profilePicture').files[0];
        const cvBioText = document.getElementById('cvBioText').value.trim();
        const cvBioLink = document.getElementById('cvBioLink').value.trim();
        
        if (profilePicture) {
            data.profilePictureFile = profilePicture;
        }
        
        if (cvBioText) {
            data.cvBioText = cvBioText;
        }
        
        if (cvBioLink) {
            data.cvBioLink = cvBioLink;
        }
        
        return data;
    }

    async addNomination() {
        if (!this.validateCurrentSection()) {
            return;
        }
        
        const addBtn = document.getElementById('addNominationBtn');
        addBtn.classList.add('loading');
        addBtn.disabled = true;
        
        try {
            const formData = this.collectFormData();
            
            // Convert files to base64 if they exist
            if (formData.profilePictureFile) {
                formData.profilePictureBase64 = await this.fileToBase64(formData.profilePictureFile);
                formData.profilePictureFileName = formData.profilePictureFile.name;
                formData.profilePictureFileType = formData.profilePictureFile.type;
            }
            
            if (this.isEditing && this.editingIndex > -1) {
                // Update existing nomination
                this.nominations[this.editingIndex] = formData;
                this.isEditing = false;
                this.editingIndex = -1;
            } else {
                // Add nomination to the array
                this.nominations.push(formData);
            }
            this.saveNominationsToLocalStorage();
            
            // Clear the form for next nomination
            this.clearForm();
            
            // Show nominations summary
            this.showNominationsSummary();
            
        } catch (error) {
            console.error('Error adding nomination:', error);
            this.showErrorMessage('An error occurred while adding the nomination. Please try again.');
        } finally {
            addBtn.classList.remove('loading');
            addBtn.disabled = false;
        }
    }

    async submitAllNominations() {
        if (this.nominations.length === 0) {
            this.showErrorMessage('No nominations to submit.');
            return;
        }
        
        const submitBtn = document.getElementById('submitAllBtn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        try {
            // Submit all nominations to Firestore
            for (let i = 0; i < this.nominations.length; i++) {
                await this.saveToFirestore(this.nominations[i]);
            }
            
            this.showSuccessMessage();
            
        } catch (error) {
            console.error('Error submitting nominations:', error);
            this.showErrorMessage('An error occurred while submitting the nominations. Please try again.');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    async saveToFirestore(data) {
        const { getFirestore, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const db = getFirestore();
        const nominationsRef = collection(db, 'nominations');
        
        // Remove file objects before saving to Firestore (keep base64 data, text, and link)
        const { profilePictureFile, ...firestoreData } = data;
        
        // Create a clean object with only Firestore-compatible data
        const cleanData = {
            ...firestoreData,
            submittedAt: new Date(),
            status: 'pending'
        };
        
        // Remove any remaining File objects or undefined values
        Object.keys(cleanData).forEach(key => {
            if (cleanData[key] instanceof File || cleanData[key] === undefined) {
                delete cleanData[key];
            }
        });
        
        await addDoc(nominationsRef, cleanData);
    }

    clearForm() {
        const form = document.getElementById('nominationForm');
        form.reset();
        this.currentSection = 1;
        this.showSection(1);
        this.updateProgress();
        this.updateNavigationButtons();
        
        // Clear file previews
        document.getElementById('profilePreview').classList.remove('show');
        
        // Clear any error messages
        this.clearErrorMessages();
    }

    startNewNomination() {
        // Clear the form for a new nomination
        this.clearForm();
        
        // Hide summary and show form
        document.getElementById('nominationsSummary').style.display = 'none';
        document.getElementById('nominationForm').style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Clear any selection
        this.selectedNominationIndex = -1;
    }

    showNominationsSummary() {
        const summary = document.getElementById('nominationsSummary');
        const nominationsList = document.getElementById('nominationsList');
        
        // Hide the form
        document.getElementById('nominationForm').style.display = 'none';
        
        // Show the summary
        summary.style.display = 'block';
        
        // Populate the nominations list
        nominationsList.innerHTML = '';
        this.nominations.forEach((nomination, index) => {
            const nominationItem = document.createElement('div');
            nominationItem.className = 'nomination-item';
            nominationItem.dataset.index = index;
            
            nominationItem.innerHTML = `
                <h4>${nomination.firstName} ${nomination.surname}</h4>
                <p><strong>Position:</strong> ${this.formatPositionName(nomination.positionNominated)}</p>
                <p><strong>Job Title:</strong> ${nomination.jobTitle}</p>
                <p><strong>Organization:</strong> ${nomination.membershipNumber}</p>
                <div class="nomination-meta">
                    <span class="nomination-number">Nomination #${index + 1}</span>
                    <span class="nomination-status">Ready to Submit</span>
                </div>
            `;
            
            nominationItem.addEventListener('click', () => this.selectNomination(index));
            nominationsList.appendChild(nominationItem);
        });
        
        // Reset button states
        document.getElementById('editNominationBtn').disabled = true;
        document.getElementById('removeNominationBtn').disabled = true;
        this.selectedNominationIndex = -1;
        
        // Scroll to summary
        summary.scrollIntoView({ behavior: 'smooth' });
    }

    selectNomination(index) {
        // Remove previous selection
        document.querySelectorAll('.nomination-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Select current nomination
        document.querySelector(`[data-index="${index}"]`).classList.add('selected');
        this.selectedNominationIndex = index;
        
        // Enable edit/remove buttons
        document.getElementById('editNominationBtn').disabled = false;
        document.getElementById('removeNominationBtn').disabled = false;
    }

    editSelectedNomination() {
        if (this.selectedNominationIndex === -1) {
            this.showErrorMessage('Please select a nomination to edit.');
            return;
        }
        
        // Load the selected nomination data into the form
        const nomination = this.nominations[this.selectedNominationIndex];
        this.loadNominationIntoForm(nomination);
        this.isEditing = true;
        this.editingIndex = this.selectedNominationIndex;
        this.currentSection = this.totalSections;
        this.updateNavigationButtons();
        
        // Hide summary and show form
        document.getElementById('nominationsSummary').style.display = 'none';
        document.getElementById('nominationForm').style.display = 'block';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    removeSelectedNomination() {
        if (this.selectedNominationIndex === -1) {
            this.showErrorMessage('Please select a nomination to remove.');
            return;
        }
        
        if (confirm('Are you sure you want to remove this nomination?')) {
            this.nominations.splice(this.selectedNominationIndex, 1);
            this.selectedNominationIndex = -1;
            this.saveNominationsToLocalStorage();
            
            if (this.nominations.length === 0) {
                // No more nominations, go back to form
                document.getElementById('nominationsSummary').style.display = 'none';
                document.getElementById('nominationForm').style.display = 'block';
            } else {
                // Refresh the summary
                this.showNominationsSummary();
            }
        }
    }

    loadNominationIntoForm(nomination) {
        // Reset the form first
        const form = document.getElementById('nominationForm');
        form.reset();

        // Populate standard inputs and radios
        Object.keys(nomination).forEach(key => {
            const elements = document.querySelectorAll(`[name="${key}"]`);
            if (!elements || elements.length === 0) return;

            const value = nomination[key];

            // Radio group
            if (elements[0].type === 'radio') {
                elements.forEach(el => {
                    el.checked = (el.value === value);
                });
                return;
            }

            // Skip file inputs
            if (elements[0].type === 'file') return;

            if (elements.length === 1 && !Array.isArray(value)) {
                elements[0].value = value || '';
            }
        });

        // Populate membership table arrays
        this.populateMembershipTable(
            nomination.membershipInstitution,
            nomination.membershipDesignation,
            nomination.membershipNumber
        );

        // Derived UI
        this.updateAcceptanceStatus();
        this.updateAcceptanceText();
    }

    populateMembershipTable(institutions, designations, numbers) {
        const body = document.getElementById('membershipTableBody');
        if (!body) return;

        // Clear existing rows
        while (body.firstChild) {
            body.removeChild(body.firstChild);
        }

        const rows = Math.max(
            Array.isArray(institutions) ? institutions.length : 0,
            Array.isArray(designations) ? designations.length : 0,
            Array.isArray(numbers) ? numbers.length : 0,
            1
        );

        for (let i = 0; i < rows; i++) {
            const tr = document.createElement('tr');
            const instVal = Array.isArray(institutions) ? (institutions[i] || '') : '';
            const desigVal = Array.isArray(designations) ? (designations[i] || '') : '';
            const numVal = Array.isArray(numbers) ? (numbers[i] || '') : '';
            tr.innerHTML = `
                <td><input type=\"text\" name=\"membershipInstitution[]\" placeholder=\"Institution name\" value=\"${instVal}\"></td>
                <td><input type=\"text\" name=\"membershipDesignation[]\" placeholder=\"Designation\" value=\"${desigVal}\"></td>
                <td><input type=\"text\" name=\"membershipNumber[]\" placeholder=\"Membership number\" value=\"${numVal}\"></td>
                <td><button type=\"button\" class=\"btn-remove-membership\" onclick=\"removeMembershipRow(this)\">Remove</button></td>
            `;
            body.appendChild(tr);
        }
    }

    saveNominationsToLocalStorage() {
        try {
            localStorage.setItem('sasce_nominations', JSON.stringify(this.nominations || []));
        } catch (e) {
            // no-op
        }
    }

    formatPositionName(position) {
        const positionMap = {
            'president': 'President',
            'deputy-president': 'Deputy President',
            'general-secretary': 'General Secretary',
            'deputy-general-secretary': 'Deputy General Secretary',
            'treasurer': 'Treasurer',
            'deputy-treasurer': 'Deputy Treasurer'
        };
        return positionMap[position] || position;
    }

    showSuccessMessage() {
        const summary = document.getElementById('nominationsSummary');
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message show';
        successMessage.innerHTML = `
            <h3><i class="fas fa-check-circle"></i> All Nominations Submitted Successfully!</h3>
            <p>Thank you for your nominations. We have received ${this.nominations.length} nomination(s) and will process them according to our procedures.</p>
            <p>You will receive a confirmation email shortly.</p>
        `;
        
        summary.parentNode.insertBefore(successMessage, summary);
        summary.style.display = 'none';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showErrorMessage(message) {
        const currentSection = document.getElementById(`section${this.currentSection}`);
        let errorElement = currentSection.querySelector('.section-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'section-error error-message';
            currentSection.querySelector('.section-content').prepend(errorElement);
        }
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Initialize the form when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.nominationFormInstance = new NominationForm();
    initCountdownTimer();
});

// Countdown Timer Function
function initCountdownTimer() {
    // Set the target date to November 14, 2025 at 12:00 (noon)
    const targetDate = new Date('2025-11-14T12:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        // Calculate time units
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Update the display
        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
        
        // If countdown is over
        if (distance < 0) {
            document.getElementById('countdownDisplay').innerHTML = '<div style="text-align: center; font-size: 1.5rem; opacity: 0.9;">Nominations have closed</div>';
        }
    }
    
    // Update immediately and then every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Add some utility functions for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for better navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // Add loading states to file inputs
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function() {
            if (this.files.length > 0) {
                this.style.borderColor = '#27ae60';
            }
        });
    });
    
        // Auto-save nominations to localStorage
        const form = document.getElementById('nominationForm');
        if (form) {
            // Save nominations array on changes
            const saveNominations = () => {
                localStorage.setItem('sasce_nominations', JSON.stringify(window.nominationFormInstance?.nominations || []));
            };
            
            // Load saved nominations on page load
            const savedNominations = localStorage.getItem('sasce_nominations');
            if (savedNominations) {
                try {
                    const nominations = JSON.parse(savedNominations);
                    if (window.nominationFormInstance && nominations.length > 0) {
                        window.nominationFormInstance.nominations = nominations;
                        window.nominationFormInstance.showNominationsSummary();
                    }
                } catch (e) {
                    console.log('No valid saved nominations found');
                }
            }
            
            // Clear saved data on successful submission
            const clearSavedData = () => {
                localStorage.removeItem('sasce_nominations');
            };
            
            // Override the showSuccessMessage to clear saved data
            const originalShowSuccessMessage = window.nominationFormInstance?.showSuccessMessage;
            if (originalShowSuccessMessage) {
                window.nominationFormInstance.showSuccessMessage = function() {
                    clearSavedData();
                    originalShowSuccessMessage.call(this);
                };
            }
        }
});
