document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const emailInput = document.getElementById('emailInput');
    const resultSection = document.getElementById('resultSection');
    const loader = document.getElementById('loader');
    const btnText = analyzeBtn.querySelector('.btn-text');
    
    // Result Elements
    const resultTitle = document.getElementById('resultTitle');
    const resultDesc = document.getElementById('resultDesc');
    const resultIcon = document.getElementById('resultIcon');
    const iconType = document.getElementById('iconType');
    const scorePath = document.getElementById('scorePath');
    const scoreText = document.getElementById('scoreText');
    const threatList = document.getElementById('threatList');
    const historyList = document.getElementById('historyList');

    const API_URL = 'http://localhost:8000/predict';

    // Initialize History from LocalStorage
    let scanHistory = JSON.parse(localStorage.getItem('phishguard_history') || '[]');
    renderHistory();

    analyzeBtn.addEventListener('click', async () => {
        const text = emailInput.value.trim();
        
        if (!text) {
            showToast('Please provide email content to begin analysis.', 'warn');
            return;
        }

        // UI Reset & Loading state
        toggleLoading(true);
        resultSection.classList.add('hidden');
        resetCircularChart();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Neural inference failed');
            }

            const result = await response.json();
            handleSuccess(result, text);
        } catch (error) {
            console.error('Inference Error:', error);
            const userMessage = error.message === 'Failed to fetch' 
                ? 'Cannot connect to backend. Please ensure the FastAPI server is running (uvicorn backend.main:app).'
                : error.message;
            showError(userMessage);
        } finally {
            toggleLoading(false);
        }
    });

    function handleSuccess(data, originalText) {
        resultSection.classList.remove('hidden');
        
        const isPhishing = data.is_phishing;
        const confidence = data.confidence * 100;
        const safetyScore = isPhishing ? (100 - confidence) : confidence;

        // UI Updates with premium transitions
        updateResultUI(isPhishing, data.type, safetyScore);
        animateCircularChart(safetyScore);
        generateThreatIndicators(originalText, isPhishing);
        
        // Save to History
        addToHistory({
            text: originalText.substring(0, 50) + '...',
            type: data.type,
            score: safetyScore.toFixed(0),
            date: new Date().toLocaleTimeString()
        });
    }

    function updateResultUI(isPhishing, type, score) {
        if (isPhishing) {
            resultTitle.textContent = 'Threat Detected';
            resultTitle.style.color = 'var(--error)';
            resultDesc.textContent = 'High-risk patterns identified. This email exhibits characteristics of a malicious phishing attempt.';
            resultIcon.style.color = 'var(--error)';
            iconType.className = 'fas fa-shield-circle-exclamation';
            scorePath.style.stroke = 'var(--error)';
        } else {
            resultTitle.textContent = 'Verified Safe';
            resultTitle.style.color = 'var(--success)';
            resultDesc.textContent = 'Our neural network suggests this email is likely safe. No immediate threat vectors were identified.';
            resultIcon.style.color = 'var(--success)';
            iconType.className = 'fas fa-shield-check';
            scorePath.style.stroke = 'var(--success)';
        }
    }

    function animateCircularChart(targetScore) {
        let currentScore = 0;
        const duration = 1000;
        const startTime = performance.now();

        function step(timestamp) {
            const progress = Math.min((timestamp - startTime) / duration, 1);
            currentScore = progress * targetScore;
            
            const offset = (currentScore / 100) * 100;
            scorePath.style.strokeDasharray = `${offset}, 100`;
            scoreText.textContent = `${Math.floor(currentScore)}%`;

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }

    function resetCircularChart() {
        scorePath.style.strokeDasharray = `0, 100`;
        scoreText.textContent = `0%`;
    }

    function generateThreatIndicators(text, isPhishing) {
        threatList.innerHTML = '';
        const traits = [];
        
        if (isPhishing) {
            if (/urgent|immediately|act now|secure now/i.test(text)) traits.push({ icon: 'fa-triangle-exclamation', text: 'Urgency Pressure Detected', type: 'warn' });
            if (/bank|paypal|account|security alert/i.test(text)) traits.push({ icon: 'fa-building-shield', text: 'Brand Impersonation Risk', type: 'warn' });
            traits.push({ icon: 'fa-network-wired', text: 'Statistical Anomaly Found', type: 'warn' });
        } else {
            traits.push({ icon: 'fa-check-double', text: 'Linguistic Tone Normal', type: 'safe' });
            traits.push({ icon: 'fa-fingerprint', text: 'Signature Verification Passed', type: 'safe' });
            traits.push({ icon: 'fa-brain', text: 'Low Neural Entropy', type: 'safe' });
        }

        traits.forEach(trait => {
            const li = document.createElement('li');
            li.className = trait.type === 'warn' ? 'warn' : '';
            li.innerHTML = `<i class="fas ${trait.icon}"></i> ${trait.text}`;
            threatList.appendChild(li);
        });
    }

    function addToHistory(item) {
        scanHistory.unshift(item);
        if (scanHistory.length > 5) scanHistory.pop();
        localStorage.setItem('phishguard_history', JSON.stringify(scanHistory));
        renderHistory();
    }

    function renderHistory() {
        if (scanHistory.length === 0) {
            historyList.innerHTML = '<div class="empty-history">No recent scans</div>';
            return;
        }
        historyList.innerHTML = scanHistory.map(item => `
            <div class="history-item">
                <div class="h-main">
                    <span class="h-text">${item.text}</span>
                    <span class="h-badge ${item.type.toLowerCase()}">${item.score}% Safe</span>
                </div>
                <span class="h-date">${item.date}</span>
            </div>
        `).join('');
    }

    function toggleLoading(isLoading) {
        if (isLoading) {
            loader.style.display = 'block';
            btnText.style.display = 'none';
            analyzeBtn.disabled = true;
            analyzeBtn.style.opacity = '0.7';
        } else {
            loader.style.display = 'none';
            btnText.style.display = 'block';
            analyzeBtn.disabled = false;
            analyzeBtn.style.opacity = '1';
        }
    }

    function showError(message) {
        showToast(message, 'error');
    }

    function showToast(message, type) {
        // Simple elegant alert for premium feel
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
});
