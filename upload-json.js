// JSON Upload for SASCE Nominations
(function() {
    const state = {
        parsed: null,
        valid: false
    };

    document.addEventListener('DOMContentLoaded', () => {
        const fileInput = document.getElementById('jsonFile');
        const fileInfo = document.getElementById('fileInfo');
        const validateBtn = document.getElementById('validateBtn');
        const submitBtn = document.getElementById('submitBtn');
        const validationBox = document.getElementById('validationBox');
        const resultsSection = document.getElementById('resultsSection');
        const resultsBox = document.getElementById('resultsBox');
        const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
        const downloadSampleBtn = document.getElementById('downloadSampleBtn');

        downloadTemplateBtn.addEventListener('click', () => {
            const template = getTemplate();
            downloadJson(template, 'sasce-nomination-template.json');
        });

        downloadSampleBtn.addEventListener('click', () => {
            const sample = [getSampleEntry()];
            downloadJson(sample, 'sasce-nomination-sample.json');
        });

        fileInput.addEventListener('change', () => {
            state.parsed = null;
            state.valid = false;
            validationBox.style.display = 'none';
            resultsSection.style.display = 'none';
            submitBtn.disabled = true;
            validateBtn.disabled = !fileInput.files || fileInput.files.length === 0;

            if (fileInput.files && fileInput.files[0]) {
                const f = fileInput.files[0];
                fileInfo.textContent = `Selected: ${f.name} (${formatFileSize(f.size)})`;
            } else {
                fileInfo.textContent = '';
            }
        });

        validateBtn.addEventListener('click', async () => {
            try {
                const text = await fileInput.files[0].text();
                const json = JSON.parse(text);
                const entries = Array.isArray(json) ? json : [json];
                const { valid, report, cleaned } = validateEntries(entries);
                state.parsed = cleaned;
                state.valid = valid;
                validationBox.style.display = 'block';
                validationBox.className = valid ? 'success-message show' : 'section-error error-message show';
                validationBox.innerHTML = report;
                submitBtn.disabled = !valid;
            } catch (e) {
                state.parsed = null;
                state.valid = false;
                validationBox.style.display = 'block';
                validationBox.className = 'section-error error-message show';
                validationBox.textContent = 'Invalid JSON file. Please check the structure and try again.';
                submitBtn.disabled = true;
            }
        });

        submitBtn.addEventListener('click', async () => {
            if (!state.valid || !state.parsed) return;
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            resultsSection.style.display = 'none';

            try {
                const outcome = await saveAllToFirestore(state.parsed);
                const successCount = outcome.filter(x => x.ok).length;
                const errorCount = outcome.length - successCount;
                const linksHtml = outcome
                    .filter(x => x.ok && x.link)
                    .map((x, i) => `<div style="margin:6px 0;">Nominee ${i + 1}: <a href="${x.link}" target="_blank">Acceptance Link</a></div>`) 
                    .join('');
                resultsBox.innerHTML = `
                    <h3><i class="fas fa-check-circle"></i> Upload Completed</h3>
                    <p>${successCount} record(s) saved, ${errorCount} error(s).</p>
                    ${linksHtml}
                `;
                resultsSection.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (e) {
                resultsBox.innerHTML = `<h3><i class="fas fa-times-circle"></i> Upload Failed</h3><p>${e.message || e}</p>`;
                resultsSection.style.display = 'block';
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        });
    });

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function requiredFields() {
        return [
            'nominatorFirstName',
            'nominatorSurname',
            'nominatorEmail',
            'nominatorPhone',
            'nominatorMembershipNumber',
            'selfNomination',
            'positionNominated',
            'firstName',
            'surname',
            'email',
            'phone',
            'jobTitle',
            'membershipNumber'
        ];
    }

    function validateEntries(entries) {
        const req = new Set(requiredFields());
        let allOk = true;
        const lines = [];
        const cleaned = entries.map((e, idx) => {
            const missing = [];
            req.forEach(k => { if (!hasNonEmpty(e[k])) missing.push(k); });
            if (missing.length) {
                allOk = false;
                lines.push(`Row ${idx + 1}: Missing required fields: ${missing.join(', ')}`);
            }

            // Basic email format checks
            if (e.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)) {
                allOk = false;
                lines.push(`Row ${idx + 1}: Invalid nominee email`);
            }
            if (e.nominatorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.nominatorEmail)) {
                allOk = false;
                lines.push(`Row ${idx + 1}: Invalid nominator email`);
            }

            // Keep only Firestore-friendly values, drop undefined and functions
            const safe = {};
            Object.keys(e || {}).forEach(k => {
                const v = e[k];
                if (v === undefined) return;
                if (typeof v === 'function') return;
                if (v && typeof File !== 'undefined' && v instanceof File) return;
                safe[k] = v;
            });
            return safe;
        });

        const report = allOk
            ? `<h3><i class="fas fa-check"></i> Validation passed</h3><p>${entries.length} record(s) ready to submit.</p>`
            : `<h3><i class="fas fa-exclamation-triangle"></i> Validation issues</h3><ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>`;
        return { valid: allOk, report, cleaned };
    }

    function hasNonEmpty(v) {
        if (v === null || v === undefined) return false;
        if (typeof v === 'string') return v.trim() !== '';
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object') return Object.keys(v).length > 0;
        return true;
    }

    function getTemplate() {
        return [
            {
                "nominatorFirstName": "",
                "nominatorSurname": "",
                "nominatorEmail": "",
                "nominatorPhone": "",
                "nominatorMembershipNumber": "",
                "selfNomination": "self", // or "third-party"
                "positionNominated": "president",
                "firstName": "",
                "surname": "",
                "email": "",
                "phone": "",
                "jobTitle": "",
                "membershipNumber": "",
                "cvBioText": "", // or provide cvBioLink instead
                "cvBioLink": "",
                "membershipInstitution": [""],
                "membershipDesignation": [""],
                "membershipNumber": [""],
                "qualificationName": [""],
                "qualificationInstitution": [""],
                "qualificationYear": [""],
                "roleTitle": [""],
                "roleOrganisation": [""],
                "roleDuration": [""],
                "careerHighlightTitle": [""],
                "careerHighlightYear": [""],
                "infrastructureSupport": "yes",
                "wilFacilitatorExperience": "none",
                "wilLecturerExperience": "none",
                "wilHostExperience": "none",
                "ceWilSponsorExperience": "none",
                "volunteerBeneficiaryDuration": "upto6",
                "internshipWilDuration": "upto6"
            }
        ];
    }

    function getSampleEntry() {
        return {
            nominatorFirstName: "Jane",
            nominatorSurname: "Doe",
            nominatorEmail: "jane.doe@example.com",
            nominatorPhone: "+27 82 000 0000",
            nominatorMembershipNumber: "OrgName-12345",
            selfNomination: "self",
            positionNominated: "president",
            firstName: "John",
            surname: "Smith",
            email: "john.smith@example.com",
            phone: "+27 82 111 1111",
            jobTitle: "Senior Officer / Company X",
            membershipNumber: "Company X / 998877",
            cvBioText: "Experienced CE leader with a focus on WIL initiatives.",
            membershipInstitution: ["Association A"],
            membershipDesignation: ["Fellow"],
            membershipNumber: ["A-5566"],
            qualificationName: ["BSc Education"],
            qualificationInstitution: ["University A"],
            qualificationYear: ["2015"],
            roleTitle: ["WIL Coordinator"],
            roleOrganisation: ["Institution Y"],
            roleDuration: ["2019–2022"],
            careerHighlightTitle: ["CE Excellence Award"],
            careerHighlightYear: ["2023"],
            infrastructureSupport: "yes",
            wilFacilitatorExperience: "3-6yrs",
            wilLecturerExperience: "1-3yrs",
            wilHostExperience: "over6yrs",
            ceWilSponsorExperience: "none",
            volunteerBeneficiaryDuration: "6to12",
            internshipWilDuration: "over18"
        };
    }

    function downloadJson(obj, filename) {
        const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function saveAllToFirestore(entries) {
        const { getFirestore, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getFirestore();
        const nominationsRef = collection(db, 'nominations');

        const basePath = location.origin + location.pathname.replace(/[^/]*$/, '');
        const out = [];

        for (let i = 0; i < entries.length; i++) {
            const src = entries[i];
            try {
                const clean = buildCleanFirestoreData(src);
                const docRef = await addDoc(nominationsRef, clean);
                const link = `${basePath}accept.html?id=${encodeURIComponent(docRef.id)}&token=${encodeURIComponent(clean.acceptanceToken)}`;
                out.push({ ok: true, id: docRef.id, link });
            } catch (e) {
                out.push({ ok: false, error: e && (e.message || String(e)) });
            }
        }
        return out;
    }

    function buildCleanFirestoreData(data) {
        const { profilePictureFile, profilePictureBase64, ...rest } = data || {};
        const clean = { ...rest };

        // Keep base64 if provided via JSON, otherwise ignore
        if (typeof profilePictureBase64 === 'string' && profilePictureBase64.startsWith('data:')) {
            clean.profilePictureBase64 = profilePictureBase64;
        }

        clean.submittedAt = new Date();
        clean.status = 'pending';
        clean.acceptanceToken = Math.random().toString(36).slice(2) + Date.now().toString(36);

        Object.keys(clean).forEach(k => {
            const v = clean[k];
            if (typeof File !== 'undefined' && v instanceof File) delete clean[k];
            if (v === undefined) delete clean[k];
        });
        return clean;
    }
})();


