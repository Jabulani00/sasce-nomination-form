// Ballot Management System
class BallotSystem {
    constructor() {
        this.candidates = [];
        this.votes = {};
        this.voterInfo = {};
        // Configurable placeholder image for candidates without a profile photo
        // You can override via window.CANDIDATE_PLACEHOLDER_URL before DOMContentLoaded
        this.placeholderImageUrl = (window && window.CANDIDATE_PLACEHOLDER_URL) ||
            // Inline SVG data URI (accessible, no external request). Replace with your Flaticon URL if desired.
            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24" fill="none" stroke="%233A6B9C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>';
        this.positions = [
            'president',
            'deputy-president', 
            'general-secretary',
            'deputy-general-secretary',
            'treasurer',
            'deputy-treasurer'
        ];
        this.tokenData = null;
        this.restrictedPosition = null;
        this.openPositions = {};
        this.initializeEventListeners();
        this.checkUrlToken();
        this.listenToVotingOpenSettings();
        this.loadCandidates();
    }

    checkUrlToken() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        // CRITICAL: Block all access without a valid token (position not required)
        if (!token) {
            this.showAccessDenied();
            return;
        }
        
        // Decode token to get voter info
        try {
            const decoded = atob(token);
            // Extract voter info from the token
            // Note: In a real implementation, you'd validate this against a database
            // For now, we'll store the token (no position restriction)
            this.tokenData = { token };
            this.restrictedPosition = null;
            
            // Load voter info from token - you may need to fetch from Firestore
            this.loadVoterInfoFromToken(token);
        } catch (error) {
            console.error('Invalid token:', error);
            this.showAccessDenied();
        }
    }

    async listenToVotingOpenSettings() {
        try {
            const { getFirestore, doc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const db = getFirestore();
            const settingsRef = doc(db, 'voting_settings', 'positions');
            onSnapshot(settingsRef, (snapshot) => {
                const data = snapshot.data() || {};
                this.openPositions = { ...data };
                this.renderCandidates();
            });
        } catch (e) {
            console.error('Failed to listen to voting settings', e);
        }
    }

    showAccessDenied() {
        // Hide everything and show access denied message
        const allElements = document.querySelectorAll('.ballot-container > *');
        allElements.forEach(el => {
            if (el.id !== 'accessDeniedOverlay' && el.id !== 'loadingOverlay') {
                el.style.display = 'none';
            }
        });
        document.getElementById('accessDeniedOverlay').style.display = 'flex';
    }

    async loadVoterInfoFromToken(token) {
        // In a production environment, you would validate this token against your database
        // For now, we'll decode basic info from the token
        try {
            const { getFirestore, collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const db = getFirestore();
            
        // We need to find the voter that matches this token
        // Tokens may have been encoded with (email+position+organization) or (email+organization)
            const votersRef = collection(db, 'sasce_voters');
            const votersQuery = query(votersRef, where('status', '==', 'Approved'));
            const querySnapshot = await getDocs(votersQuery);
            
            let voterFound = false;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.voters && Array.isArray(data.voters)) {
                    data.voters.forEach(voter => {
                        const candidateTokens = [];
                        // Legacy tokens per-position
                        this.positions.forEach(pos => {
                            candidateTokens.push(
                                btoa(`${voter.email}${pos}${data.organization}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
                            );
                        });
                        // New token without position
                        candidateTokens.push(
                            btoa(`${voter.email}${data.organization}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32)
                        );
                        if (candidateTokens.includes(token)) {
                            voterFound = true;
                            // Auto-fill voter information
                            document.getElementById('voterName').value = voter.name;
                            document.getElementById('voterEmail').value = voter.email;
                            document.getElementById('voterMembership').value = data.organization || data.membershipNumber;
                            
                            // Make fields readonly since they're pre-filled
                            document.getElementById('voterName').readOnly = true;
                            document.getElementById('voterEmail').readOnly = true;
                            document.getElementById('voterMembership').readOnly = true;
                            
                            // Store voter info
                            this.voterInfo = {
                                name: voter.name,
                                email: voter.email,
                                membership: data.organization || data.membershipNumber,
                                token: token
                            };
                        }
                    });
                }
            });
            
            if (!voterFound) {
                this.showError('Voter information not found. Please use the link provided in your email.');
            }
        } catch (error) {
            console.error('Error loading voter info:', error);
            this.showError('Failed to verify voting credentials.');
        }
    }

    initializeEventListeners() {
        // Form submission
        document.getElementById('ballotForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.showVoteConfirmation();
        });

        // Review votes button
        document.getElementById('reviewVotesBtn').addEventListener('click', () => {
            this.updateVoteSummary();
            this.showVoteConfirmation();
        });

        // Modal controls
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelVoteBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('confirmVoteBtn').addEventListener('click', () => this.submitVote());

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('voteConfirmationModal');
            if (event.target === modal) {
                this.closeModal();
            }
        });

        // Real-time vote summary updates
        document.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                this.updateVoteSummary();
            }
        });
    }

    async loadCandidates() {
        this.showLoading(true);
        
        try {
            const { getFirestore, collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const db = getFirestore();
            const nominationsRef = collection(db, 'nominations');
            
            // Query all nominations ordered by submission date (same as admin)
            const q = query(nominationsRef, orderBy('submittedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            this.candidates = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                
                // Show only candidates approved by admin and accepted by nominee
                if (data.status === 'approved' && data.acceptanceStatus === 'Accepted') {
                    this.candidates.push({
                        id: doc.id,
                        candidateName: `${data.firstName} ${data.surname}`,
                        position: data.positionNominated,
                        organization: data.membershipNumber,
                        jobTitle: data.jobTitle,
                        currentRoles: data.currentRoles,
                        qualifications: data.qualifications,
                        highlightsAwards: data.highlightsAwards,
                        cvBioText: data.cvBioText,
                        cvBioLink: data.cvBioLink,
                        profilePictureFileName: data.profilePictureFileName,
                        cvBioFileName: data.cvBioFileName,
                        profilePictureBase64: data.profilePictureBase64, // Store base64 image
                        submittedAt: data.submittedAt,
                        votes: data.votes || 0 // Get existing vote count or default to 0
                    });
                }
            });
            
            this.renderCandidates();
            
        } catch (error) {
            console.error('Error loading candidates:', error);
            this.showError('Failed to load candidates. Please refresh the page.');
        } finally {
            this.showLoading(false);
        }
    }

    renderCandidates() {
        this.positions.forEach(position => {
            const container = document.getElementById(`${position}-candidates`);
            const section = document.getElementById(`${position}-section`);
            
            // Always show all sections
            if (section) section.style.display = '';
            
            const positionCandidates = this.candidates.filter(c => c.position === position);
            
            if (positionCandidates.length === 0) {
                container.innerHTML = `
                    <div class="no-candidates">
                        <i class="fas fa-user-slash"></i>
                        <h3>No Candidates</h3>
                        <p>No candidates have been added to the ballot for this position yet.</p>
                    </div>
                `;
                return;
            }
            
            const isOpen = !!this.openPositions[position];
            container.innerHTML = positionCandidates.map(candidate => {
                const otherPositions = this.getOtherPositionsForCandidate(candidate, position);
                const alsoContestingHtml = otherPositions.length > 0
                    ? `<p><strong>Also contesting:</strong> ${otherPositions.map(p => this.formatPositionName(p)).join(', ')}</p>`
                    : '';

                return `
                <div class="candidate-card ${isOpen ? '' : 'disabled'}" ${isOpen ? `onclick=\"ballotSystem.selectCandidate('${position}', '${candidate.id}')\"` : ''}>
                    <input type="radio" name="${position}" value="${candidate.id}" id="${candidate.id}" ${isOpen ? '' : 'disabled'}>
                    <div class="radio-indicator"></div>
                    <div class="candidate-profile">
                        <div class="candidate-image">
                            ${candidate.profilePictureBase64 ? 
                                `<img src="${candidate.profilePictureBase64}" alt="${candidate.candidateName}" class="profile-img">` : 
                                `<img src="${this.placeholderImageUrl}" alt="${candidate.candidateName} placeholder" class="profile-img" loading="lazy">`
                            }
                        </div>
                        <div class="candidate-info">
                            <div class="candidate-name">${candidate.candidateName}</div>
                            <div class="candidate-organization">${candidate.organization || 'N/A'}</div>
                            <div class="candidate-job">${candidate.jobTitle || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="candidate-details">
                        <h4>Candidate Information</h4>
                        <p><strong>Organization:</strong> ${candidate.organization || 'N/A'}</p>
                        <p><strong>Job Title:</strong> ${candidate.jobTitle || 'N/A'}</p>
                        ${candidate.currentRoles ? `<p><strong>Current Roles:</strong> ${candidate.currentRoles.substring(0, 100)}${candidate.currentRoles.length > 100 ? '...' : ''}</p>` : ''}
                        ${candidate.qualifications ? `<p><strong>Qualifications:</strong> ${candidate.qualifications.substring(0, 100)}${candidate.qualifications.length > 100 ? '...' : ''}</p>` : ''}
                        ${alsoContestingHtml}
                        ${isOpen ? '' : `<div class=\"position-locked\"><i class=\"fas fa-lock\"></i> Voting for ${this.formatPositionName(position)} is not open yet.</div>`}
                    </div>
                </div>
            `;
            }).join('');
        });
        
        // Always show voting summary
    }

    getOtherPositionsForCandidate(candidate, currentPosition) {
        const normalizedName = (candidate.candidateName || '').trim().toLowerCase();
        const normalizedOrg = (candidate.organization || '').trim().toLowerCase();
        const positions = new Set();
        this.candidates.forEach(c => {
            const sameName = (c.candidateName || '').trim().toLowerCase() === normalizedName;
            const sameOrg = (c.organization || '').trim().toLowerCase() === normalizedOrg;
            if (sameName && sameOrg && c.position !== currentPosition) {
                positions.add(c.position);
            }
        });
        return Array.from(positions);
    }

    selectCandidate(position, candidateId) {
        // Remove previous selection for this position
        const previousSelected = document.querySelector(`input[name="${position}"]:checked`);
        if (previousSelected) {
            previousSelected.closest('.candidate-card').classList.remove('selected');
        }
        
        // Select new candidate
        const candidateCard = document.getElementById(candidateId).closest('.candidate-card');
        const radioButton = document.getElementById(candidateId);
        
        radioButton.checked = true;
        candidateCard.classList.add('selected');
        
        // Update votes object
        this.votes[position] = candidateId;
        
        this.updateVoteSummary();
    }

    updateVoteSummary() {
        const summaryContainer = document.getElementById('voteSummary');
        
        // If restricted to one position, only show that position
        const positionsToShow = this.restrictedPosition ? [this.restrictedPosition] : this.positions;
        
        const summaryHTML = positionsToShow.map(position => {
            const selectedCandidate = this.votes[position];
            const candidate = selectedCandidate ? this.candidates.find(c => c.id === selectedCandidate) : null;
            
            return `
                <div class="vote-item">
                    <span class="vote-position">${this.formatPositionName(position)}:</span>
                    <span class="vote-candidate">${candidate ? candidate.candidateName : '<span class="no-vote">No vote cast</span>'}</span>
                </div>
            `;
        }).join('');
        
        summaryContainer.innerHTML = summaryHTML;
    }

    showVoteConfirmation() {
        // Validate voter information
        const voterName = document.getElementById('voterName').value.trim();
        const voterEmail = document.getElementById('voterEmail').value.trim();
        const voterMembership = document.getElementById('voterMembership').value.trim();
        
        if (!voterName || !voterEmail || !voterMembership) {
            this.showError('Please fill in all voter information fields.');
            return;
        }
        
        // Check if at least one vote is cast
        const hasVotes = Object.keys(this.votes).length > 0;
        if (!hasVotes) {
            this.showError('Please cast at least one vote before submitting.');
            return;
        }
        
        // Store voter info
        this.voterInfo = {
            name: voterName,
            email: voterEmail,
            membership: voterMembership,
            votedAt: new Date()
        };
        
        // Show confirmation modal
        this.showConfirmationModal();
    }

    showConfirmationModal() {
        const modalBody = document.getElementById('confirmationBody');
        
        const confirmationHTML = `
            <div class="voter-info">
                <h4><i class="fas fa-user"></i> Voter Information</h4>
                <p><strong>Name:</strong> ${this.voterInfo.name}</p>
                <p><strong>Email:</strong> ${this.voterInfo.email}</p>
                <p><strong>Membership:</strong> ${this.voterInfo.membership}</p>
            </div>
            
            <div class="vote-confirmation">
                <h4><i class="fas fa-vote-yea"></i> Your Votes</h4>
                ${(this.restrictedPosition ? [this.restrictedPosition] : this.positions).map(position => {
                    const selectedCandidate = this.votes[position];
                    const candidate = selectedCandidate ? this.candidates.find(c => c.id === selectedCandidate) : null;
                    
                    if (!candidate) {
                        return `
                            <div class="confirmation-vote">
                                <strong>${this.formatPositionName(position)}:</strong>
                                <span class="no-vote">No vote</span>
                            </div>
                        `;
                    }
                    
                    const otherPositions = this.getOtherPositionsForCandidate(candidate, position);
                    const alsoContestingInline = otherPositions.length > 0
                        ? `<div class="candidate-roles"><strong>Also contesting:</strong> ${otherPositions.map(p => this.formatPositionName(p)).join(', ')}</div>`
                        : '';

                    return `
                        <div class="confirmation-vote-item">
                            <div class="vote-position">
                                <strong>${this.formatPositionName(position)}:</strong>
                            </div>
                            <div class="candidate-confirmation">
                                <div class="candidate-image">
                                    ${candidate.profilePictureBase64 ? 
                                        `<img src="${candidate.profilePictureBase64}" alt="${candidate.candidateName}" class="profile-img">` : 
                                        `<img src="${this.placeholderImageUrl}" alt="${candidate.candidateName} placeholder" class="profile-img" loading="lazy">`
                                    }
                                </div>
                                <div class="candidate-info">
                                    <div class="candidate-name">${candidate.candidateName}</div>
                                    <div class="candidate-org">${candidate.organization || 'N/A'}</div>
                                    <div class="candidate-job">${candidate.jobTitle || 'N/A'}</div>
                                    ${candidate.currentRoles ? `<div class="candidate-roles"><strong>Current Roles:</strong> ${candidate.currentRoles.substring(0, 150)}${candidate.currentRoles.length > 150 ? '...' : ''}</div>` : ''}
                                    ${alsoContestingInline}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="confirmation-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <p><strong>Important:</strong> Once you confirm and submit your ballot, you cannot change your votes. Please review your selections carefully.</p>
            </div>
        `;
        
        modalBody.innerHTML = confirmationHTML;
        this.openModal();
    }

    async submitVote() {
        this.showLoading(true);
        
        try {
            const { getFirestore, collection, addDoc, doc, updateDoc, increment, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const db = getFirestore();
            
            // Check if voter has already voted
            const votesRef = collection(db, 'votes');
            const existingVoteQuery = await getDocs(query(votesRef, where('voterEmail', '==', this.voterInfo.email)));
            
            if (!existingVoteQuery.empty) {
                this.showError('You have already cast your vote. Each voter can only vote once.');
                this.closeModal();
                return;
            }
            
            // Submit the vote
            await addDoc(votesRef, {
                voterName: this.voterInfo.name,
                voterEmail: this.voterInfo.email,
                voterMembership: this.voterInfo.membership,
                votes: this.votes,
                submittedAt: new Date(),
                ipAddress: await this.getClientIP()
            });
            
            // Update vote counts for each candidate in the nominations collection
            for (const [position, candidateId] of Object.entries(this.votes)) {
                const nominationRef = doc(db, 'nominations', candidateId);
                await updateDoc(nominationRef, {
                    votes: increment(1),
                    lastVotedAt: new Date()
                });
            }
            
            this.closeModal();
            this.showSuccess('Your vote has been successfully submitted! Thank you for participating in the SASCE election.');
            
            // Disable the form
            this.disableForm();
            
        } catch (error) {
            console.error('Error submitting vote:', error);
            this.showError('Failed to submit your vote. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    disableForm() {
        // Disable all form elements
        const form = document.getElementById('ballotForm');
        const inputs = form.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        // Hide submit button and show success message
        document.getElementById('submitBallotBtn').style.display = 'none';
        document.getElementById('reviewVotesBtn').style.display = 'none';
        
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div>
                <h3>Vote Submitted Successfully!</h3>
                <p>Thank you for participating in the SASCE 2025 election. Your vote has been recorded.</p>
            </div>
        `;
        
        form.insertBefore(successMessage, form.firstChild);
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

    openModal() {
        document.getElementById('voteConfirmationModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('voteConfirmationModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'block' : 'none';
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Initialize ballot system when page loads
let ballotSystem;
document.addEventListener('DOMContentLoaded', () => {
    ballotSystem = new BallotSystem();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .voter-info, .vote-confirmation {
        margin-bottom: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .voter-info h4, .vote-confirmation h4 {
        color: #2c3e50;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .confirmation-vote {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e9ecef;
    }
    
    .confirmation-vote:last-child {
        border-bottom: none;
    }
    
    .confirmation-warning {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
        padding: 15px;
        border-radius: 8px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }
    
    .confirmation-warning i {
        color: #f39c12;
        margin-top: 2px;
    }
`;
document.head.appendChild(style);
