import AuthLayout from "../components/AuthLayout";
import { useState } from "react";
// If you use React Router, import useNavigate
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(""); // State for error messages
    const navigate = useNavigate(); // Hook for redirection

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(""); // Clear previous errors

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // 1. Login Success
                console.log("Login Success:", data);

                // 2. Store the token (important!)
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));

                // 3. Redirect user (e.g., to Dashboard)
                navigate("/dashboard");
            } else {
                // 4. Login Failed
                setError(data.error || "Login failed");
            }
        } catch (err) {
            console.error("Connection Error:", err);
            setError("Server is not responding. Please try again later.");
        }
    };

    return (
        <AuthLayout>
            <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-lg">
                <h2 className="text-3xl font-bold mb-4">Welcome back</h2>
                <p className="text-gray-400 mb-6">Enter your credentials to access your account</p>

                {/* Display Error Message if it exists */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            className="w-full p-3 rounded-lg bg-gray-700 focus:ring-2 ring-blue-500 outline-none"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full p-3 rounded-lg bg-gray-700 focus:ring-2 ring-blue-500 outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between text-sm">
                        <label className="flex gap-2 items-center">
                            <input type="checkbox" className="accent-blue-500" />
                            Remember me
                        </label>
                        <button type="button" className="text-blue-400 hover:underline">Forgot password?</button>
                    </div>

                    <button
                        type="submit"
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                    >
                        Sign in →
                    </button>
                </form>

                <p className="text-center text-sm mt-6">
                    Don’t have an account?{" "}
                    <a href="/register" className="text-blue-400 hover:underline">
                        Sign up
                    </a>
                </p>
            </div>
        </AuthLayout>
    );
}