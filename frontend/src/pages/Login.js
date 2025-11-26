import AuthLayout from "../components/AuthLayout";
import { useState } from "react";


export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();
        console.log("Login:", { email, password });
    };

    return (
        <AuthLayout>
            <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md shadow-lg">
                <h2 className="text-3xl font-bold mb-4">Welcome back</h2>
                <p className="text-gray-400 mb-6">Enter your credentials to access your account</p>

                <form onSubmit={handleLogin} className="space-y-4">

                    <div>
                        <label className="block text-sm mb-1">Email Address</label>
                        <input
                            type="email"
                            className="w-full p-3 rounded-lg bg-gray-700 focus:ring-2 ring-blue-500 outline-none"
                            placeholder="you@example.com"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full p-3 rounded-lg bg-gray-700 focus:ring-2 ring-blue-500 outline-none"
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between text-sm">
                        <label className="flex gap-2 items-center">
                            <input type="checkbox" className="accent-blue-500" />
                            Remember me
                        </label>
                        <button className="text-blue-400 hover:underline">Forgot password?</button>
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
