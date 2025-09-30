import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Halls from "./pages/Halls";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import 'bootstrap/dist/css/bootstrap.min.css';
import MyNavBar from "./components/MyNavBar";
import MyFooter from "./components/MyFooter";
import HallDetail from "./pages/HallDetail";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
      <MyNavBar/>
            <Routes>
              <Route path="/" element={<Halls />} />  
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterAndLogout />} />
              <Route path="/logout" element={<Logout />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/halls/:id" element={<HallDetail />} />
            </Routes>

      <MyFooter/>
    </BrowserRouter>
  );
}

export default App;
