import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Halls from "./pages/Halls";
import NotFound from "./pages/NotFound";
import OwnerDashboard from "./pages/OwnerDashboard";
import HallDetail from "./pages/HallDetail";
import UserDashboard from "./pages/UserDashboard";
import MyNavBar from "./components/MyNavBar";
import MyFooter from "./components/MyFooter";
import RequireAuth from "./components/RequireAuth";
import RequireOwner from "./components/RequireOwner";
import Logout from "./pages/Logout";
import "../src/styles/index.css";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="d-flex flex-column min-vh-100">
          <BrowserRouter>
            <MyNavBar />
            <main className="flex-grow-1">
              <Routes>
                <Route path="/" element={<Halls />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/logout" element={<Logout />} />
                <Route
                  path="/halls/:id"
                  element={
                    <RequireAuth>
                      <HallDetail />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/my-appointments"
                  element={
                    <RequireAuth>
                      <UserDashboard />
                    </RequireAuth>
                  }
                />
                <Route
                  path="/owner"
                  element={
                    <RequireOwner>
                      <OwnerDashboard />
                    </RequireOwner>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <MyFooter />
          </BrowserRouter>
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
