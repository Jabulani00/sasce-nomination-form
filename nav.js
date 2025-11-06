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
            .dropdown-container {
                position: relative;
                display: inline-block;
            }
            .dropdown-button {
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
                background: none;
                cursor: pointer;
                font-family: inherit;
                font-size: inherit;
            }
            .dropdown-button:hover { background: #f3f4f6; }
            .dropdown-menu {
                display: none;
                position: absolute;
                top: 100%;
                left: 0;
                margin-top: 8px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                min-width: 320px;
                z-index: 1000;
                overflow: hidden;
            }
            .dropdown-menu.show {
                display: block;
            }
            .dropdown-item {
                padding: 12px 16px;
                border-bottom: 1px solid #f3f4f6;
            }
            .dropdown-item:last-child {
                border-bottom: none;
            }
            .dropdown-item-title {
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
                font-size: 0.9rem;
            }
            .dropdown-item-actions {
                display: flex;
                gap: 8px;
            }
            .action-button {
                flex: 1;
                padding: 8px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                background: #ffffff;
                color: #374151;
                font-weight: 500;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.15s ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            .action-button:hover {
                background: #f3f4f6;
                border-color: #d1d5db;
            }
            .action-button.copy:hover {
                background: #eff6ff;
                border-color: #0ea5e9;
                color: #0ea5e9;
            }
            .action-button.send:hover {
                background: #f0fdf4;
                border-color: #10b981;
                color: #10b981;
            }
            .action-button i {
                font-size: 0.8rem;
            }
        `;

        const container = document.createElement('nav');
        container.innerHTML = `
            <a href="admin.html" class="${active === 'home' ? 'active' : ''}"><i class="fas fa-home"></i><span>Home</span></a>
            <a href="admin-registrations.html" class="${active === 'voters' ? 'active' : ''}"><i class="fas fa-address-book"></i><span>Voters</span></a>
            <a href="admin-voting-control.html" class="${active === 'voting' ? 'active' : ''}"><i class="fas fa-mail-bulk"></i><span>Voting Control</span></a>
            <a href="results.html" class="${active === 'results' ? 'active' : ''}"><i class="fas fa-chart-bar"></i><span>Results</span></a>
            <a href="summary.html" class="${active === 'summary' ? 'active' : ''}"><i class="fas fa-list"></i><span>Summary</span></a>
            <div class="dropdown-container">
                <button class="dropdown-button" id="formsDropdown">
                    <i class="fas fa-file-alt"></i><span>Forms</span><i class="fas fa-chevron-down" style="font-size: 0.7rem; margin-left: 4px;"></i>
                </button>
                <div class="dropdown-menu" id="formsDropdownMenu">
                    <div class="dropdown-item">
                        <div class="dropdown-item-title">Nomination Form</div>
                        <div class="dropdown-item-actions">
                            <button class="action-button copy" data-url="https://sasce-nomination-form.vercel.app/" data-form="Nomination Form">
                                <i class="fas fa-copy"></i> Copy Link
                            </button>
                            <button class="action-button send" data-url="https://sasce-nomination-form.vercel.app/" data-form="Nomination Form">
                                <i class="fas fa-paper-plane"></i> Send
                            </button>
                        </div>
                    </div>
                    <div class="dropdown-item">
                        <div class="dropdown-item-title">Voting Registration Form</div>
                        <div class="dropdown-item-actions">
                            <button class="action-button copy" data-url="https://sasce-nomination-form.vercel.app/votes-register.html" data-form="Voting Registration Form">
                                <i class="fas fa-copy"></i> Copy Link
                            </button>
                            <button class="action-button send" data-url="https://sasce-nomination-form.vercel.app/votes-register.html" data-form="Voting Registration Form">
                                <i class="fas fa-paper-plane"></i> Send
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.shadowRoot.append(style, container);
        
        // Add dropdown functionality
        const dropdownButton = this.shadowRoot.getElementById('formsDropdown');
        const dropdownMenu = this.shadowRoot.getElementById('formsDropdownMenu');
        const copyButtons = this.shadowRoot.querySelectorAll('.action-button.copy');
        const sendButtons = this.shadowRoot.querySelectorAll('.action-button.send');
        
        // Toggle dropdown
        dropdownButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.shadowRoot.contains(e.target)) {
                dropdownMenu.classList.remove('show');
            }
        });
        
        // Copy to clipboard functionality
        copyButtons.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const url = button.getAttribute('data-url');
                const formName = button.getAttribute('data-form');
                
                try {
                    await navigator.clipboard.writeText(url);
                    const originalText = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    button.style.background = '#d1fae5';
                    button.style.borderColor = '#10b981';
                    button.style.color = '#10b981';
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.style.background = '';
                        button.style.borderColor = '';
                        button.style.color = '';
                    }, 2000);
                } catch (err) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = url;
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        const originalText = button.innerHTML;
                        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
                        button.style.background = '#d1fae5';
                        button.style.borderColor = '#10b981';
                        button.style.color = '#10b981';
                        
                        setTimeout(() => {
                            button.innerHTML = originalText;
                            button.style.background = '';
                            button.style.borderColor = '';
                            button.style.color = '';
                        }, 2000);
                    } catch (fallbackErr) {
                        alert('Failed to copy link. Please copy manually: ' + url);
                    }
                    document.body.removeChild(textArea);
                }
            });
        });
        
        // Send functionality (opens email client or share dialog)
        sendButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = button.getAttribute('data-url');
                const formName = button.getAttribute('data-form');
                
                // Try Web Share API first (mobile-friendly)
                if (navigator.share) {
                    navigator.share({
                        title: `SASCE ${formName}`,
                        text: `Please complete the ${formName}:`,
                        url: url
                    }).catch(err => {
                        console.log('Share cancelled or failed:', err);
                    });
                } else {
                    // Fallback: Open email client
                    const subject = encodeURIComponent(`SASCE ${formName}`);
                    const body = encodeURIComponent(`Please complete the ${formName}:\n\n${url}`);
                    window.location.href = `mailto:?subject=${subject}&body=${body}`;
                }
            });
        });
    }
}

customElements.define('admin-nav', AdminNav);


