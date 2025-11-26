export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex">
            {/* LEFT SIDE */}
            <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white p-12 flex-col justify-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to the future of<br/>financial intelligence</h1>

                <p className="text-blue-200 mb-6">
                    Manage your wallets, track your investments, and unlock smart insights powered by AI.
                </p>

                <ul className="space-y-3 text-blue-100">
                    <li className="flex items-center gap-2">✔ Smart budget tracking</li>
                    <li className="flex items-center gap-2">✔ AI-powered financial advice</li>
                    <li className="flex items-center gap-2">✔ Multi-wallet & crypto support</li>
                    <li className="flex items-center gap-2">✔ Real-time sentiment analysis</li>
                </ul>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex w-full md:w-1/2 bg-gray-900 text-white justify-center items-center p-6">
                {children}
            </div>
        </div>
    );
}
