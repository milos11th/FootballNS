
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Halls from "./pages/Halls";
import NotFound from "./pages/NotFound";
import OwnerDashboard from "./pages/OwnerDashboard";
import HallDetail from "./pages/HallDetail";
import MyNavBar from "./components/MyNavBar";
import MyFooter from "./components/MyFooter";
import RequireOwner from "./components/RequireOwner";
import Logout from "./pages/Logout";

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <BrowserRouter>
        <MyNavBar />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Halls />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/halls/:id" element={<HallDetail />} />
            <Route path="/owner" element={<RequireOwner><OwnerDashboard /></RequireOwner>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <MyFooter />
      </BrowserRouter>
    </div>
  );
}

export default App;
