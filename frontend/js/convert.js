console.log("CONVERT.JS LOADED");


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
// CURRENCY CONVERSION
// =====================================================

async function convertCurrency() {

    const fromElement =
        document.getElementById(
            "fromCurrency"
        );

    const toElement =
        document.getElementById(
            "toCurrency"
        );

    const amountElement =
        document.getElementById(
            "convertAmount"
        );

    const resultElement =
        document.getElementById(
            "convertResult"
        );


    if (
        !fromElement ||
        !toElement ||
        !amountElement
    ) {

        console.error(
            "Currency exchange form elements not found"
        );

        return;

    }


    const from =
        fromElement.value;


    const to =
        toElement.value;


    const amount =
        Number(
            amountElement.value
        );


    // =================================================
    // VALIDATION
    // =================================================

    if (from === to) {

        showMessage(
            "Source and destination currencies must be different",
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
    // API REQUEST
    // =================================================

    try {

        console.log(
            "Converting:",
            from,
            to,
            amount
        );


        const result =
            await apiRequest(
                `/api/currency/convert?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&amount=${encodeURIComponent(amount)}`,
                {
                    method: "GET"
                }
            );


        console.log(
            "Conversion result:",
            result
        );


        // =================================================
        // DISPLAY RESULT
        // =================================================

        if (resultElement) {

            resultElement.innerHTML = `

                <strong>
                    ${Number(
                        result.amount
                    ).toFixed(2)}
                    ${result.from}
                </strong>

                =

                <strong>
                    ${Number(
                        result.convertedAmount
                    ).toFixed(2)}
                    ${result.to}
                </strong>

                <br><br>

                Exchange Rate:
                ${Number(
                    result.rate
                ).toFixed(6)}

            `;

        }


        // Clear amount

        amountElement.value = "";


        showMessage(
            "Currency conversion successful"
        );


    } catch (error) {

        console.error(
            "Currency conversion error:",
            error
        );


        showMessage(
            "Currency conversion failed: " +
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

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "email"
    );

    window.location.href =
        "index.html";

}