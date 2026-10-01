console.log("DASHBOARD.JS LOADED");

// =====================================================
// GLOBAL CONFIGURATION & STATE
// =====================================================
const RATE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let rateRefreshTimer = null;
let dashboardLoading = false;
let currentBalances = [];
let currentTransactions = [];
let currentTotalPortfolioINR = 0;
let lastSyncTimestamp = Date.now();
let portfolioChartInstance = null;
let allocationChartInstance = null;
let cashflowChartInstance = null;
let forexTrendChartInstance = null;

// =====================================================
// PAGE LOAD
// =====================================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Dashboard DOM loaded");
    loadUserEmail();
    await loadDashboard();

    // CUSTOM EXCHANGE RATE DROPDOWNS
    const fromCurrency = document.getElementById("customFromCurrency");
    const toCurrency = document.getElementById("customToCurrency");

    if (fromCurrency) fromCurrency.addEventListener("change", loadCustomExchangeRate);
    if (toCurrency) toCurrency.addEventListener("change", loadCustomExchangeRate);

    await loadCustomExchangeRate();

    // Start background sync timer (every 60 seconds) & status ticker (every 10s)
    setInterval(updateSyncTimeBadge, 10000);
    setInterval(async () => {
        console.log("Live background sync tick...");
        await loadDashboard();
        lastSyncTimestamp = Date.now();
        updateSyncTimeBadge();
    }, 60000);
});

// =====================================================
// REFRESH WHEN RETURNING TO DASHBOARD
// =====================================================
window.addEventListener("pageshow", async () => {
    console.log("Dashboard pageshow - refreshing data");
    if (document.readyState === "complete") {
        await loadDashboard();
    }
});

// =====================================================
// LOAD COMPLETE DASHBOARD
// =====================================================
async function loadDashboard() {
    if (dashboardLoading) {
        console.log("Dashboard load already in progress");
        return;
    }
    dashboardLoading = true;

    try {
        console.log("Loading complete dashboard...");
        await loadLiveExchangeRates();
        await loadDashboardData();
        updateSyncTimeBadge();
    } catch (error) {
        console.error("Complete dashboard loading failed:", error);
    } finally {
        dashboardLoading = false;
    }
}

// =====================================================
// USER EMAIL
// =====================================================
function loadUserEmail() {
    const email = localStorage.getItem("email");
    const element = document.getElementById("userEmail");
    if (element && email) {
        element.textContent = email;
    }
}

// =====================================================
// LOAD DASHBOARD DATA
// =====================================================
async function loadDashboardData() {
    console.log("Loading dashboard data...");
    let balances = [];
    let transactions = [];

    // LOAD BALANCES
    try {
        const response = await apiRequest("/api/wallet/balances", { method: "GET" });
        balances = Array.isArray(response) ? response : [];
        currentBalances = balances;
        console.log("Dashboard balances:", balances);
        
        renderBalances(balances);
        
        const currencyCount = document.getElementById("currencyCount");
        if (currencyCount) currencyCount.textContent = balances.length;
    } catch (error) {
        console.error("Balance loading error:", error);
        renderBalancesError();
        const currencyCount = document.getElementById("currencyCount");
        if (currencyCount) currencyCount.textContent = "0";
    }

    // LOAD TRANSACTIONS
    try {
        const response = await apiRequest("/api/transactions", { method: "GET" });
        transactions = Array.isArray(response) ? response : [];
        currentTransactions = transactions;
        console.log("Dashboard transactions:", transactions);

        const transactionCount = document.getElementById("transactionCount");
        if (transactionCount) transactionCount.textContent = transactions.length;

        renderRecentTransactions(transactions);
    } catch (error) {
        console.error("Transaction loading error:", error);
        renderTransactionsError();
        const transactionCount = document.getElementById("transactionCount");
        if (transactionCount) transactionCount.textContent = "0";
    }

    // CALCULATE PORTFOLIO
    try {
        await calculateTotalPortfolio(balances);
    } catch (error) {
        console.error("Portfolio calculation error:", error);
        const totalPortfolio = document.getElementById("totalPortfolio");
        if (totalPortfolio) totalPortfolio.textContent = "Unavailable";
    }
}

// =====================================================
// LIVE EXCHANGE RATES
// =====================================================
async function loadLiveExchangeRates() {
    console.log("Loading live exchange rates...");
    const pairs = [
        { key: "USD_INR", from: "USD", to: "INR", element: "rateUSDINR", trend: "trendUSDINR", symbol: "₹" },
        { key: "EUR_INR", from: "EUR", to: "INR", element: "rateEURINR", trend: "trendEURINR", symbol: "₹" },
        { key: "GBP_INR", from: "GBP", to: "INR", element: "rateGBPINR", trend: "trendGBPINR", symbol: "₹" }
    ];

    // CHECK CACHE
    try {
        const cached = localStorage.getItem("forexiaLiveRates");
        if (cached) {
            const cache = JSON.parse(cached);
            const timestamp = Number(cache.timestamp);
            const age = Date.now() - timestamp;

            if (Number.isFinite(timestamp) && age >= 0 && age < RATE_CACHE_DURATION && cache.rates) {
                console.log("Using cached exchange rates");
                displayCachedRates(cache);
                updateLastUpdated(timestamp);
                scheduleRateRefresh(timestamp);
                return;
            }
        }
    } catch (error) {
        console.error("Rate cache error:", error);
    }

    // FETCH FRESH RATES
    console.log("Cache expired. Fetching fresh exchange rates...");
    try {
        const results = await Promise.allSettled(
            pairs.map(pair =>
                apiRequest(`/api/currency/rate?from=${encodeURIComponent(pair.from)}&to=${encodeURIComponent(pair.to)}`, { method: "GET" })
            )
        );

        const rates = {};
        const performance = {};

        // PROCESS FRESH RATES
        results.forEach((result, index) => {
            const pair = pairs[index];
            if (result.status === "fulfilled") {
                const rate = Number(result.value?.rate);
                if (Number.isFinite(rate) && rate > 0) {
                    rates[pair.key] = rate;

                    const previousKey = `forexiaPreviousRate_${pair.key}`;
                    const storedPreviousRate = localStorage.getItem(previousKey);
                    const previousRate = Number(storedPreviousRate);
                    let percentageChange = 0;

                    if (Number.isFinite(previousRate) && previousRate > 0) {
                        percentageChange = ((rate - previousRate) / previousRate) * 100;
                    }

                    percentageChange = Number(percentageChange.toFixed(4));
                    performance[pair.key] = percentageChange;
                    localStorage.setItem(previousKey, rate.toString());
                }
            } else {
                console.error(`Failed to load ${pair.from}/${pair.to}:`, result.reason);
            }
        });

        if (Object.keys(rates).length === 0) {
            throw new Error("No valid exchange rates received");
        }

        // SAVE CACHE
        const cacheData = { timestamp: Date.now(), rates: rates, performance: performance };
        localStorage.setItem("forexiaLiveRates", JSON.stringify(cacheData));

        // DISPLAY
        displayCachedRates(cacheData);
        updateLastUpdated(cacheData.timestamp);
        scheduleRateRefresh(cacheData.timestamp);
        console.log("Live exchange rates loaded successfully");

    } catch (error) {
        console.error("Exchange rate loading failed:", error);

        // TRY OLD CACHE
        try {
            const cached = localStorage.getItem("forexiaLiveRates");
            if (cached) {
                const cache = JSON.parse(cached);
                if (cache && cache.rates) {
                    console.log("API failed. Using old cached rates.");
                    displayCachedRates(cache);
                    updateLastUpdated(cache.timestamp, true);
                    scheduleRateRefresh(cache.timestamp);
                    return;
                }
            }
        } catch (cacheError) {
            console.error("Old rate cache failed:", cacheError);
        }

        // SHOW ERROR
        showRateError("rateUSDINR", "trendUSDINR", "USD_INR");
        showRateError("rateEURINR", "trendEURINR", "EUR_INR");
        showRateError("rateGBPINR", "trendGBPINR", "GBP_INR");
        
        const updatedElement = document.getElementById("ratesUpdated");
        if (updatedElement) updatedElement.textContent = "Unable to update rates";
    }
}

// =====================================================
// DISPLAY CACHED RATES
// =====================================================
function displayCachedRates(cache) {
    if (!cache || !cache.rates) return;
    displayRateWithTrend("rateUSDINR", "trendUSDINR", cache.rates.USD_INR, "₹", "USD_INR", cache.performance?.USD_INR);
    displayRateWithTrend("rateEURINR", "trendEURINR", cache.rates.EUR_INR, "₹", "EUR_INR", cache.performance?.EUR_INR);
    displayRateWithTrend("rateGBPINR", "trendGBPINR", cache.rates.GBP_INR, "₹", "GBP_INR", cache.performance?.GBP_INR);
    renderForexTrendChart(cache.rates);
}

// =====================================================
// DISPLAY RATE + PERFORMANCE
// =====================================================
function displayRateWithTrend(rateElementId, trendElementId, rate, symbol, pairKey, storedPerformance = null) {
    const rateElement = document.getElementById(rateElementId);
    const trendElement = document.getElementById(trendElementId);
    if (!rateElement) return;

    const numericRate = Number(rate);

    if (!Number.isFinite(numericRate)) {
        rateElement.textContent = "Unavailable";
        if (trendElement) {
            trendElement.textContent = "→";
            trendElement.className = "rate-trend neutral";
        }
        const invalidPerformance = document.getElementById(`${pairKey}_performance`);
        if (invalidPerformance) {
            invalidPerformance.textContent = "—";
            invalidPerformance.className = "rate-performance neutral";
        }
        return;
    }

    let performanceElement = document.getElementById(`${pairKey}_performance`);
    if (!performanceElement && trendElement) {
        performanceElement = document.createElement("span");
        performanceElement.id = `${pairKey}_performance`;
        performanceElement.className = "rate-performance neutral";
        trendElement.insertAdjacentElement("afterend", performanceElement);
    }

    let performance = Number(storedPerformance);
    if (!Number.isFinite(performance)) performance = 0;
    if (Math.abs(performance) < 0.00005) performance = 0;

    let trend = "→";
    let trendClass = "neutral";
    if (performance > 0) { trend = "↑"; trendClass = "up"; } 
    else if (performance < 0) { trend = "↓"; trendClass = "down"; }

    rateElement.textContent = `${symbol}${numericRate.toFixed(2)}`;

    if (trendElement) {
        trendElement.textContent = trend;
        trendElement.className = `rate-trend ${trendClass}`;
    }

    if (performanceElement) {
        let percentageText = performance.toFixed(2);
        if (performance > 0) percentageText = `+${percentageText}`;
        performanceElement.textContent = `${percentageText}%`;
        performanceElement.className = `rate-performance ${trendClass}`;
    }
}

// =====================================================
// AUTOMATIC RATE REFRESH
// =====================================================
function scheduleRateRefresh(timestamp) {
    if (rateRefreshTimer) clearTimeout(rateRefreshTimer);
    const numericTimestamp = Number(timestamp);
    if (!Number.isFinite(numericTimestamp)) return;

    const elapsed = Date.now() - numericTimestamp;
    const remaining = Math.max(RATE_CACHE_DURATION - elapsed, 1000);
    
    rateRefreshTimer = setTimeout(async () => {
        await loadLiveExchangeRates();
    }, remaining);
}

// =====================================================
// LAST UPDATED
// =====================================================
function updateLastUpdated(timestamp, fromCache = false) {
    const element = document.getElementById("ratesUpdated");
    if (!element) return;
    if (!timestamp) {
        element.textContent = "Update time unavailable";
        return;
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
        element.textContent = "Update time unavailable";
        return;
    }

    const difference = Math.max(Date.now() - timestamp, 0);
    const minutes = Math.floor(difference / 60000);

    if (minutes < 1) element.textContent = fromCache ? "Updated just now • cached" : "Updated just now";
    else if (minutes === 1) element.textContent = "Updated 1 minute ago";
    else if (minutes < 60) element.textContent = `Updated ${minutes} minutes ago`;
    else {
        const hours = Math.floor(minutes / 60);
        element.textContent = `Updated ${hours} hour${hours > 1 ? "s" : ""} ago`;
    }
}

// =====================================================
// RENDER BALANCES
// =====================================================
function renderBalances(balances) {
    const container = document.getElementById("balances");
    if (!container) return;
    container.innerHTML = "";

    if (!Array.isArray(balances) || balances.length === 0) {
        container.innerHTML = `
            <p class="empty-message">
                No balances yet. Make a deposit to get started.
            </p>
        `;
        return;
    }

    // Assign currency symbols for aesthetic UI updates
    const currencySymbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        INR: '₹'
    };

    balances.forEach(balance => {
        const card = document.createElement("div");
        card.className = "balance-card";

        const currency = String(balance?.currency || "N/A").toUpperCase();
        const amount = Number(balance?.balance || 0);
        const symbol = currencySymbols[currency] || '';

        card.innerHTML = `
            <div class="currency-code">
                ${currency}
            </div>
            <div class="currency-balance">
                ${symbol}${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}
            </div>
        `;
        container.appendChild(card);
    });
}

// =====================================================
// BALANCE ERROR
// =====================================================
function renderBalancesError() {
    const container = document.getElementById("balances");
    if (container) {
        container.innerHTML = `<p class="error-message">Unable to load wallet balances.</p>`;
    }
}

// =====================================================
// CUSTOM LIVE EXCHANGE RATE
// =====================================================
async function loadCustomExchangeRate() {
    const fromCurrency = document.getElementById("customFromCurrency");
    const toCurrency = document.getElementById("customToCurrency");
    const rateElement = document.getElementById("customExchangeRate");

    if (!fromCurrency || !toCurrency || !rateElement) return;

    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (from === to) {
        rateElement.textContent = "1.0000";
        return;
    }

    rateElement.textContent = "Loading...";

    try {
        const response = await apiRequest(`/api/currency/rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { method: "GET" });
        const rate = Number(response?.rate);

        if (!Number.isFinite(rate) || rate <= 0) throw new Error("Invalid exchange rate");

        rateElement.textContent = to === "INR" ? `₹${rate.toFixed(2)}` : rate.toFixed(4);
    } catch (error) {
        console.error("Custom exchange rate error:", error);
        rateElement.textContent = "Unavailable";
    }
}

// =====================================================
// CALCULATE TOTAL PORTFOLIO IN INR
// =====================================================
async function calculateTotalPortfolio(balances) {
    const totalPortfolio = document.getElementById("totalPortfolio");
    if (!totalPortfolio) return;

    totalPortfolio.textContent = "Calculating...";

    if (!Array.isArray(balances) || balances.length === 0) {
        totalPortfolio.textContent = "₹0.00";
        currentTotalPortfolioINR = 0;
        renderAllCharts();
        return;
    }

    let totalINR = 0;

    function getCachedRate(from, to) {
        if (to !== "INR") return null;
        const keyMap = { USD: "USD_INR", EUR: "EUR_INR", GBP: "GBP_INR" };
        const key = keyMap[from];
        if (!key) return null;

        try {
            const cached = localStorage.getItem("forexiaLiveRates");
            if (!cached) return null;
            const cache = JSON.parse(cached);
            const age = Date.now() - Number(cache.timestamp);

            if (age >= 0 && age < RATE_CACHE_DURATION && cache.rates) {
                const rate = Number(cache.rates[key]);
                if (Number.isFinite(rate)) return rate;
            }
        } catch (error) {
            console.error("Cached portfolio rate error:", error);
        }
        return null;
    }

    for (const balance of balances) {
        const currency = String(balance?.currency || "").toUpperCase();
        const amount = Number(balance?.balance || 0);

        if (!currency || !Number.isFinite(amount)) continue;
        if (currency === "INR") { totalINR += amount; continue; }

        let rate = getCachedRate(currency, "INR");

        if (!Number.isFinite(rate)) {
            try {
                const rateResponse = await apiRequest(`/api/currency/rate?from=${encodeURIComponent(currency)}&to=INR`, { method: "GET" });
                rate = Number(rateResponse?.rate);
            } catch (error) {
                console.error(`Unable to get ${currency} to INR rate:`, error);
                rate = null;
            }
        }

        if (Number.isFinite(rate)) totalINR += amount * rate;
    }

    currentTotalPortfolioINR = totalINR;
    totalPortfolio.textContent = `₹${totalINR.toFixed(2)}`;
    savePortfolioSnapshot(totalINR);
    renderAllCharts();
}

// =====================================================
// RECENT TRANSACTIONS
// =====================================================
function renderRecentTransactions(transactions) {
    const tableBody = document.getElementById("recentTransactions");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (!Array.isArray(transactions) || transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="transactions-empty">
                    <div class="empty-icon">↔</div>
                    <strong>No transactions yet</strong>
                    <span>Your recent wallet activity will appear here.</span>
                </td>
            </tr>
        `;
        return;
    }

    const sortedTransactions = [...transactions].sort((a, b) => {
        return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });

    const recentTransactions = sortedTransactions.slice(0, 5);

    recentTransactions.forEach(transaction => {
        const row = document.createElement("tr");
        const type = (transaction?.type || "UNKNOWN").toUpperCase();

        let formattedDate = "N/A";
        let formattedTime = "";

        if (transaction?.createdAt) {
            const date = new Date(transaction.createdAt);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
                formattedTime = date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
            }
        }

        const fromCurrency = transaction?.fromCurrency || "";
        const toCurrency = transaction?.toCurrency || "";
        const amount = Number(transaction?.amount || 0);

        let details = "Wallet activity";
        if (type === "TRANSFER_SENT") {
            const relatedEmail = transaction?.relatedUserEmail || "another user";
            details = `<div class="transaction-details"><strong>Money sent</strong><span>Sent to: ${relatedEmail}</span></div>`;
        } else if (type === "TRANSFER_RECEIVED") {
            const relatedEmail = transaction?.relatedUserEmail || "another user";
            details = `<div class="transaction-details"><strong>Money received</strong><span>From: ${relatedEmail}</span></div>`;
        } else if (type === "DEPOSIT") {
            details = `<div class="transaction-details"><strong>Money deposited</strong><span>Added to your wallet</span></div>`;
        } else if (type === "WITHDRAW") {
            details = `<div class="transaction-details"><strong>Money withdrawn</strong><span>Removed from your wallet</span></div>`;
        } else if (type === "CONVERSION" || type === "CONVERT") {
            details = `<div class="transaction-details"><strong>Currency conversion</strong><span>${fromCurrency} → ${toCurrency}</span></div>`;
        }

        let typeClass = "transaction-badge";
        let amountClass = "transaction-amount";
        let amountPrefix = "";
        let badgeStyle = "";
        let badgeText = type;

        if (type === "DEPOSIT") {
            typeClass += " transaction-deposit";
            amountClass += " amount-positive";
            amountPrefix = "+";
        } else if (type === "WITHDRAW") {
            typeClass += " transaction-withdraw";
            amountClass += " amount-negative";
            amountPrefix = "-";
        } else if (type === "TRANSFER_SENT") {
            typeClass += " transaction-transfer transaction-transfer-sent";
            amountClass += " amount-negative amount-transfer-sent";
            amountPrefix = "-";
            badgeText = "TRANSFER SENT";
            badgeStyle = 'style="color:#f97316;"';
        } else if (type === "TRANSFER_RECEIVED") {
            typeClass += " transaction-transfer transaction-transfer-received";
            amountClass += " amount-positive amount-transfer-received";
            amountPrefix = "+";
            badgeText = "TRANSFER RECEIVED";
            badgeStyle = 'style="color:#16a34a;"';
        } else if (type === "CONVERSION" || type === "CONVERT") {
            typeClass += " transaction-conversion";
        }

        let currencyDisplay = fromCurrency || toCurrency || "N/A";
        if ((type === "CONVERSION" || type === "CONVERT") && fromCurrency && toCurrency) {
            currencyDisplay = `${fromCurrency} → ${toCurrency}`;
        }

        row.innerHTML = `
            <td>
                <div class="transaction-date">
                    <strong>${formattedDate}</strong>
                    <span>${formattedTime}</span>
                </div>
            </td>
            <td>
                <span class="${typeClass}" ${badgeStyle}>${badgeText}</span>
            </td>
            <td>${details}</td>
            <td>
                <span class="transaction-currency">${currencyDisplay}</span>
            </td>
            <td>
                <span class="${amountClass}">
                    ${amountPrefix}${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}
                    <small>${fromCurrency || toCurrency || ""}</small>
                </span>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// =====================================================
// TRANSACTION ERROR
// =====================================================
function renderTransactionsError() {
    const tableBody = document.getElementById("recentTransactions");
    if (tableBody) {
        tableBody.innerHTML = `<tr><td colspan="5" class="transactions-error">Unable to load transactions.</td></tr>`;
    }
}

// =====================================================
// LOGOUT
// =====================================================
function logout() {
    if (rateRefreshTimer) clearTimeout(rateRefreshTimer);
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("forexiaLiveRates");
    localStorage.removeItem("forexiaPreviousRate_USD_INR");
    localStorage.removeItem("forexiaPreviousRate_EUR_INR");
    localStorage.removeItem("forexiaPreviousRate_GBP_INR");
    window.location.href = "index.html";
}

// =====================================================
// PORTFOLIO CHART & ANALYTICS ENGINE
// =====================================================
let portfolioChartRange = "7D";
const PORTFOLIO_HISTORY_KEY = "forexiaPortfolioHistory";

function savePortfolioSnapshot(totalINR) {
    if (!Number.isFinite(totalINR)) return;
    let history = [];
    try {
        const stored = localStorage.getItem(PORTFOLIO_HISTORY_KEY);
        if (stored) history = JSON.parse(stored);
        if (!Array.isArray(history)) history = [];
    } catch (error) { history = []; }

    const now = Date.now();
    const today = new Date(now).toISOString().split("T")[0];
    const existingIndex = history.findIndex(item => item.date === today);

    const snapshot = { date: today, timestamp: now, value: Number(totalINR.toFixed(2)) };

    if (existingIndex !== -1) history[existingIndex] = snapshot;
    else history.push(snapshot);

    history.sort((a, b) => a.timestamp - b.timestamp);
    const oneYearAgo = now - (365 * 24 * 60 * 60 * 1000);
    history = history.filter(item => item.timestamp >= oneYearAgo);
    localStorage.setItem(PORTFOLIO_HISTORY_KEY, JSON.stringify(history));
}

function getPortfolioHistory() {
    try {
        const stored = localStorage.getItem(PORTFOLIO_HISTORY_KEY);
        if (!stored) return [];
        const history = JSON.parse(stored);
        return Array.isArray(history) ? history : [];
    } catch (error) { return []; }
}

function getPortfolioRangeMilliseconds(range) {
    const day = 24 * 60 * 60 * 1000;
    switch (range) {
        case "7D": return 7 * day;
        case "1M": return 30 * day;
        case "3M": return 90 * day;
        case "1Y": return 365 * day;
        case "ALL": return 10 * 365 * day;
        default: return 7 * day;
    }
}

function changePortfolioRange(range) {
    portfolioChartRange = range;
    document.querySelectorAll(".portfolio-range").forEach(button => {
        button.classList.toggle("active", button.dataset.range === range);
    });
    renderPortfolioChart();
}

function getCachedLiveRate(key) {
    try {
        const cached = localStorage.getItem("forexiaLiveRates");
        if (!cached) return null;
        const cache = JSON.parse(cached);
        if (cache && cache.rates && Number.isFinite(cache.rates[key])) {
            return Number(cache.rates[key]);
        }
    } catch (e) {}
    return null;
}

// Reconstruct authentic valuation history from actual completed transactions
function getReconstructedPortfolioHistory() {
    let history = getPortfolioHistory();

    // If transactions exist, we can reconstruct real financial progression
    if (Array.isArray(currentTransactions) && currentTransactions.length > 0) {
        const sortedTx = [...currentTransactions].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        let runningTotal = 0;
        const txPoints = [];

        sortedTx.forEach(tx => {
            const time = new Date(tx.createdAt).getTime();
            if (isNaN(time)) return;

            const type = (tx.type || "").toUpperCase();
            let inrValue = Number(tx.convertedAmount || 0);

            if (!inrValue || inrValue <= 0) {
                const amt = Number(tx.amount || 0);
                const cur = (tx.fromCurrency || tx.toCurrency || "INR").toUpperCase();
                if (cur === "INR") inrValue = amt;
                else {
                    const rate = getCachedLiveRate(`${cur}_INR`);
                    inrValue = rate ? amt * rate : amt;
                }
            }

            if (type === "DEPOSIT" || type === "TRANSFER_RECEIVED") {
                runningTotal += inrValue;
            } else if (type === "WITHDRAW" || type === "TRANSFER_SENT") {
                runningTotal = Math.max(0, runningTotal - inrValue);
            }

            const dateStr = new Date(time).toISOString().split("T")[0];
            txPoints.push({
                date: dateStr,
                timestamp: time,
                value: Number(runningTotal.toFixed(2))
            });
        });

        // If stored snapshot history is sparse, use transaction points up to current total
        if (history.length <= 1 && txPoints.length > 0) {
            const now = Date.now();
            const today = new Date(now).toISOString().split("T")[0];
            txPoints.push({
                date: today,
                timestamp: now,
                value: Number(currentTotalPortfolioINR.toFixed(2))
            });
            return txPoints;
        }
    }

    // If only 1 snapshot exists and current portfolio has value, provide a baseline point
    if (history.length === 1 && currentTotalPortfolioINR > 0) {
        const single = history[0];
        const dayBefore = {
            date: new Date(single.timestamp - 86400000).toISOString().split("T")[0],
            timestamp: single.timestamp - 86400000,
            value: single.value
        };
        return [dayBefore, single];
    }

    return history;
}

// =====================================================
// RENDER ALL CHARTS
// =====================================================
function renderAllCharts() {
    renderPortfolioChart();
    renderAllocationChart(currentBalances);
    renderCashFlowChart(currentTransactions);

    try {
        const cached = localStorage.getItem("forexiaLiveRates");
        if (cached) {
            const data = JSON.parse(cached);
            if (data && data.rates) renderForexTrendChart(data.rates);
        }
    } catch (e) {}
}

// =====================================================
// 1. RENDER PORTFOLIO VALUATION CHART
// =====================================================
function renderPortfolioChart() {
    const canvas = document.getElementById("portfolioChart");
    const emptyMessage = document.getElementById("portfolioChartEmpty");
    const valueElement = document.getElementById("portfolioChartValue");
    const changeBadge = document.getElementById("portfolioChartChange");
    if (!canvas) return;

    const history = getReconstructedPortfolioHistory();
    const now = Date.now();
    const range = getPortfolioRangeMilliseconds(portfolioChartRange);
    const startTime = now - range;
    let filteredHistory = history.filter(item => item.timestamp >= startTime);

    if (filteredHistory.length === 0 && history.length > 0) {
        filteredHistory = history;
    }

    if (filteredHistory.length === 0 && currentTotalPortfolioINR <= 0) {
        if (portfolioChartInstance) {
            portfolioChartInstance.destroy();
            portfolioChartInstance = null;
        }
        canvas.style.display = "none";
        if (emptyMessage) emptyMessage.style.display = "block";
        if (valueElement) valueElement.textContent = "₹0.00";
        if (changeBadge) changeBadge.textContent = "No Activity";
        return;
    }

    if (filteredHistory.length === 1) {
        const single = filteredHistory[0];
        filteredHistory = [
            { date: single.date, timestamp: single.timestamp - 86400000, value: single.value },
            single
        ];
    }

    canvas.style.display = "block";
    if (emptyMessage) emptyMessage.style.display = "none";

    const latest = filteredHistory[filteredHistory.length - 1];
    const displayVal = latest ? latest.value : currentTotalPortfolioINR;
    if (valueElement) {
        valueElement.textContent = `₹${Number(displayVal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Valuation Percentage Change badge
    if (changeBadge && filteredHistory.length >= 2) {
        const firstVal = filteredHistory[0].value;
        const lastVal = filteredHistory[filteredHistory.length - 1].value;
        if (firstVal > 0) {
            const pct = ((lastVal - firstVal) / firstVal) * 100;
            const sign = pct >= 0 ? "+" : "";
            changeBadge.textContent = `${sign}${pct.toFixed(2)}% (${portfolioChartRange})`;
            changeBadge.className = pct >= 0 ? "rate-performance positive" : "rate-performance negative";
        } else {
            changeBadge.textContent = "Active";
            changeBadge.className = "rate-performance positive";
        }
    }

    // Chart.js Rendering
    if (window.Chart) {
        const labels = filteredHistory.map(item => {
            const d = new Date(item.timestamp);
            return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        });
        const dataValues = filteredHistory.map(item => Number(item.value));

        if (portfolioChartInstance) {
            portfolioChartInstance.destroy();
        }

        const ctx = canvas.getContext("2d");
        const gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, "rgba(99, 102, 241, 0.35)");
        gradient.addColorStop(1, "rgba(99, 102, 241, 0.00)");

        portfolioChartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Portfolio Valuation (INR)",
                    data: dataValues,
                    borderColor: "#6366f1",
                    borderWidth: 2.5,
                    fill: true,
                    backgroundColor: gradient,
                    tension: 0.32,
                    pointBackgroundColor: "#818cf8",
                    pointBorderColor: "#0b0f19",
                    pointBorderWidth: 2,
                    pointRadius: dataValues.length > 25 ? 0 : 3.5,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: "#ffffff",
                    pointHoverBorderColor: "#6366f1"
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#111725",
                        borderColor: "#20283a",
                        borderWidth: 1,
                        padding: 12,
                        titleColor: "#f8fafc",
                        bodyColor: "#94a3b8",
                        callbacks: {
                            label: function (context) {
                                return ` Valuation: ₹${Number(context.parsed.y).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: "rgba(255, 255, 255, 0.04)", drawBorder: false },
                        ticks: { color: "#64748b", font: { size: 11 }, maxTicksLimit: 8 }
                    },
                    y: {
                        grid: { color: "rgba(255, 255, 255, 0.04)", drawBorder: false },
                        ticks: {
                            color: "#64748b",
                            font: { size: 11 },
                            callback: function (val) {
                                return "₹" + (val >= 1000 ? (val / 1000).toFixed(1) + "k" : val);
                            }
                        }
                    }
                }
            }
        });
    } else {
        renderPortfolioChartCanvasFallback(canvas, filteredHistory);
    }
}

// Fallback Canvas Renderer (in case Chart.js CDN is unavailable)
function renderPortfolioChartCanvasFallback(canvas, filteredHistory) {
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 40, left: 65 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = filteredHistory.map(item => Number(item.value));
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const valueRange = maxValue - minValue;
    const chartMin = valueRange === 0 ? minValue - 100 : minValue - valueRange * 0.1;
    const chartMax = valueRange === 0 ? maxValue + 100 : maxValue + valueRange * 0.1;

    const getX = index => filteredHistory.length === 1 ? padding.left : padding.left + (index / (filteredHistory.length - 1)) * chartWidth;
    const getY = value => padding.top + (1 - (value - chartMin) / (chartMax - chartMin)) * chartHeight;

    ctx.strokeStyle = "#20283a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i / 4) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
    }

    ctx.beginPath();
    filteredHistory.forEach((item, index) => {
        const x = getX(index);
        const y = getY(item.value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2.5;
    ctx.stroke();
}

// =====================================================
// 2. RENDER ASSET ALLOCATION DONUT CHART
// =====================================================
function renderAllocationChart(balances) {
    const canvas = document.getElementById("allocationChart");
    const emptyMsg = document.getElementById("allocationChartEmpty");
    const legendContainer = document.getElementById("allocationLegend");
    if (!canvas) return;

    if (!Array.isArray(balances) || balances.length === 0) {
        if (allocationChartInstance) allocationChartInstance.destroy();
        canvas.style.display = "none";
        if (emptyMsg) emptyMsg.style.display = "block";
        if (legendContainer) legendContainer.innerHTML = "";
        return;
    }

    const colorMap = {
        USD: "#10b981",
        EUR: "#6366f1",
        GBP: "#f59e0b",
        INR: "#8b5cf6",
        JPY: "#ec4899",
        AUD: "#06b6d4",
        CAD: "#14b8a6"
    };
    const defaultColors = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

    const items = [];
    let grandTotalINR = 0;

    balances.forEach(b => {
        const cur = String(b.currency || "").toUpperCase();
        const amt = Number(b.balance || 0);
        if (amt <= 0) return;

        let inrEquivalent = amt;
        if (cur !== "INR") {
            const rate = getCachedLiveRate(`${cur}_INR`);
            inrEquivalent = rate ? amt * rate : amt;
        }

        grandTotalINR += inrEquivalent;
        items.push({
            currency: cur,
            balance: amt,
            inrValue: inrEquivalent
        });
    });

    if (items.length === 0 || grandTotalINR <= 0) {
        if (allocationChartInstance) allocationChartInstance.destroy();
        canvas.style.display = "none";
        if (emptyMsg) emptyMsg.style.display = "block";
        if (legendContainer) legendContainer.innerHTML = "";
        return;
    }

    canvas.style.display = "block";
    if (emptyMsg) emptyMsg.style.display = "none";

    items.sort((a, b) => b.inrValue - a.inrValue);

    const labels = items.map(item => item.currency);
    const dataValues = items.map(item => Number(item.inrValue.toFixed(2)));
    const colors = items.map((item, idx) => colorMap[item.currency] || defaultColors[idx % defaultColors.length]);

    if (legendContainer) {
        legendContainer.innerHTML = items.map((item, idx) => {
            const pct = ((item.inrValue / grandTotalINR) * 100).toFixed(1);
            const color = colors[idx];
            return `
                <div class="allocation-item">
                    <div class="allocation-item-left">
                        <span class="allocation-dot" style="background-color: ${color};"></span>
                        <span class="allocation-currency">${item.currency}</span>
                        <span class="allocation-percent">(${pct}%)</span>
                    </div>
                    <span class="allocation-val">₹${item.inrValue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
            `;
        }).join("");
    }

    if (window.Chart) {
        if (allocationChartInstance) {
            allocationChartInstance.destroy();
        }

        const ctx = canvas.getContext("2d");
        allocationChartInstance = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: colors,
                    borderColor: "#111725",
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "72%",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#111725",
                        borderColor: "#20283a",
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function (context) {
                                const item = items[context.dataIndex];
                                const pct = ((item.inrValue / grandTotalINR) * 100).toFixed(1);
                                return ` ${item.currency}: ${item.balance.toFixed(2)} (≈ ₹${item.inrValue.toFixed(2)}) • ${pct}%`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// =====================================================
// 3. RENDER CASH FLOW ACTIVITY BAR CHART
// =====================================================
function renderCashFlowChart(transactions) {
    const canvas = document.getElementById("cashflowChart");
    const emptyMsg = document.getElementById("cashflowChartEmpty");
    if (!canvas) return;

    if (!Array.isArray(transactions) || transactions.length === 0) {
        if (cashflowChartInstance) cashflowChartInstance.destroy();
        canvas.style.display = "none";
        if (emptyMsg) emptyMsg.style.display = "block";
        return;
    }

    const monthlyData = {};
    const now = new Date();

    for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        monthlyData[key] = { inflow: 0, outflow: 0 };
    }

    transactions.forEach(tx => {
        if (!tx.createdAt) return;
        const d = new Date(tx.createdAt);
        if (isNaN(d.getTime())) return;
        const key = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

        if (!monthlyData[key]) {
            monthlyData[key] = { inflow: 0, outflow: 0 };
        }

        const type = (tx.type || "").toUpperCase();
        let val = Number(tx.convertedAmount || tx.amount || 0);

        if (type === "DEPOSIT" || type === "TRANSFER_RECEIVED") {
            monthlyData[key].inflow += val;
        } else if (type === "WITHDRAW" || type === "TRANSFER_SENT") {
            monthlyData[key].outflow += val;
        }
    });

    const labels = Object.keys(monthlyData);
    const inflows = labels.map(k => Number(monthlyData[k].inflow.toFixed(2)));
    const outflows = labels.map(k => Number(monthlyData[k].outflow.toFixed(2)));

    const totalVolume = inflows.reduce((a, b) => a + b, 0) + outflows.reduce((a, b) => a + b, 0);
    if (totalVolume <= 0) {
        if (cashflowChartInstance) cashflowChartInstance.destroy();
        canvas.style.display = "none";
        if (emptyMsg) emptyMsg.style.display = "block";
        return;
    }

    canvas.style.display = "block";
    if (emptyMsg) emptyMsg.style.display = "none";

    if (window.Chart) {
        if (cashflowChartInstance) {
            cashflowChartInstance.destroy();
        }

        const ctx = canvas.getContext("2d");
        cashflowChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [
                    {
                        label: "Inbound (Deposits / Received)",
                        data: inflows,
                        backgroundColor: "rgba(34, 197, 94, 0.75)",
                        borderColor: "#22c55e",
                        borderWidth: 1.5,
                        borderRadius: 5
                    },
                    {
                        label: "Outbound (Withdrawn / Sent)",
                        data: outflows,
                        backgroundColor: "rgba(239, 68, 68, 0.75)",
                        borderColor: "#ef4444",
                        borderWidth: 1.5,
                        borderRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "top",
                        labels: { color: "#94a3b8", font: { size: 11 }, boxWidth: 12 }
                    },
                    tooltip: {
                        backgroundColor: "#111725",
                        borderColor: "#20283a",
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                return ` ${context.dataset.label}: ₹${Number(context.parsed.y).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: "#64748b", font: { size: 11 } }
                    },
                    y: {
                        grid: { color: "rgba(255, 255, 255, 0.04)", drawBorder: false },
                        ticks: {
                            color: "#64748b",
                            font: { size: 11 },
                            callback: function (val) {
                                return "₹" + (val >= 1000 ? (val / 1000).toFixed(1) + "k" : val);
                            }
                        }
                    }
                }
            }
        });
    }
}

// =====================================================
// 4. RENDER FOREX MARKET COMPARATOR BAR CHART
// =====================================================
function renderForexTrendChart(rates) {
    const canvas = document.getElementById("forexTrendChart");
    if (!canvas || !rates) return;

    const usd = Number(rates.USD_INR || 0);
    const eur = Number(rates.EUR_INR || 0);
    const gbp = Number(rates.GBP_INR || 0);

    if (usd <= 0 && eur <= 0 && gbp <= 0) return;

    if (window.Chart) {
        if (forexTrendChartInstance) {
            forexTrendChartInstance.destroy();
        }

        const ctx = canvas.getContext("2d");
        forexTrendChartInstance = new Chart(ctx, {
            type: "bar",
            data: {
                labels: ["USD / INR", "EUR / INR", "GBP / INR"],
                datasets: [{
                    label: "Live Rate (₹)",
                    data: [usd, eur, gbp],
                    backgroundColor: [
                        "rgba(16, 185, 129, 0.75)",
                        "rgba(99, 102, 241, 0.75)",
                        "rgba(245, 158, 11, 0.75)"
                    ],
                    borderColor: ["#10b981", "#6366f1", "#f59e0b"],
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#111725",
                        borderColor: "#20283a",
                        borderWidth: 1,
                        callbacks: {
                            label: function (context) {
                                return ` 1 Unit = ₹${Number(context.parsed.x).toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: "rgba(255, 255, 255, 0.04)", drawBorder: false },
                        ticks: {
                            color: "#64748b",
                            font: { size: 11 },
                            callback: function (v) { return "₹" + v; }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { color: "#f8fafc", font: { size: 12, weight: "600" } }
                    }
                }
            }
        });
    }
}

// =====================================================
// LIVE SYNC & MOBILE NAVIGATION HELPERS
// =====================================================
async function refreshDashboardLive() {
    const btn = document.getElementById("syncNowBtn");
    if (btn) btn.classList.add("spinning");

    localStorage.removeItem("forexiaLiveRates");

    try {
        await loadDashboard();
        lastSyncTimestamp = Date.now();
        updateSyncTimeBadge();
    } finally {
        if (btn) btn.classList.remove("spinning");
    }
}

function updateSyncTimeBadge() {
    const el = document.getElementById("ratesUpdated");
    if (!el) return;
    const diff = Math.floor((Date.now() - lastSyncTimestamp) / 1000);
    if (diff < 15) el.textContent = "Synced just now";
    else if (diff < 60) el.textContent = `Synced ${diff}s ago`;
    else el.textContent = `Synced ${Math.floor(diff / 60)}m ago`;
}

function toggleMobileNav() {
    const nav = document.getElementById("navRight");
    if (nav) nav.classList.toggle("mobile-open");
}

window.addEventListener("resize", () => {
    renderAllCharts();
});