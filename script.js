document.addEventListener('DOMContentLoaded', () => {
    const symbolInput = document.getElementById('symbolInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const errorMsg = document.getElementById('errorMsg');
    const loader = document.getElementById('loader');
    const dashboard = document.getElementById('dashboard');
    
    // Result elements
    const resSymbol = document.getElementById('resSymbol');
    const resTrend = document.getElementById('resTrend');
    const resConfidence = document.getElementById('resConfidence');
    const confidenceBar = document.getElementById('confidenceBar');
    
    let chartInstance = null;

    // Listeners
    analyzeBtn.addEventListener('click', analyzeStock);
    symbolInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') analyzeStock();
    });

    async function analyzeStock() {
        const symbol = symbolInput.value.trim();
        if (!symbol) {
            showError("ERR: INPUT REQUIRED");
            return;
        }

        // Reset UI
        showError("");
        dashboard.classList.add('hidden');
        loader.classList.remove('hidden');

        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol: symbol })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "ERR: ANOMALY DETECTED");
            }

            // Update UI with results
            updateDashboard(data);
            
            // Show dashboard
            loader.classList.add('hidden');
            dashboard.classList.remove('hidden');

        } catch (error) {
            loader.classList.add('hidden');
            showError(error.message);
        }
    }

    function updateDashboard(data) {
        resSymbol.textContent = data.symbol;
        resTrend.textContent = data.trend;
        resConfidence.textContent = `${data.confidence}%`;
        
        // Update bar width
        confidenceBar.style.width = `${data.confidence}%`;

        // Reset classes
        resTrend.className = 'highlight';

        // Color coding based on trend
        if (data.trend.toLowerCase() === 'uptrend') {
            resTrend.classList.add('uptrend');
            confidenceBar.style.background = 'var(--neon-green)';
            confidenceBar.style.boxShadow = '0 0 15px var(--neon-green)';
        } else if (data.trend.toLowerCase() === 'downtrend') {
            resTrend.classList.add('downtrend');
            confidenceBar.style.background = 'var(--neon-red)';
            confidenceBar.style.boxShadow = '0 0 15px var(--neon-red)';
        } else {
            resTrend.classList.add('stable');
            confidenceBar.style.background = 'var(--neon-yellow)';
            confidenceBar.style.boxShadow = '0 0 15px var(--neon-yellow)';
        }

        renderChart(data.historical_dates, data.historical_prices, data.symbol);
    }

    function renderChart(dates, prices, symbol) {
        const ctx = document.getElementById('stockChart').getContext('2d');
        
        if (chartInstance) {
            chartInstance.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(0, 240, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

        Chart.defaults.font.family = "'Space Grotesk', sans-serif";
        Chart.defaults.color = '#8892b0';

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: `${symbol} LOG_DATA ($)`,
                    data: prices,
                    borderColor: '#00f0ff',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#ff007f',
                    pointBorderColor: '#ff007f',
                    pointRadius: 0,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#00f0ff',
                    pointHoverBorderColor: '#fff',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#00f0ff', font: {family: "'Orbitron'", size: 14} } },
                    tooltip: {
                        mode: 'index', intersect: false,
                        backgroundColor: 'rgba(10, 10, 15, 0.9)',
                        titleColor: '#00f0ff', bodyColor: '#fff',
                        borderColor: '#b026ff', borderWidth: 1,
                        padding: 10, cornerRadius: 4,
                        titleFont: {family: "'Orbitron'"}, bodyFont: {family: "'Space Grotesk'"}
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(0, 240, 255, 0.05)', drawBorder: false },
                        ticks: { maxTicksLimit: 10, color: '#8892b0' }
                    },
                    y: {
                        grid: { color: 'rgba(0, 240, 255, 0.05)', drawBorder: false },
                        ticks: { color: '#8892b0' }
                    }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    }

    function showError(msg) {
        errorMsg.textContent = msg;
    }
});
