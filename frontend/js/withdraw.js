console.log("WITHDRAW.JS LOADED");


// =====================================================
// PAGE LOAD
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    loadUserEmail
);


// =====================================================
// LOAD USER EMAIL
// =====================================================

function loadUserEmail() {

    const email =
        localStorage.getItem("email");

    const element =
        document.getElementById("userEmail");

    if (element && email) {

        element.textContent =
            email;

    }

}


// =====================================================
// WITHDRAW
// =====================================================

async function withdraw() {

    const currencyElement =
        document.getElementById(
            "withdrawCurrency"
        );

    const amountElement =
        document.getElementById(
            "withdrawAmount"
        );


    if (
        !currencyElement ||
        !amountElement
    ) {

        console.error(
            "Withdraw form elements not found"
        );

        return;

    }


    const currency =
        currencyElement.value;


    const amount =
        Number(
            amountElement.value
        );


    // =================================================
    // VALIDATION
    // =================================================

    if (
        !amount ||
        amount <= 0
    ) {

        showMessage(
            "Enter a valid amount",
            true
        );

        return;

    }


    // =================================================
    // API REQUEST
    // =================================================

    try {

        console.log(
            "Withdrawing:",
            currency,
            amount
        );


        await apiRequest(
            `/api/wallet/withdraw?currency=${encodeURIComponent(currency)}&amount=${encodeURIComponent(amount)}`,
            {
                method: "POST"
            }
        );


        // Clear amount

        amountElement.value = "";


        // Success message

        showMessage(
            `Successfully withdrew ${amount.toFixed(2)} ${currency}`
        );


    } catch (error) {

        console.error(
            "Withdraw error:",
            error
        );


        showMessage(
            "Withdrawal failed: " +
            error.message,
            true
        );

    }

}


// =====================================================
// MESSAGE
// =====================================================

function showMessage(
    message,
    error = false
) {

    const element =
        document.getElementById(
            "message"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.style.color =
        error
            ? "#dc2626"
            : "#16a34a";

}


// =====================================================
// NAVIGATION
// =====================================================

function goToWallet() {

    window.location.href =
        "wallet.html";

}


function goToDashboard() {

    window.location.href =
        "dashboard.html";

}


function goToTransactions() {

    window.location.href =
        "transactions.html";

}


function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("email");

    window.location.href =
        "index.html";

}