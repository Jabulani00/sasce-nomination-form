// Admin Panel Management
class AdminPanel {
    constructor() {
        this.nominations = [];
        this.filteredNominations = [];
        this.currentNomination = null;
        this.initializeEventListeners();
        this.loadNominations();
    }

    async ensureAcceptanceToken(nominationId) {
        try {
            const { getFirestore, doc, getDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const db = getFirestore();
            const ref = doc(db, 'nominations', nominationId);
            const snapshot = await getDoc(ref);
            if (!snapshot.exists()) return null;
            const data = snapshot.data();
            if (data.acceptanceToken) return data.acceptanceToken;
            const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
            await updateDoc(ref, { acceptanceToken: token, updatedAt: new Date() });
            return token;
        } catch (e) {
            console.error('Error ensuring token', e);
            this.showError('Failed to generate acceptance link token.');
            return null;
        }
    }

    async copyAcceptanceLink(nominationId) {
        const token = await this.ensureAcceptanceToken(nominationId);
        if (!token) return;
        const base = 'https://sasce-nomination-form.vercel.app/accept.html';
        const url = `${base}?id=${encodeURIComponent(nominationId)}&token=${encodeURIComponent(token)}`;
        try {
            await navigator.clipboard.writeText(url);
            this.showSuccess('Acceptance link copied to clipboard');
        } catch (e) {
            this.showError('Could not copy link.');
        }
    }

    initializeEventListeners() {
        // Control buttons
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadNominations());
        document.getElementById('exportExcelBtn').addEventListener('click', () => this.exportToExcel());
        
        // Search and filters
        document.getElementById('searchInput').addEventListener('input', () => this.filterNominations());
        document.getElementById('positionFilter').addEventListener('change', () => this.filterNominations());
        document.getElementById('statusFilter').addEventListener('change', () => this.filterNominations());
        
        // Modal controls
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('approveBtn').addEventListener('click', () => this.updateNominationStatus('approved'));
        document.getElementById('rejectBtn').addEventListener('click', () => this.updateNominationStatus('rejected'));
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('nominationModal');
            if (event.target === modal) {
                this.closeModal();
            }
        });
    }

    async loadNominations() {
        this.showLoading(true);
        
        try {
            const { getFirestore, collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const db = getFirestore();
            const nominationsRef = collection(db, 'nominations');
            
            // Query nominations ordered by submission date
            const q = query(nominationsRef, orderBy('submittedAt', 'desc'));
            const querySnapshot = await getDocs(q);
            
            this.nominations = [];
            querySnapshot.forEach((doc) => {
                this.nominations.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.filteredNominations = [...this.nominations];
            this.updateStatistics();
            this.renderTable();
            
        } catch (error) {
            console.error('Error loading nominations:', error);
            this.showError('Failed to load nominations. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    filterNominations() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const positionFilter = document.getElementById('positionFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        this.filteredNominations = this.nominations.filter(nomination => {
            // Search filter
            const matchesSearch = !searchTerm || 
                nomination.firstName?.toLowerCase().includes(searchTerm) ||
                nomination.surname?.toLowerCase().includes(searchTerm) ||
                nomination.jobTitle?.toLowerCase().includes(searchTerm) ||
                nomination.membershipNumber?.toLowerCase().includes(searchTerm) ||
                nomination.nominatorFirstName?.toLowerCase().includes(searchTerm) ||
                nomination.nominatorSurname?.toLowerCase().includes(searchTerm);
            
            // Position filter
            const matchesPosition = !positionFilter || nomination.positionNominated === positionFilter;
            
            // Status filter
            const matchesStatus = !statusFilter || nomination.status === statusFilter;
            
            return matchesSearch && matchesPosition && matchesStatus;
        });
        
        this.renderTable();
    }

    renderTable() {
        const tbody = document.getElementById('tableBody');
        const tableInfo = document.getElementById('tableInfo');
        
        if (this.filteredNominations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No nominations found</h3>
                        <p>No nominations match your current filters.</p>
                    </td>
                </tr>
            `;
            tableInfo.textContent = 'No nominations found';
            return;
        }
        
        tbody.innerHTML = this.filteredNominations.map(nomination => {
            const acc = nomination.acceptanceStatus || 'Pending';
            const accClass = acc === 'Accepted' ? 'accepted' : (acc === 'Denied' ? 'rejected' : 'pending');
            const accCell = acc === 'Pending'
                ? `<span class="status-badge status-${accClass}" style="cursor:pointer" title="Copy acceptance link" onclick="adminPanel.copyAcceptanceLink('${nomination.id}')">${acc}</span>`
                : `<span class="status-badge status-${accClass}">${acc}</span>`;
            return `
            <tr>
                <td>${nomination.id.substring(0, 8)}...</td>
                <td>${nomination.firstName} ${nomination.surname}</td>
                <td>${this.formatPositionName(nomination.positionNominated)}</td>
                <td>${nomination.membershipNumber || 'N/A'}</td>
                <td>${nomination.jobTitle || 'N/A'}</td>
                <td>${nomination.selfNomination === 'self' ? 'Self' : 'Third-Party'}</td>
                <td>${accCell}</td>
                <td>${nomination.nominatorFirstName} ${nomination.nominatorSurname}</td>
                <td><span class="status-badge status-${nomination.status || 'pending'}">${nomination.status || 'pending'}</span></td>
                <td>${this.formatDate(nomination.submittedAt)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="adminPanel.viewNomination('${nomination.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </div>
                </td>
            </tr>
            `;
        }).join('');
        
        tableInfo.textContent = `Showing ${this.filteredNominations.length} of ${this.nominations.length} nominations`;
    }

    async viewNomination(nominationId) {
        const nomination = this.nominations.find(n => n.id === nominationId);
        if (!nomination) return;
        
        this.currentNomination = nomination;
        this.showNominationDetails(nomination);
        this.openModal();
    }

    showNominationDetails(nomination) {
        const modalBody = document.getElementById('modalBody');
        
        modalBody.innerHTML = `
            <div class="detail-section">
                <h4><i class="fas fa-user"></i> Personal Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Full Name</div>
                        <div class="detail-value">${nomination.firstName} ${nomination.surname}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Job Title</div>
                        <div class="detail-value">${nomination.jobTitle || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Organization</div>
                        <div class="detail-value">${nomination.membershipNumber || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Position Nominated</div>
                        <div class="detail-value">${this.formatPositionName(nomination.positionNominated)}</div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-briefcase"></i> Career Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Qualifications</div>
                        <div class="detail-value">${nomination.qualifications || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Past Three Roles</div>
                        <div class="detail-value">${nomination.pastThreeRoles || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Career Highlights / Awards</div>
                        <div class="detail-value">${nomination.careerHighlights || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-id-badge"></i> Professional Memberships</h4>
                ${Array.isArray(nomination.membershipInstitution) && nomination.membershipInstitution.length > 0 ? `
                <div class="table-wrapper">
                    <table class="nominations-table">
                        <thead>
                            <tr>
                                <th>Institution</th>
                                <th>Designation</th>
                                <th>Membership Number</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${nomination.membershipInstitution.map((inst, idx) => `
                                <tr>
                                    <td>${inst || ''}</td>
                                    <td>${(nomination.membershipDesignation && nomination.membershipDesignation[idx]) || ''}</td>
                                    <td>${(nomination.membershipNumber && nomination.membershipNumber[idx]) || ''}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                ` : '<div class="detail-value">No memberships provided</div>'}
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-tools"></i> Eligibility & Experience</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Infrastructure Support</div>
                        <div class="detail-value">${nomination.infrastructureSupport === 'yes' ? 'Yes' : nomination.infrastructureSupport === 'no' ? 'No' : 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">WIL/Career Facilitator</div>
                        <div class="detail-value">${nomination.wilFacilitatorExperience || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">WIL Lecturer/Researcher</div>
                        <div class="detail-value">${nomination.wilLecturerExperience || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">WIL Host/Mentor</div>
                        <div class="detail-value">${nomination.wilHostExperience || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">CE/WIL Sponsor, Funder or Volunteer</div>
                        <div class="detail-value">${nomination.ceWilSponsorExperience || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-user-tie"></i> Nominator Information</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Nominator Name</div>
                        <div class="detail-value">${nomination.nominatorFirstName} ${nomination.nominatorSurname}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Nominator Organization</div>
                        <div class="detail-value">${nomination.nominatorMembershipNumber || 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Nomination Type</div>
                        <div class="detail-value">${nomination.selfNomination === 'self' ? 'Self Nomination' : 'Third-Party Nomination'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Acceptance Status</div>
                        <div class="detail-value">
                            ${(() => { const acc = nomination.acceptanceStatus || 'Pending'; const cls = acc === 'Accepted' ? 'accepted' : (acc === 'Denied' ? 'rejected' : 'pending'); return `<span class=\"status-badge status-${cls}\">${acc}</span>`; })()}
                            ${(!nomination.acceptanceStatus || nomination.acceptanceStatus === 'Pending') ? `<button class=\"btn btn-secondary\" style=\"margin-left:8px\" onclick=\"adminPanel.copyAcceptanceLink('${nomination.id}')\"><i class=\"fas fa-link\"></i> Copy Link</button>` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-file-alt"></i> Documents & Links</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">CV/Bio Text</div>
                        <div class="detail-value">${nomination.cvBioText ? nomination.cvBioText.substring(0, 200) + '...' : 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">CV/Bio Link</div>
                        <div class="detail-value">${nomination.cvBioLink ? `<a href="${nomination.cvBioLink}" target="_blank">View CV/Bio</a>` : 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Profile Picture</div>
                        <div class="detail-value">${nomination.profilePictureFileName ? 'Uploaded: ' + nomination.profilePictureFileName : 'N/A'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">CV File</div>
                        <div class="detail-value">${nomination.cvBioFileName ? 'Uploaded: ' + nomination.cvBioFileName : 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="detail-section">
                <h4><i class="fas fa-info-circle"></i> Submission Details</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Status</div>
                        <div class="detail-value"><span class="status-badge status-${nomination.status || 'pending'}">${nomination.status || 'pending'}</span></div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Submitted At</div>
                        <div class="detail-value">${this.formatDate(nomination.submittedAt)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Nominee Acceptance</div>
                        <div class="detail-value">${nomination.nomineeAcceptance ? 'Accepted' : 'Not Accepted'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    async updateNominationStatus(newStatus) {
        if (!this.currentNomination) return;
        
        this.showLoading(true);
        
        try {
            const { getFirestore, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const db = getFirestore();
            const nominationRef = doc(db, 'nominations', this.currentNomination.id);
            
            await updateDoc(nominationRef, {
                status: newStatus,
                updatedAt: new Date()
            });
            
            // Update local data
            this.currentNomination.status = newStatus;
            const index = this.nominations.findIndex(n => n.id === this.currentNomination.id);
            if (index !== -1) {
                this.nominations[index].status = newStatus;
            }
            
            this.filterNominations();
            this.updateStatistics();
            this.closeModal();
            this.showSuccess(`Nomination ${newStatus} successfully!`);
            
        } catch (error) {
            console.error('Error updating nomination status:', error);
            this.showError('Failed to update nomination status. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    exportToExcel() {
        if (this.filteredNominations.length === 0) {
            this.showError('No nominations to export.');
            return;
        }
        
        // Prepare data for Excel export
        const excelData = this.filteredNominations.map(nomination => ({
            'ID': nomination.id.substring(0, 8) + '...',
            'First Name': nomination.firstName || '',
            'Surname': nomination.surname || '',
            'Position Nominated': this.formatPositionName(nomination.positionNominated),
            'Job Title': nomination.jobTitle || '',
            'Organization': nomination.membershipNumber || '',
            'Nomination Type': nomination.selfNomination === 'self' ? 'Self Nomination' : 'Third-Party Nomination',
            'Acceptance Status': nomination.acceptanceStatus || 'Pending',
            'Nominator Name': `${nomination.nominatorFirstName} ${nomination.nominatorSurname}`,
            'Nominator Organization': nomination.nominatorMembershipNumber || '',
            'Past Three Roles': nomination.pastThreeRoles || '',
            'Career Highlights / Awards': nomination.careerHighlights || '',
            'Qualifications': nomination.qualifications || '',
            'CV/Bio Text': nomination.cvBioText ? nomination.cvBioText.substring(0, 500) : '',
            'CV/Bio Link': nomination.cvBioLink || '',
            'Profile Picture': nomination.profilePictureFileName || '',
            'CV File': nomination.cvBioFileName || '',
            'Infrastructure Support': nomination.infrastructureSupport || '',
            'WIL/Career Facilitator': nomination.wilFacilitatorExperience || '',
            'WIL Lecturer/Researcher': nomination.wilLecturerExperience || '',
            'WIL Host/Mentor': nomination.wilHostExperience || '',
            'CE/WIL Sponsor/Funder/Volunteer': nomination.ceWilSponsorExperience || '',
            'Memberships - Institutions': Array.isArray(nomination.membershipInstitution) ? nomination.membershipInstitution.join('; ') : '',
            'Memberships - Designations': Array.isArray(nomination.membershipDesignation) ? nomination.membershipDesignation.join('; ') : '',
            'Memberships - Numbers': Array.isArray(nomination.membershipNumber) ? nomination.membershipNumber.join('; ') : '',
            'Status': nomination.status || 'pending',
            'Submitted At': this.formatDate(nomination.submittedAt),
            'Nominee Acceptance': nomination.nomineeAcceptance ? 'Accepted' : 'Not Accepted'
        }));
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Set column widths
        const colWidths = [
            { wch: 12 }, // ID
            { wch: 15 }, // First Name
            { wch: 15 }, // Surname
            { wch: 20 }, // Position Nominated
            { wch: 25 }, // Job Title
            { wch: 20 }, // Organization
            { wch: 15 }, // Self Nomination
            { wch: 20 }, // Nominator Name
            { wch: 20 }, // Nominator Organization
            { wch: 30 }, // Current Roles
            { wch: 30 }, // Past Three Roles
            { wch: 30 }, // Highlights/Awards
            { wch: 30 }, // Qualifications
            { wch: 50 }, // CV/Bio Text
            { wch: 30 }, // CV/Bio Link
            { wch: 20 }, // Profile Picture
            { wch: 20 }, // CV File
            { wch: 12 }, // Status
            { wch: 20 }, // Submitted At
            { wch: 18 }  // Nominee Acceptance
        ];
        ws['!cols'] = colWidths;
        
        XLSX.utils.book_append_sheet(wb, ws, 'Nominations');
        
        // Generate filename with current date
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const filename = `SASCE_Nominations_${dateStr}.xlsx`;
        
        // Download file
        XLSX.writeFile(wb, filename);
        
        this.showSuccess(`Excel file exported successfully: ${filename}`);
    }

    updateStatistics() {
        const total = this.nominations.length;
        const pending = this.nominations.filter(n => !n.status || n.status === 'pending').length;
        const approved = this.nominations.filter(n => n.status === 'approved').length;
        const rejected = this.nominations.filter(n => n.status === 'rejected').length;
        
        document.getElementById('totalNominations').textContent = total;
        document.getElementById('pendingNominations').textContent = pending;
        document.getElementById('approvedNominations').textContent = approved;
        document.getElementById('rejectedNominations').textContent = rejected;
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

    openModal() {
        document.getElementById('nominationModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('nominationModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentNomination = null;
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
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize admin panel when page loads
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
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
`;
document.head.appendChild(style);
