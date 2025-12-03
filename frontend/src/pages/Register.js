import { useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Integrated Dummy AuthLayout Component ---
// Modified for the split-screen design: flex row
function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex text-white font-inter">
            {children}
        </div>
    );
}

// Icon Components (to avoid external imports, used for the left panel design)
const Zap = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const Wallet = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M5 9h14"/></svg>
);
const TrendingUp = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
);
const ShieldCheck = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
);

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

        // 1. Validation: Check passwords match
        if (form.password !== form.confirm) {
            setError("Passwords do not match");
            return;
        }

        try {
            // 🟢 URL restored to hardcoded value as per request
            const response = await fetch("http://localhost:5000/api/auth/register", {
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
                // Success: Redirect to Login so they can sign in
                alert("Account created! Please log in.");
                navigate("/login");
            } else {
                // Fail: Show error from backend
                setError(data.error || "Registration failed");
            }
        } catch (err) {
            console.error("Connection Error:", err);
            setError("Server is not responding. Please try again later.");
        }
    };

    const FeatureItem = ({ Icon, title, description }) => (
        <div className="flex items-start mb-4 text-sm">
            <Icon className="text-blue-300 flex-shrink-0 mt-1" />
            <div className="ml-3">
                <p className="font-semibold">{title}</p>
                <p className="text-gray-400 text-xs">{description}</p>
            </div>
        </div>
    );

    return (
        <AuthLayout>
            {/* LEFT SIDE: Promotional & Design (Deep Blue) - Consistent with Login.jsx */}
            <div className="hidden lg:flex flex-col justify-center items-start p-16 w-1/2 bg-[#1A4F90] shadow-2xl transition duration-500 ease-in-out">
                <h1 className="text-5xl font-extrabold mb-4 leading-tight">
                    Welcome to the future of <span className="text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-200">financial intelligence</span>.
                </h1>
                <p className="text-lg text-blue-200 mb-10">
                    FinScope is your AI-powered companion for smarter budgeting, investing, and wealth growth.
                </p>

                <div className="space-y-6">
                    <FeatureItem
                        Icon={Zap}
                        title="AI Financial Advisor"
                        description="Get personalized, predictive advice based on your real spending patterns."
                    />
                    <FeatureItem
                        Icon={Wallet}
                        title="Unified Wallet Management"
                        description="Track all balances (bank, e-wallet, cash) in one centralized, secure dashboard."
                    />
                    <FeatureItem
                        Icon={TrendingUp}
                        title="Predictive Budgeting"
                        description="AI predicts goal achievement and suggests real-time improvements to savings habits."
                    />
                    <FeatureItem
                        Icon={ShieldCheck}
                        title="Bank-Grade Security"
                        description="Your data is protected with industry-leading encryption and privacy protocols."
                    />
                </div>
            </div>

            {/* RIGHT SIDE: Registration Form (Dark Charcoal) - Consistent with Login.jsx */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-[#16181C]">
                <div className="bg-[#24262A] p-8 rounded-xl w-full max-w-sm shadow-2xl">
                    <h2 className="text-xl font-bold mb-1">Create Account</h2>
                    <p className="text-gray-400 mb-6 text-sm">Sign up to get started with FinScope</p>

                    {/* Error Alert Box */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-400">Full Name</label>
                            <input
                                required
                                className="w-full p-3 rounded-lg bg-[#313337] border border-[#313337] focus:border-blue-500 focus:ring-1 ring-blue-500 outline-none transition duration-200 text-sm"
                                value={form.name}
                                onChange={(e) => update("name", e.target.value)}
                            />
                        </div>

                        {/* Email Address */}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-400">Email Address</label>
                            <input
                                required
                                type="email"
                                className="w-full p-3 rounded-lg bg-[#313337] border border-[#313337] focus:border-blue-500 focus:ring-1 ring-blue-500 outline-none transition duration-200 text-sm"
                                value={form.email}
                                onChange={(e) => update("email", e.target.value)}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-400">Password</label>
                            <input
                                required
                                type="password"
                                className="w-full p-3 rounded-lg bg-[#313337] border border-[#313337] focus:border-blue-500 focus:ring-1 ring-blue-500 outline-none transition duration-200 text-sm"
                                value={form.password}
                                onChange={(e) => update("password", e.target.value)}
                            />
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-xs font-medium mb-1 text-gray-400">Confirm Password</label>
                            <input
                                required
                                type="password"
                                className="w-full p-3 rounded-lg bg-[#313337] border border-[#313337] focus:border-blue-500 focus:ring-1 ring-blue-500 outline-none transition duration-200 text-sm"
                                value={form.confirm}
                                onChange={(e) => update("confirm", e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full p-3 mt-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition duration-200 text-sm shadow-md shadow-blue-900/50"
                        >
                            Create account →
                        </button>
                    </form>

                    <p className="text-center text-xs mt-6 text-gray-500">
                        Already have an account?{" "}
                        <a href="/login" className="text-blue-400 hover:text-blue-300 hover:underline transition">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
}
