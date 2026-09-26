import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api",

    headers: {
        "Content-Type": "application/json",
    },
});

// =========================================
// REQUEST INTERCEPTOR
// =========================================

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// =========================================
// RESPONSE INTERCEPTOR
// =========================================

api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const status = error.response?.status;

        // Token expired / invalid
        if (status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            // Avoid redirect loop
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        // 403 = logged in but no permission
        if (status === 403) {
            console.error("Permission denied:", error.response?.data);
        }

        return Promise.reject(error);
    }
);

export default api;