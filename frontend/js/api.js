const API_BASE_URL =
    "http://localhost:8080";


async function apiRequest(
    url,
    options = {}
) {

    const token =
        localStorage.getItem("token");


    const headers = {

        "Content-Type":
            "application/json",

        ...(options.headers || {})

    };


    if (token) {

        headers["Authorization"] =
            `Bearer ${token}`;

    }


    console.log(
        "API Request:",
        API_BASE_URL + url
    );


    const response =
        await fetch(
            API_BASE_URL + url,
            {
                ...options,
                headers
            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            errorText ||
            `Request failed: ${response.status}`
        );

    }


    return response.json();

}


console.log("API.JS LOADED");
console.log(
    "apiRequest:",
    typeof apiRequest
);