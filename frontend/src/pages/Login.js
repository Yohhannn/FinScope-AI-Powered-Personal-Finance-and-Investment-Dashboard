import { useState } from "react";
import { useNavigate } from "react-router-dom";

// 🚀 Use the environment variable for the base API URL
// NOTE: Make sure REACT_APP_API_URL is set to something like:
// 'https://your-digital-ocean-app.com/api' (including the /api prefix)
const BASE_URL = process.env.REACT_APP_API_URL;

// --- FIX: Integrated Dummy AuthLayout Component ---
// This component simulates the layout wrapper for the authentication pages.
// Replace this with your actual imported AuthLayout in your final project structure.
function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
            {children}
        </div>
    );
}
// ----------------------------------------------------

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false); // Manages loading state for UX
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors
        setLoading(true); // Start loading

        // ⚠️ Configuration check
        if (!BASE_URL) {
            setError("Configuration Error: API URL is missing. Check REACT_APP_API_URL.");
            setLoading(false);
            console.error("REACT_APP_API_URL is not defined.");
            return;
        }

        try {
            // ✅ Use the environment variable here
            const response = await fetch(`${BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            // Check if the response is JSON (important for handling 404/500 errors)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Received non-JSON response. Server issue or incorrect endpoint.");
            }

            const data = await response.json();

            if (response.ok) {
                // Success
                console.log("Login Success:", data);
                // Store authentication token (Note: HttpOnly cookies are recommended for production)
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/dashboard");
            } else {
                // Fail (e.g., 401 Unauthorized)
                setError(data.error || "Login failed. Check your email and password.");
            }
        } catch (err) {
            console.error("Connection Error:", err);
            // Catch network errors (like server down or CORS issues)
            setError(`Cannot connect to server: ${err.message || "Please check network and API URL."}`);
        } finally {
            setLoading(false); // Stop loading regardless of success/fail
        }
    };

    return (
        <AuthLayout>
            <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-lg text-white">
                <h2 className="text-3xl font-bold mb-4">Welcome back</h2>
                <p className="text-gray-400 mb-6">Enter your credentials to access your account</p>

                {/* Error Alert Box */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl mb-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full p-3 rounded-lg bg-gray-700 border border-transparent focus:border-blue-500 focus:ring-2 ring-blue-500 outline-none transition"
                            placeholder="you@example.com"
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full p-3 rounded-lg bg-gray-700 border border-transparent focus:border-blue-500 focus:ring-2 ring-blue-500 outline-none transition"
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            disabled={loading}
                        />
                    </div>

                    <div className="flex justify-between text-sm items-center">
                        <label className="flex gap-2 items-center text-gray-400">
                            <input type="checkbox" className="accent-blue-500" />
                            Remember me
                        </label>
                        <button type="button" className="text-blue-400 hover:text-blue-300 hover:underline transition" disabled={loading}>
                            Forgot password?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Sign in →"}
                    </button>
                </form>

                <p className="text-center text-sm mt-6 text-gray-400">
                    Don’t have an account?{" "}
                    <a href="/register" className="text-blue-400 hover:text-blue-300 hover:underline transition">
                        Sign up
                    </a>
                </p>
            </div>
        </AuthLayout>
    );
}