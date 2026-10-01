/* =====================================================
   FOREXIA - PROFILE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadProfile();

});


/* =====================================================
   LOAD PROFILE
===================================================== */

async function loadProfile() {

    try {

        const user =
            await apiRequest(
                "/api/users/me",
                {
                    method: "GET"
                }
            );


        /* =========================
           HEADER
        ========================= */

        const profileName =
            document.getElementById("profileName");

        const profileEmail =
            document.getElementById("profileEmail");


        if (profileName) {

            profileName.textContent =
                user.name || "User";

        }


        if (profileEmail) {

            profileEmail.textContent =
                user.email || "";

        }


        /* =========================
           PROFILE INFORMATION
        ========================= */

        const profileNameInfo =
            document.getElementById(
                "profileNameInfo"
            );

        const profileEmailInfo =
            document.getElementById(
                "profileEmailInfo"
            );

        const profileCreated =
            document.getElementById(
                "profileCreated"
            );


        if (profileNameInfo) {

            profileNameInfo.textContent =
                user.name || "Not provided";

        }


        if (profileEmailInfo) {

            profileEmailInfo.textContent =
                user.email || "Not provided";

        }


        if (profileCreated) {

            profileCreated.textContent =
                formatDate(user.createdAt);

        }


        /* =========================
           NAVBAR EMAIL
        ========================= */

        const userEmail =
            document.getElementById(
                "userEmail"
            );


        if (userEmail) {

            userEmail.textContent =
                user.email || "";

        }


        /*
         * Keep localStorage synchronized
         * with the backend.
         */

        localStorage.setItem(
            "email",
            user.email
        );


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );


        const message =
            document.getElementById(
                "profileMessage"
            );


        if (message) {

            message.textContent =
                "Unable to load profile.";

            message.style.color =
                "#dc2626";

        }

    }

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(dateString) {

    if (!dateString) {

        return "Not available";

    }


    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {

        return "Not available";

    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


/* =====================================================
   UPDATE PROFILE
===================================================== */

async function updateProfile() {

    const name =
        prompt(
            "Enter your new name:"
        );


    if (name === null) {

        return;

    }


    const email =
        prompt(
            "Enter your new email:"
        );


    if (email === null) {

        return;

    }


    try {

        const updatedUser =
            await apiRequest(
                "/api/users/me",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email
                    })

                }
            );


        const message =
            document.getElementById(
                "profileMessage"
            );


        if (message) {

            message.textContent =
                "Profile updated successfully.";

            message.style.color =
                "#16a34a";

        }


        /*
         * Update displayed information
         */

        document.getElementById(
            "profileName"
        ).textContent =
            updatedUser.name;


        document.getElementById(
            "profileEmail"
        ).textContent =
            updatedUser.email;


        document.getElementById(
            "profileNameInfo"
        ).textContent =
            updatedUser.name;


        document.getElementById(
            "profileEmailInfo"
        ).textContent =
            updatedUser.email;


        document.getElementById(
            "userEmail"
        ).textContent =
            updatedUser.email;


        localStorage.setItem(
            "email",
            updatedUser.email
        );


    } catch (error) {

        console.error(
            "Update profile error:",
            error
        );


        const message =
            document.getElementById(
                "profileMessage"
            );


        if (message) {

            message.textContent =
                error.message ||
                "Unable to update profile.";

            message.style.color =
                "#dc2626";

        }

    }

}


/* =====================================================
   CHANGE PASSWORD
===================================================== */

function changePassword() {

    alert(
        "Change password functionality will be added next."
    );

}


/* =====================================================
   DASHBOARD
===================================================== */

function goToDashboard() {

    window.location.href =
        "dashboard.html";

}


/* =====================================================
   LOGOUT
===================================================== */

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