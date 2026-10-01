console.log("DEPOSIT.JS LOADED");


document.addEventListener(
    "DOMContentLoaded",
    loadUserEmail
);


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
// DEPOSIT
// =====================================================

async function deposit() {

    const currency =
        document.getElementById(
            "depositCurrency"
        ).value;


    const amountElement =
        document.getElementById(
            "depositAmount"
        );


    const amount =
        Number(
            amountElement.value
        );


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


    try {

        await apiRequest(
            `/api/wallet/deposit?currency=${encodeURIComponent(currency)}&amount=${encodeURIComponent(amount)}`,
            {
                method: "POST"
            }
        );


        amountElement.value = "";


        showMessage(
            `Successfully deposited ${amount.toFixed(2)} ${currency}`
        );


    } catch (error) {

        console.error(
            "Deposit error:",
            error
        );


        showMessage(
            "Deposit failed: " +
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


function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("email");

    window.location.href =
        "index.html";

}