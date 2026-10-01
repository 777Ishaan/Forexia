const API_BASE_URL = "http://localhost:8080";


// =========================
// LOGIN
// =========================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("message");

        try {

            console.log("Sending login request...");

            const response = await fetch(
                `${API_BASE_URL}/api/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                }
            );

            const data = await response.json();

            console.log("Login status:", response.status);
            console.log("Login response:", data);

            if (!response.ok) {

                message.textContent =
                    data.message || "Login failed";

                message.style.color = "red";

                return;
            }

            if (!data.token) {

                console.error("No JWT token received");

                message.textContent =
                    "Login succeeded but no token was received.";

                message.style.color = "red";

                return;
            }

            // Save JWT
            localStorage.setItem(
                "token",
                data.token
            );

            // Save email
            localStorage.setItem(
                "email",
                email
            );

            console.log("Token saved successfully");

            message.textContent =
                "Login successful!";

            message.style.color = "green";

            // Go to dashboard
            window.location.href =
                "./dashboard.html";

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            message.textContent =
                "Unable to connect to backend.";

            message.style.color = "red";
        }

    });

}


// =========================
// REGISTER
// =========================

const registerForm =
    document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            console.log("REGISTER FORM SUBMITTED");

            const name =
                document.getElementById("name").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const password =
                document.getElementById("password").value;

            const message =
                document.getElementById("message");


            if (!name || !email || !password) {

                message.textContent =
                    "Please fill in all fields";

                message.style.color = "red";

                return;
            }


            try {

                console.log(
                    "Sending registration request..."
                );


                const response =
                    await fetch(
                        `${API_BASE_URL}/api/auth/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email,
                                password: password
                            })
                        }
                    );


                // Read response as TEXT first
                const responseText =
                    await response.text();


                console.log(
                    "Register status:",
                    response.status
                );

                console.log(
                    "Register response:",
                    responseText
                );


                if (!response.ok) {

                    message.textContent =
                        responseText ||
                        "Registration failed";

                    message.style.color = "red";

                    return;
                }


                // Registration successful

                message.textContent =
                    responseText ||
                    "Account created successfully!";

                message.style.color = "green";


                // Redirect to login

                setTimeout(() => {

                    window.location.href =
                        "index.html";

                }, 1000);


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                message.textContent =
                    "Unable to connect to backend.";

                message.style.color = "red";
            }

        }
    );
}