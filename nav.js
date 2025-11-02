class AdminNav extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const active = (this.getAttribute('active') || '').toLowerCase();
        const style = document.createElement('style');
        style.textContent = `
            :host { display: block; margin: 0 0 16px 0; }
            nav { 
                display: flex; 
                gap: 12px; 
                flex-wrap: wrap; 
                background: #ffffff; 
                border: 1px solid #e5e7eb; 
                border-radius: 10px; 
                padding: 10px; 
                box-shadow: 0 1px 2px rgba(0,0,0,0.04);
            }
            a { 
                display: inline-flex; 
                align-items: center; 
                gap: 8px; 
                padding: 10px 14px; 
                border-radius: 8px; 
                text-decoration: none; 
                color: #374151; 
                font-weight: 600; 
                border: 1px solid transparent;
                transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
            }
            a:hover { background: #f3f4f6; }
            a.active { background: #0ea5e9; color: #ffffff; border-color: #0ea5e9; }
            .spacer { flex: 1 1 auto; }
        `;

        const container = document.createElement('nav');
        container.innerHTML = `
            <a href="admin.html" class="${active === 'home' ? 'active' : ''}"><i class="fas fa-home"></i><span>Home</span></a>
            <a href="admin-registrations.html" class="${active === 'voters' ? 'active' : ''}"><i class="fas fa-address-book"></i><span>Voters</span></a>
            <a href="admin-voting-control.html" class="${active === 'voting' ? 'active' : ''}"><i class="fas fa-mail-bulk"></i><span>Voting Control</span></a>
            <a href="results.html" class="${active === 'results' ? 'active' : ''}"><i class="fas fa-chart-bar"></i><span>Results</span></a>
            <a href="summary.html" class="${active === 'summary' ? 'active' : ''}"><i class="fas fa-list"></i><span>Summary</span></a>
        `;

        this.shadowRoot.append(style, container);
    }
}

customElements.define('admin-nav', AdminNav);


