import { useState } from "react";
import { useNavigate } from "react-router-dom";

// 🚀 Use the environment variable for the base API URL
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

export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false); // Manages loading state for UX
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirm: "",
    });

    const update = (key, value) => setForm({ ...form, [key]: value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // ⚠️ Configuration check
        if (!BASE_URL) {
            setError("Configuration Error: API URL is missing. Check REACT_APP_API_URL.");
            console.error("REACT_APP_API_URL is not defined.");
            return;
        }

        // 1. Validation: Check passwords match
        if (form.password !== form.confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true); // Start loading

        try {
            // ✅ Use the environment variable here
            const response = await fetch(`${BASE_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
            });

            // Check if the response is JSON (important for handling 404/500 errors)
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Received non-JSON response. Server issue or incorrect endpoint.");
            }

            const data = await response.json();

            if (response.ok) {
                // Success: Alert should be replaced with a UI modal/message box
                alert("Account created successfully! Please log in.");
                navigate("/login");
            } else {
                // Fail (e.g., user already exists)
                setError(data.error || "Registration failed. Please check your details.");
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
                <h2 className="text-3xl font-bold mb-4">Create account</h2>
                <p className="text-gray-400 mb-6">Sign up to get started with FinScope</p>

                {/* Error Alert Box */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-xl mb-4 text-sm font-medium">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm mb-1">Full Name</label>
                        <input
                            required
                            className="w-full p-3 rounded-lg bg-gray-700 border border-transparent focus:border-blue-500 focus:ring-2 ring-blue-500 outline-none transition"
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Email Address</label>
                        <input
                            required
                            type="email"
                            className="w-full p-3 rounded-lg bg-gray-700 border border-transparent focus:border-blue-500 focus:ring-2 ring-blue-500 outline-none transition"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Password</label>
                        <input
                            required
                            type="password"
                            className="w-full p-3 rounded-lg bg-gray-700 border border-transparent focus:border-blue-500 focus:ring-2 ring-blue-500 outline-none transition"
                            value={form.password}
                            onChange={(e) => update("password", e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Confirm Password</label>
                        <input
                            required
                            type="password"
                            className="w-full p-3 rounded-lg bg-gray-700 border border-transparent focus:border-blue-500 focus:ring-2 ring-blue-500 outline-none transition"
                            value={form.confirm}
                            onChange={(e) => update("confirm", e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create account →"}
                    </button>
                </form>

                <p className="text-center text-sm mt-6 text-gray-400">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-400 hover:text-blue-300 hover:underline transition">
                        Sign in
                    </a>
                </p>
            </div>
        </AuthLayout>
    );
}