import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthProvider';
import RoleGuard from './components/RoleGuard';
import AppLayout from './components/AppLayout';

import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import DevTokens from './pages/DevTokens';

import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import History from './pages/History';
import Materials from './pages/Materials';
import Upload from './pages/Upload';

import MeAttendance from './pages/MeAttendance';
import MeUpcoming from './pages/MeUpcoming';
import MeMaterials from './pages/MeMaterials';

function RootRedirect() {
  const { role } = useAuth();
  if (role === 'mentor') return <Navigate to="/dashboard" replace />;
  if (role === 'student') return <Navigate to="/me/attendance" replace />;
  return <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/dev-tokens" element={<DevTokens />} />

          {/* Root Redirect based on Role */}
          <Route path="/" element={
            <RoleGuard>
              <RootRedirect />
            </RoleGuard>
          } />

          {/* Mentor Routes */}
          <Route element={
            <RoleGuard allowedRoles={['mentor']}>
              <AppLayout />
            </RoleGuard>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/history" element={<History />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/upload" element={<Upload />} />
          </Route>

          {/* Student Routes */}
          <Route element={
            <RoleGuard allowedRoles={['student']}>
              <AppLayout />
            </RoleGuard>
          }>
            <Route path="/me/attendance" element={<MeAttendance />} />
            <Route path="/me/upcoming" element={<MeUpcoming />} />
            <Route path="/me/materials" element={<MeMaterials />} />
          </Route>

          {/* Fallback 404/Unknown */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
