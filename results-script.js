// Election Results Page
class ResultsPage {
    constructor() {
        this.candidates = [];
        this.positions = [
            'president',
            'deputy-president',
            'general-secretary',
            'deputy-general-secretary',
            'treasurer',
            'deputy-treasurer'
        ];
        this.loadResults();
        this.setupRefresh();
    }

    setupRefresh() {
        const btn = document.getElementById('refreshResultsBtn');
        if (btn) btn.addEventListener('click', () => this.loadResults());
    }

    async loadResults() {
        this.showLoading(true);
        try {
            await this.loadCandidates();
            this.updateHeaderMeta();
            this.renderByPosition();
        } catch (e) {
            console.error('Failed to load results', e);
            this.showNotification('Failed to load results. Please refresh.', 'error');
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
                this.candidates.push({
                    id: doc.id,
                    name: `${data.firstName} ${data.surname}`,
                    position: data.positionNominated,
                    organization: data.membershipNumber,
                    jobTitle: data.jobTitle,
                    profilePictureBase64: data.profilePictureBase64,
                    votes: data.votes || 0,
                });
            }
        });
    }

    renderByPosition() {
        this.positions.forEach(position => {
            const container = document.getElementById(`${position}-candidates-results`);
            const candidateCountEl = document.getElementById(`${position}-candidate-count`);
            const voteCountEl = document.getElementById(`${position}-vote-count`);
            if (!container) return;

            const positionCandidates = this.candidates.filter(c => c.position === position);

            if (positionCandidates.length === 0) {
                container.innerHTML = `
                    <div class="loading-results" style="text-align:center;color:#7f8c8d;">
                        <i class="fas fa-user-slash"></i> No approved and accepted candidates.
                    </div>
                `;
                if (candidateCountEl) candidateCountEl.textContent = '0';
                if (voteCountEl) voteCountEl.textContent = '0';
                return;
            }

            const sorted = [...positionCandidates].sort((a, b) => b.votes - a.votes);
            const totalVotes = sorted.reduce((sum, c) => sum + (c.votes || 0), 0);

            if (candidateCountEl) candidateCountEl.textContent = String(sorted.length);
            if (voteCountEl) voteCountEl.textContent = String(totalVotes);

            container.innerHTML = sorted.map((c, idx) => {
                const percentage = totalVotes > 0 ? Math.round((c.votes / totalVotes) * 100) : 0;
                const isLeader = idx === 0 && c.votes > 0;
                return `
                    <div class="candidate-result ${isLeader ? 'leader' : ''}" style="display:flex;align-items:center;gap:15px;background:#fff;border:1px solid #e9ecef;border-radius:10px;padding:15px;margin-bottom:12px;">
                        <div class="candidate-image" style="flex-shrink:0;">
                            ${c.profilePictureBase64 ?
                                `<img src="${c.profilePictureBase64}" alt="${c.name}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid #3A6B9C;">` :
                                `<div style="width:60px;height:60px;border-radius:50%;background:#ecf0f1;display:flex;align-items:center;justify-content:center;color:#7f8c8d;border:2px solid #bdc3c7;"><i class=\"fas fa-user\"></i></div>`
                            }
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:700;color:#3A6B9C;">${c.name}</div>
                            <div style="color:#7f8c8d;font-size:0.9rem;">${c.organization || 'N/A'} • ${c.jobTitle || 'N/A'}</div>
                            <div class="progress-bar" style="height:8px;background:#ecf0f1;border-radius:6px;margin-top:8px;">
                                <div class="progress-fill" style="width:${percentage}%;height:100%;background:#7AAE92;border-radius:6px;"></div>
                            </div>
                        </div>
                        <div style="text-align:right;min-width:90px;">
                            <div style="font-weight:700;">${c.votes}</div>
                            <div style="color:#7f8c8d;font-size:0.85rem;">${percentage}%</div>
                        </div>
                    </div>
                `;
            }).join('');
        });
    }

    updateHeaderMeta() {
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
        const status = document.getElementById('electionStatus');
        if (status) status.textContent = 'Live';
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.style.display = show ? 'block' : 'none';
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 3000;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            padding: 12px 16px; border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${message}</span>`;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 4000);
    }
}

let resultsPage;
document.addEventListener('DOMContentLoaded', () => {
    resultsPage = new ResultsPage();
});


