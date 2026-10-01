console.log("SEND-MONEY.JS LOADED");


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
// SEND MONEY
// =====================================================

let transferInProgress = false;


async function sendMoney() {

    // Prevent double submission

    if (transferInProgress) {

        return;

    }


    const receiverElement =
        document.getElementById(
            "receiverEmail"
        );

    const currencyElement =
        document.getElementById(
            "transferCurrency"
        );

    const amountElement =
        document.getElementById(
            "transferAmount"
        );

    const sendButton =
        document.getElementById(
            "sendMoneyButton"
        );


    if (
        !receiverElement ||
        !currencyElement ||
        !amountElement
    ) {

        console.error(
            "Send money form elements not found"
        );

        return;

    }


    const receiverEmail =
        receiverElement.value.trim();


    const currency =
        currencyElement.value;


    const amount =
        Number(
            amountElement.value
        );


    const currentUserEmail =
        localStorage.getItem(
            "email"
        );


    // =================================================
    // VALIDATION
    // =================================================

    if (!receiverEmail) {

        showMessage(
            "Enter receiver email",
            true
        );

        return;

    }


    if (
        currentUserEmail &&
        receiverEmail.toLowerCase() ===
        currentUserEmail.toLowerCase()
    ) {

        showMessage(
            "You cannot send money to yourself",
            true
        );

        return;

    }


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
    // START TRANSFER
    // =================================================

    transferInProgress = true;


    if (sendButton) {

        sendButton.disabled = true;

        sendButton.textContent =
            "Sending...";

    }


    // =================================================
    // API REQUEST
    // =================================================

    try {

        console.log(
            "Sending money:",
            {
                receiverEmail,
                currency,
                amount
            }
        );


        const result =
            await apiRequest(
                "/api/wallet/transfer",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        receiverEmail:
                            receiverEmail,

                        currency:
                            currency,

                        amount:
                            amount

                    })

                }
            );


        console.log(
            "Transfer successful:",
            result
        );


        // =================================================
        // CLEAR FORM
        // =================================================

        receiverElement.value = "";

        amountElement.value = "";


        // =================================================
        // SUCCESS MESSAGE
        // =================================================

        showMessage(
            `Successfully sent ${amount.toFixed(2)} ${currency} to ${receiverEmail}`
        );


    } catch (error) {

        console.error(
            "Transfer error:",
            error
        );


        showMessage(
            "Transfer failed: " +
            error.message,
            true
        );

    } finally {

        transferInProgress = false;


        if (sendButton) {

            sendButton.disabled = false;

            sendButton.textContent =
                "Send Money";

        }

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