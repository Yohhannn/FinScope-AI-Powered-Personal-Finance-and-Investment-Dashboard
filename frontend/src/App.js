// --- src/App.js (Revised for Shorter Paths) ---
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Overview/Dashboard";
import PrivateRoute from "./components/PrivateRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* 🟢 CRITICAL CHANGE: Move Dashboard to the root protected path ("/*") */}
                {/* This makes /wallets, /budgets, etc., load the Dashboard component */}
                <Route
                    path="/*" // Match ALL paths not defined above (e.g., /, /wallets, /budgets)
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;