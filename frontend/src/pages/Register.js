import AuthLayout from "../components/AuthLayout";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();
    const [error, setError] = useState("");
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

        if (form.password !== form.confirm) {
            setError("Passwords do not match");
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // SUCCESS: Redirect to Login Page
                alert("Account created successfully! Please sign in."); // Optional user feedback
                navigate("/login");
            } else {
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("Server error. Please try again later.");
        }
    };

    return (
        <AuthLayout>
            <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-lg">
                <h2 className="text-3xl font-bold mb-4">Create account</h2>
                <p className="text-gray-400 mb-6">
                    Sign up to get started with FinScope
                </p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">Full Name</label>
                        <input
                            required
                            className="w-full p-3 rounded-lg bg-gray-700 focus:ring-2 ring-blue-500 outline-none"
                            value={form.name}
                            onChange={(e) => update("name", e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Email Address</label>
                        <input
                            required
                            type="email"
                            className="w-full p-3 rounded-lg bg-gray-700 focus:ring-2 ring-blue-500 outline-none"
                            value={form.email}
                            onChange={(e) => update("email", e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Password</label>
                        <input
                            required
                            type="password"
                            className="w-full p-3 rounded-lg bg-gray-700 focus:ring-2 ring-blue-500 outline-none"
                            value={form.password}
                            onChange={(e) => update("password", e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Confirm Password</label>
                        <input
                            required
                            type="password"
                            className="w-full p-3 rounded-lg bg-gray-700 focus:ring-2 ring-blue-500 outline-none"
                            value={form.confirm}
                            onChange={(e) => update("confirm", e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition"
                    >
                        Create account →
                    </button>
                </form>

                <p className="text-center text-sm mt-6">
                    Already have an account?{" "}
                    <a href="/login" className="text-blue-400 hover:underline">
                        Sign in
                    </a>
                </p>
            </div>
        </AuthLayout>
    );
}