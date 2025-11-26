import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    // If no token, kick them back to login
    if (!token) {
        return <Navigate to="/login" />;
    }

    // If token exists, let them see the page
    return children;
};

export default PrivateRoute;