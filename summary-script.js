// Election Summary & Vote Counting System
class ElectionSummary {
    constructor() {
        this.candidates = [];
        this.voters = [];
        this.positions = [
            'president',
            'deputy-president',
            'general-secretary',
            'deputy-general-secretary',
            'treasurer',
            'deputy-treasurer'
        ];
        this.positionNormalizeMap = {
            'president': 'president',
            'deputy-president': 'deputy-president',
            'deputy president': 'deputy-president',
            'deputy_president': 'deputy-president',
            'general-secretary': 'general-secretary',
            'general secretary': 'general-secretary',
            'general_secretary': 'general-secretary',
            'General Secretary': 'general-secretary',
            'deputy-general-secretary': 'deputy-general-secretary',
            'deputy general secretary': 'deputy-general-secretary',
            'deputy_general_secretary': 'deputy-general-secretary',
            'Deputy General Secretary': 'deputy-general-secretary',
            'treasurer': 'treasurer',
            'deputy-treasurer': 'deputy-treasurer',
            'deputy treasurer': 'deputy-treasurer',
            'deputy_treasurer': 'deputy-treasurer',
            'Deputy Treasurer': 'deputy-treasurer'
        };
        this.initializeEventListeners();
        this.loadElectionData();
    }

    normalizePositionId(positionNominated) {
        if (!positionNominated) return null;
        const s = String(positionNominated).trim();
        if (this.positionNormalizeMap[s]) return this.positionNormalizeMap[s];
        const lower = s.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-');
        return this.positionNormalizeMap[lower] || (this.positions.includes(lower) ? lower : null);
    }

    initializeEventListeners() {
        // Refresh button
        document.getElementById('refreshDataBtn').addEventListener('click', () => {
            this.loadElectionData();
        });

        // Export buttons
        document.getElementById('exportVotersBtn').addEventListener('click', () => this.exportVoters());
        document.getElementById('exportResultsBtn').addEventListener('click', () => this.exportResults());

        // Search and filter
        document.getElementById('voterSearch').addEventListener('input', () => this.filterVoters());
        document.getElementById('voterFilter').addEventListener('change', () => this.filterVoters());
    }

    async loadElectionData() {
        this.showLoading(true);
        
        try {
            await Promise.all([
                this.loadCandidates(),
                this.loadVoters()
            ]);
            
            this.updateStatistics();
            this.renderVoteCounting();
            this.renderVotersTable();
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Error loading election data:', error);
            this.showError('Failed to load election data. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadCandidates() {
        const { getFirestore, collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getFirestore();
        const nominationsRef = collection(db, 'nominations');
        
        const q = query(nominationsRef, orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        this.candidates = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.status === 'approved' && data.acceptanceStatus === 'Accepted') {
                const positionId = this.normalizePositionId(data.positionNominated) || data.positionNominated;
                this.candidates.push({
                    id: doc.id,
                    candidateName: `${data.firstName} ${data.surname}`,
                    position: positionId,
                    organization: data.membershipNumber,
                    jobTitle: data.jobTitle,
                    profilePictureBase64: data.profilePictureBase64,
                    votes: data.votes || 0,
                    submittedAt: data.submittedAt
                });
            }
        });
    }

    async loadVoters() {
        const { getFirestore, collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getFirestore();
        const votesRef = collection(db, 'votes');
        
        const q = query(votesRef, orderBy('submittedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        this.voters = [];
        querySnapshot.forEach((doc) => {
            this.voters.push({
                id: doc.id,
                ...doc.data()
            });
        });
    }

    updateStatistics() {
        const totalVoters = this.voters.length;
        const totalVotes = this.voters.reduce((sum, voter) => sum + Object.keys(voter.votes).length, 0);
        const approvedCandidates = this.candidates.length;
        
        // Calculate voter turnout (assuming we have a total member count)
        // For now, we'll use a placeholder calculation
        const voterTurnout = totalVoters > 0 ? Math.round((totalVoters / 100) * 100) : 0; // Placeholder calculation
        
        document.getElementById('totalVoters').textContent = totalVoters;
        document.getElementById('totalVotes').textContent = totalVotes;
        document.getElementById('voterTurnout').textContent = voterTurnout + '%';
        document.getElementById('approvedCandidates').textContent = approvedCandidates;
    }

    renderVoteCounting() {
        this.positions.forEach(position => {
            const container = document.getElementById(`${position}-candidates-counting`);
            const totalVotesElement = document.getElementById(`${position}-total-votes`);
            const positionCandidates = this.candidates.filter(c => c.position === position);
            
            if (positionCandidates.length === 0) {
                container.innerHTML = `
                    <div class="no-candidates">
                        <i class="fas fa-user-slash"></i>
                        <h3>No Candidates</h3>
                        <p>No approved candidates for this position.</p>
                    </div>
                `;
                totalVotesElement.textContent = '0';
                return;
            }
            
            // Sort candidates by vote count (descending)
            const sortedCandidates = positionCandidates.sort((a, b) => b.votes - a.votes);
            const totalVotes = sortedCandidates.reduce((sum, candidate) => sum + candidate.votes, 0);
            
            totalVotesElement.textContent = totalVotes;
            
            container.innerHTML = sortedCandidates.map((candidate, index) => {
                const percentage = totalVotes > 0 ? Math.round((candidate.votes / totalVotes) * 100) : 0;
                const isWinner = index === 0 && candidate.votes > 0;
                
                return `
                    <div class="candidate-counting ${isWinner ? 'winner' : ''}">
                        <div class="candidate-counting-image">
                            ${candidate.profilePictureBase64 ? 
                                `<img src="${candidate.profilePictureBase64}" alt="${candidate.candidateName}" class="profile-img">` : 
                                `<div class="no-image"><i class="fas fa-user"></i></div>`
                            }
                        </div>
                        <div class="candidate-counting-info">
                            <div class="candidate-counting-name">${candidate.candidateName}</div>
                            <div class="candidate-counting-org">${candidate.organization || 'N/A'}</div>
                        </div>
                        <div class="candidate-counting-votes">
                            <div class="vote-count">${candidate.votes}</div>
                            <div class="vote-percentage">${percentage}%</div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        });
    }

    renderVoterCard(voter) {
        const votesHtml = this.getVotesDisplayForVoter(voter);
        const voteCount = voter.votes ? Object.keys(voter.votes).length : 0;
        return `
            <details class="voter-card" data-voter-id="${voter.id || ''}">
                <summary class="voter-card__summary">
                    <span class="voter-card__avatar"><i class="fas fa-user"></i></span>
                    <div class="voter-card__primary">
                        <span class="voter-card__name">${this.escapeHtml(voter.voterName)}</span>
                        <span class="voter-card__meta">${this.escapeHtml(voter.voterEmail)} · ${this.escapeHtml(voter.voterMembership)}</span>
                    </div>
                    <span class="voter-card__badge vote-status voted">Voted</span>
                    <span class="voter-card__votes-count">${voteCount} vote${voteCount !== 1 ? 's' : ''}</span>
                    <i class="voter-card__chevron fas fa-chevron-down" aria-hidden="true"></i>
                </summary>
                <div class="voter-card__expandable">
                    <div class="voter-card__info-grid">
                        <div class="voter-card__info-item">
                            <span class="voter-card__info-label">Email</span>
                            <span class="voter-card__info-value">${this.escapeHtml(voter.voterEmail)}</span>
                        </div>
                        <div class="voter-card__info-item">
                            <span class="voter-card__info-label">Membership</span>
                            <span class="voter-card__info-value">${this.escapeHtml(voter.voterMembership)}</span>
                        </div>
                        <div class="voter-card__info-item">
                            <span class="voter-card__info-label">Voted at</span>
                            <span class="voter-card__info-value">${this.formatDate(voter.submittedAt)}</span>
                        </div>
                        <div class="voter-card__info-item">
                            <span class="voter-card__info-label">IP Address</span>
                            <span class="voter-card__info-value">${voter.ipAddress || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="voter-card__votes-section">
                        <h4 class="voter-card__votes-title"><i class="fas fa-vote-yea"></i> Who they voted for</h4>
                        <div class="voter-card__votes-content">${votesHtml}</div>
                    </div>
                </div>
            </details>
        `;
    }

    escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    renderVotersTable() {
        const container = document.getElementById('votersListBody');
        const loadingEl = document.getElementById('votersLoadingState');
        
        if (loadingEl) loadingEl.style.display = 'none';
        
        if (this.voters.length === 0) {
            container.innerHTML = `
                <div class="voters-empty">
                    <i class="fas fa-inbox"></i>
                    <h3>No voters found</h3>
                    <p>No votes have been cast yet.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.voters.map(voter => this.renderVoterCard(voter)).join('');
    }

    filterVoters() {
        const searchTerm = document.getElementById('voterSearch').value.toLowerCase();
        const filterValue = document.getElementById('voterFilter').value;
        
        const filteredVoters = this.voters.filter(voter => {
            const matchesSearch = !searchTerm || 
                voter.voterName.toLowerCase().includes(searchTerm) ||
                voter.voterEmail.toLowerCase().includes(searchTerm) ||
                (voter.voterMembership && voter.voterMembership.toLowerCase().includes(searchTerm));
            
            const matchesFilter = !filterValue || 
                (filterValue === 'voted' && voter.votes) ||
                (filterValue === 'not-voted' && !voter.votes);
            
            return matchesSearch && matchesFilter;
        });
        
        const container = document.getElementById('votersListBody');
        const loadingEl = document.getElementById('votersLoadingState');
        if (loadingEl) loadingEl.style.display = 'none';
        
        if (filteredVoters.length === 0) {
            container.innerHTML = `
                <div class="voters-empty">
                    <i class="fas fa-search"></i>
                    <h3>No matching voters</h3>
                    <p>Try adjusting your search or filter.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredVoters.map(voter => this.renderVoterCard(voter)).join('');
    }

    exportVoters() {
        if (this.voters.length === 0) {
            this.showError('No voter data to export.');
            return;
        }
        
        const excelData = this.voters.map(voter => {
            const votes = voter.votes || {};
            const whoVotedFor = this.positions
                .filter(pos => votes[pos])
                .map(pos => `${this.formatPositionName(pos)}: ${this.getCandidateNameById(votes[pos])}`)
                .join('; ') || 'No votes cast';
            return {
                'Voter Name': voter.voterName,
                'Email': voter.voterEmail,
                'Membership': voter.voterMembership,
                'Who They Voted For': whoVotedFor,
                'Vote Status': 'Voted',
                'Voted At': this.formatDate(voter.submittedAt),
                'IP Address': voter.ipAddress || 'N/A',
                'Votes Cast': Object.keys(votes).length
            };
        });
        
        this.exportToExcel(excelData, 'SASCE_Voters');
    }

    exportResults() {
        if (this.candidates.length === 0) {
            this.showError('No candidate data to export.');
            return;
        }
        
        const excelData = this.candidates.map(candidate => ({
            'Candidate Name': candidate.candidateName,
            'Position': this.formatPositionName(candidate.position),
            'Organization': candidate.organization,
            'Job Title': candidate.jobTitle,
            'Votes Received': candidate.votes,
            'Submitted At': this.formatDate(candidate.submittedAt)
        }));
        
        this.exportToExcel(excelData, 'SASCE_Election_Results');
    }

    exportToExcel(data, filename) {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Set column widths
        const colWidths = Object.keys(data[0]).map(() => ({ wch: 20 }));
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const fullFilename = `${filename}_${dateStr}.xlsx`;
        
        XLSX.writeFile(wb, fullFilename);
        
        this.showSuccess(`Excel file exported successfully: ${fullFilename}`);
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

    getCandidateNameById(candidateId) {
        if (!candidateId) return '—';
        const candidate = this.candidates.find(c => c.id === candidateId);
        return candidate ? candidate.candidateName : 'Unknown';
    }

    getVotesDisplayForVoter(voter) {
        const votes = voter.votes || {};
        if (Object.keys(votes).length === 0) {
            return '<span class="no-votes">No votes cast</span>';
        }
        const items = this.positions
            .filter(pos => votes[pos])
            .map(pos => {
                const name = this.getCandidateNameById(votes[pos]);
                const positionLabel = this.formatPositionName(pos);
                return `<li class="vote-chip"><span class="vote-position">${positionLabel}</span><span class="vote-candidate">${name}</span></li>`;
            });
        if (items.length === 0) return '<span class="no-votes">No votes cast</span>';
        return '<ul class="voter-votes-list">' + items.join('') + '</ul>';
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = `Last updated: ${now.toLocaleTimeString()}`;
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

// Initialize election summary when page loads
let electionSummary;
document.addEventListener('DOMContentLoaded', () => {
    electionSummary = new ElectionSummary();
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
    
    .no-candidates {
        text-align: center;
        padding: 30px;
        color: #7f8c8d;
    }
    
    .no-candidates i {
        font-size: 2rem;
        margin-bottom: 10px;
        color: #bdc3c7;
    }
    
    .no-candidates h3 {
        margin-bottom: 5px;
        color: #2c3e50;
    }
    
    .no-candidates p {
        font-size: 0.9rem;
    }
`;
document.head.appendChild(style);
