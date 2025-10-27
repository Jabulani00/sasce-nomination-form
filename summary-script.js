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
        this.initializeEventListeners();
        this.loadElectionData();
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
            if (data.status === 'approved') {
                this.candidates.push({
                    id: doc.id,
                    candidateName: `${data.firstName} ${data.surname}`,
                    position: data.positionNominated,
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

    renderVotersTable() {
        const tbody = document.getElementById('votersTableBody');
        
        if (this.voters.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="loading-row">
                        <i class="fas fa-inbox"></i>
                        <h3>No voters found</h3>
                        <p>No votes have been cast yet.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.voters.map(voter => `
            <tr>
                <td>${voter.voterName}</td>
                <td>${voter.voterEmail}</td>
                <td>${voter.voterMembership}</td>
                <td><span class="vote-status voted">Voted</span></td>
                <td>${this.formatDate(voter.submittedAt)}</td>
                <td>${voter.ipAddress || 'N/A'}</td>
            </tr>
        `).join('');
    }

    filterVoters() {
        const searchTerm = document.getElementById('voterSearch').value.toLowerCase();
        const filterValue = document.getElementById('voterFilter').value;
        
        const filteredVoters = this.voters.filter(voter => {
            const matchesSearch = !searchTerm || 
                voter.voterName.toLowerCase().includes(searchTerm) ||
                voter.voterEmail.toLowerCase().includes(searchTerm) ||
                voter.voterMembership.toLowerCase().includes(searchTerm);
            
            const matchesFilter = !filterValue || 
                (filterValue === 'voted' && voter.votes) ||
                (filterValue === 'not-voted' && !voter.votes);
            
            return matchesSearch && matchesFilter;
        });
        
        const tbody = document.getElementById('votersTableBody');
        tbody.innerHTML = filteredVoters.map(voter => `
            <tr>
                <td>${voter.voterName}</td>
                <td>${voter.voterEmail}</td>
                <td>${voter.voterMembership}</td>
                <td><span class="vote-status voted">Voted</span></td>
                <td>${this.formatDate(voter.submittedAt)}</td>
                <td>${voter.ipAddress || 'N/A'}</td>
            </tr>
        `).join('');
    }

    exportVoters() {
        if (this.voters.length === 0) {
            this.showError('No voter data to export.');
            return;
        }
        
        const excelData = this.voters.map(voter => ({
            'Voter Name': voter.voterName,
            'Email': voter.voterEmail,
            'Membership': voter.voterMembership,
            'Vote Status': 'Voted',
            'Voted At': this.formatDate(voter.submittedAt),
            'IP Address': voter.ipAddress || 'N/A',
            'Votes Cast': Object.keys(voter.votes).length
        }));
        
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
