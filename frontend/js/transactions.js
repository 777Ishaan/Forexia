let allTransactions = [];
let currentFilter = "ALL";
let currentSearch = "";


document.addEventListener("DOMContentLoaded", () => {

    loadTransactions();

    loadUserEmail();

    setupTransactionSearch();

});


// =====================================================
// LOAD TRANSACTIONS
// =====================================================

async function loadTransactions() {

    try {

        const transactions =
            await apiRequest(
                "/api/transactions",
                {
                    method: "GET"
                }
            );


        allTransactions =
            Array.isArray(transactions)
                ? transactions
                : [];


        filterTransactions("ALL");


    } catch (error) {

        console.error(
            "Transaction error:",
            error
        );


        const tableBody =
            document.getElementById(
                "transactionBody"
            );


        const message =
            document.getElementById(
                "transactionMessage"
            );


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="8"
                        class="transactions-error"
                    >

                        <i class="fas fa-circle-exclamation"></i>

                        <strong>
                            Unable to load transactions
                        </strong>

                    </td>

                </tr>

            `;

        }


        if (message) {

            message.textContent =
                "Please try again later.";

        }

    }

}


// =====================================================
// SEARCH
// =====================================================

function setupTransactionSearch() {

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        function () {

            currentSearch =
                this.value
                    .trim()
                    .toLowerCase();


            filterTransactions(
                currentFilter
            );

        }
    );

}


// =====================================================
// FILTER TRANSACTIONS
// =====================================================

function filterTransactions(filter) {

    const tableBody =
        document.getElementById(
            "transactionBody"
        );


    if (!tableBody) {

        return;

    }


    currentFilter = filter;

    tableBody.innerHTML = "";


    // =================================================
    // ACTIVE FILTER
    // =================================================

    const filterButtons =
        document.querySelectorAll(
            ".transaction-filters button"
        );


    filterButtons.forEach(button => {

        button.classList.remove(
            "active-filter"
        );

    });


    const activeButton =
        Array.from(filterButtons)
            .find(button => {

                const onclick =
                    button.getAttribute(
                        "onclick"
                    );


                return onclick &&
                    onclick.includes(
                        `'${filter}'`
                    );

            });


    if (activeButton) {

        activeButton.classList.add(
            "active-filter"
        );

    }


    // =================================================
    // TYPE FILTER
    // =================================================

    let filteredTransactions =
        [...allTransactions];


    if (filter !== "ALL") {

        filteredTransactions =
            allTransactions.filter(
                transaction =>
                    transaction.type === filter
            );

    }


    // =================================================
    // SEARCH FILTER
    // =================================================

    if (currentSearch) {

        filteredTransactions =
            filteredTransactions.filter(
                transaction => {

                    const searchableText = [

                        transaction.type,

                        transaction.relatedUserEmail,

                        transaction.fromCurrency,

                        transaction.toCurrency,

                        transaction.amount,

                        transaction.exchangeRate,

                        transaction.convertedAmount,

                        transaction.createdAt

                    ]
                        .filter(
                            value =>
                                value !== null &&
                                value !== undefined
                        )
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        currentSearch
                    );

                }
            );

    }


    // =================================================
    // NO RESULTS
    // =================================================

    if (
        filteredTransactions.length === 0
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    class="transactions-empty"
                >

                    <div class="empty-icon">

                        <i class="fas fa-receipt"></i>

                    </div>


                    <strong>
                        No transactions found
                    </strong>


                    <span>

                        ${
                            currentSearch
                                ? "No transactions match your search."
                                : "There are no transactions in this category."
                        }

                    </span>

                </td>

            </tr>

        `;

        return;

    }


    // =================================================
    // DISPLAY TRANSACTIONS
    // =================================================

    filteredTransactions.forEach(
        transaction => {


            const row =
                document.createElement("tr");


            row.classList.add(
                "recent-transaction-row"
            );


            // =================================================
            // DATE
            // =================================================

            let formattedDate = "-";


            if (transaction.createdAt) {

                const date =
                    new Date(
                        transaction.createdAt
                    );


                if (!isNaN(date.getTime())) {

                    formattedDate =
                        date.toLocaleString(
                            undefined,
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                            }
                        );

                }

            }


            // =================================================
            // TYPE
            // =================================================

            const type =
                transaction.type ||
                "CONVERSION";


            let displayType =
                type;


            switch (type) {

                case "TRANSFER_SENT":

                    displayType =
                        "Sent";

                    break;


                case "TRANSFER_RECEIVED":

                    displayType =
                        "Received";

                    break;


                case "DEPOSIT":

                    displayType =
                        "Deposit";

                    break;


                case "WITHDRAW":

                    displayType =
                        "Withdraw";

                    break;


                case "CONVERSION":

                    displayType =
                        "Conversion";

                    break;

            }


            // =================================================
            // TYPE CLASS
            // =================================================

            let typeClass = "";


            switch (type) {

                case "TRANSFER_SENT":

                    typeClass =
                        "transaction-transfer-sent";

                    break;


                case "TRANSFER_RECEIVED":

                    typeClass =
                        "transaction-transfer-received";

                    break;


                case "DEPOSIT":

                    typeClass =
                        "transaction-deposit";

                    break;


                case "WITHDRAW":

                    typeClass =
                        "transaction-withdraw";

                    break;


                case "CONVERSION":

                    typeClass =
                        "transaction-conversion";

                    break;

            }


            // =================================================
            // CURRENCIES
            // =================================================

            const from =
                transaction.fromCurrency ||
                "-";


            const to =
                transaction.toCurrency ||
                "-";


            // =================================================
            // AMOUNTS
            // =================================================

            const amount =
                Number(
                    transaction.amount ?? 0
                );


            const exchangeRate =
                Number(
                    transaction.exchangeRate ?? 0
                );


            const convertedAmount =
                Number(
                    transaction.convertedAmount ?? 0
                );


            const formattedAmount =
                amount.toFixed(2);


            const formattedRate =
                exchangeRate.toFixed(4);


            const formattedConvertedAmount =
                convertedAmount.toFixed(2);


            // =================================================
            // AMOUNT COLOR
            // =================================================

            let amountClass =
                "transaction-amount";


            let amountPrefix =
                "";


            if (
                type === "DEPOSIT" ||
                type === "TRANSFER_RECEIVED"
            ) {

                amountClass +=
                    " amount-positive";

                amountPrefix =
                    "+";

            }


            else if (
                type === "TRANSFER_SENT"
            ) {

                amountClass +=
                    " transaction-amount-transfer-sent";

                amountPrefix =
                    "-";

            }


            else if (
                type === "WITHDRAW"
            ) {

                amountClass +=
                    " amount-negative";

                amountPrefix =
                    "-";

            }


            else if (
                type === "CONVERSION"
            ) {

                amountClass +=
                    " amount-conversion";

            }


            // =================================================
            // RELATED USER
            // =================================================

            let relatedUserHTML =
                "";


            if (
                type === "TRANSFER_SENT" &&
                transaction.relatedUserEmail
            ) {

                relatedUserHTML = `

                    <span class="transaction-user">

                        <i class="fas fa-arrow-up"></i>

                        ${transaction.relatedUserEmail}

                    </span>

                `;

            }


            else if (
                type === "TRANSFER_RECEIVED" &&
                transaction.relatedUserEmail
            ) {

                relatedUserHTML = `

                    <span class="transaction-user">

                        <i class="fas fa-arrow-down"></i>

                        ${transaction.relatedUserEmail}

                    </span>

                `;

            }


            // =================================================
            // DETAILS
            // =================================================

            let transactionDetails =
                "";


            switch (type) {

                case "TRANSFER_SENT":

                    transactionDetails = `

                        <div class="transaction-details">

                            <strong>
                                Money sent
                            </strong>

                            ${relatedUserHTML}

                        </div>

                    `;

                    break;


                case "TRANSFER_RECEIVED":

                    transactionDetails = `

                        <div class="transaction-details">

                            <strong>
                                Money received
                            </strong>

                            ${relatedUserHTML}

                        </div>

                    `;

                    break;


                case "DEPOSIT":

                    transactionDetails = `

                        <div class="transaction-details">

                            <strong>
                                Money deposited
                            </strong>

                            <span>
                                Added to wallet
                            </span>

                        </div>

                    `;

                    break;


                case "WITHDRAW":

                    transactionDetails = `

                        <div class="transaction-details">

                            <strong>
                                Money withdrawn
                            </strong>

                            <span>
                                Removed from wallet
                            </span>

                        </div>

                    `;

                    break;


                case "CONVERSION":

                    transactionDetails = `

                        <div class="transaction-details">

                            <strong>
                                Currency conversion
                            </strong>

                            <span>
                                ${from}
                                <i class="fas fa-arrow-right"></i>
                                ${to}
                            </span>

                        </div>

                    `;

                    break;


                default:

                    transactionDetails = `

                        <div class="transaction-details">

                            <strong>
                                ${displayType}
                            </strong>

                        </div>

                    `;

            }


            // =================================================
            // TABLE ROW
            // =================================================

            row.innerHTML = `

                <!-- DATE -->

                <td>

                    <div class="transaction-date">

                        <strong>
                            ${formattedDate}
                        </strong>

                    </div>

                </td>


                <!-- TYPE -->

                <td>

                    <span
                        class="transaction-badge ${typeClass}"
                    >

                        <span class="badge-dot"></span>

                        ${displayType}

                    </span>

                </td>


                <!-- DETAILS -->

                <td>

                    ${transactionDetails}

                </td>


                <!-- FROM -->

                <td>

                    <span class="currency-pill">

                        ${from}

                    </span>

                </td>


                <!-- TO -->

                <td>

                    <span class="currency-pill">

                        ${to}

                    </span>

                </td>


                <!-- AMOUNT -->

                <td>

                    <span
                        class="${amountClass}"
                    >

                        ${amountPrefix}
                        ${formattedAmount}

                    </span>

                </td>


                <!-- RATE -->

                <td>

                    <span class="rate-value">

                        ${formattedRate}

                    </span>

                </td>


                <!-- CONVERTED -->

                <td>

                    <span class="converted-value">

                        ${formattedConvertedAmount}

                    </span>

                </td>

            `;


            tableBody.appendChild(row);

        }
    );

}


// =====================================================
// USER EMAIL
// =====================================================

function loadUserEmail() {

    const email =
        localStorage.getItem(
            "email"
        );


    const element =
        document.getElementById(
            "userEmail"
        );


    if (element) {

        element.textContent =
            email || "";

    }

}


// =====================================================
// DASHBOARD
// =====================================================

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}


// =====================================================
// LOGOUT
// =====================================================

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