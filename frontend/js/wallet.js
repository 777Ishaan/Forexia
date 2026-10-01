console.log("WALLET.JS LOADED");


document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadUserEmail();
        loadBalances();

    }
);


// =====================================================
// USER EMAIL
// =====================================================

function loadUserEmail() {

    const email =
        localStorage.getItem("email");

    const element =
        document.getElementById("userEmail");

    if (element && email) {

        element.textContent = email;

    }

}


// =====================================================
// CURRENCY INFORMATION
// =====================================================

function getCurrencyInfo(currency) {

    const currencies = {

        USD: {
            name: "US Dollar",
            symbol: "$",
            icon: "fa-dollar-sign"
        },

        EUR: {
            name: "Euro",
            symbol: "€",
            icon: "fa-euro-sign"
        },

        GBP: {
            name: "British Pound",
            symbol: "£",
            icon: "fa-sterling-sign"
        },

        INR: {
            name: "Indian Rupee",
            symbol: "₹",
            icon: "fa-indian-rupee-sign"
        },

        JPY: {
            name: "Japanese Yen",
            symbol: "¥",
            icon: "fa-yen-sign"
        },

        AUD: {
            name: "Australian Dollar",
            symbol: "A$",
            icon: "fa-dollar-sign"
        },

        CAD: {
            name: "Canadian Dollar",
            symbol: "C$",
            icon: "fa-dollar-sign"
        },

        CHF: {
            name: "Swiss Franc",
            symbol: "CHF",
            icon: "fa-coins"
        },

        CNY: {
            name: "Chinese Yuan",
            symbol: "¥",
            icon: "fa-yen-sign"
        }

    };


    return currencies[currency] || {

        name: currency,

        symbol: "",

        icon: "fa-coins"

    };

}


// =====================================================
// LOAD BALANCES
// =====================================================

async function loadBalances() {

    const container =
        document.getElementById("balances");


    if (!container) {

        return;

    }


    try {

        const balances =
            await apiRequest(
                "/api/wallet/balances",
                {
                    method: "GET"
                }
            );


        container.innerHTML = "";


        // =================================================
        // EMPTY WALLET
        // =================================================

        if (
            !balances ||
            balances.length === 0
        ) {

            container.innerHTML = `

                <div class="empty-message">

                    <i
                        class="fas fa-wallet"
                        style="
                            font-size: 1.5rem;
                            color: var(--primary-light);
                            margin-bottom: 10px;
                        ">
                    </i>

                    <div>
                        No balances yet.
                    </div>

                    <small
                        style="
                            display:block;
                            margin-top:5px;
                            color:var(--text-muted);
                        ">

                        Deposit or exchange currency
                        to get started.

                    </small>

                </div>

            `;

            return;

        }


        // =================================================
        // CREATE BALANCE CARDS
        // =================================================

        balances.forEach(balance => {


            const card =
                document.createElement("div");


            card.className =
                "balance-card";


            const currency =
                String(
                    balance.currency || "UNKNOWN"
                ).toUpperCase();


            const amount =
                Number(
                    balance.balance || 0
                );


            const info =
                getCurrencyInfo(currency);


            // =================================================
            // CARD HTML
            // =================================================

            card.innerHTML = `

                <div class="balance-icon">

                    <i class="fas ${info.icon}"></i>

                </div>


                <div class="currency-code">

                    ${currency}

                </div>


                <h3>

                    ${info.name}

                </h3>


                <div class="balance-amount">

                    ${info.symbol}
                    ${amount.toLocaleString(
                        "en-IN",
                        {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        }
                    )}

                </div>


                <p style="
                    margin-top: 5px;
                ">

                    Available balance

                </p>

            `;


            container.appendChild(card);

        });


    } catch (error) {


        console.error(
            "Balance loading error:",
            error
        );


        container.innerHTML = `

            <div class="empty-message">

                <i
                    class="fas fa-triangle-exclamation"
                    style="
                        color: var(--danger);
                        font-size: 1.4rem;
                        margin-bottom: 10px;
                    ">
                </i>

                <div>

                    Unable to load balances.

                </div>

                <small
                    style="
                        display:block;
                        margin-top:5px;
                        color:var(--text-muted);
                    ">

                    Please try refreshing the page.

                </small>

            </div>

        `;

    }

}


// =====================================================
// NAVIGATION
// =====================================================

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}


function goToTransactions() {

    window.location.href =
        "transactions.html";

}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("email");


    window.location.href =
        "index.html";

}