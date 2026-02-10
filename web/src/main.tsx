import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
// import App from './App.tsx'
import { PublicWebsite } from './pages/PublicWebsite.tsx'
import { AdminLogin } from './pages/admin/AdminLogin.tsx'
// import { CreateLead } from './pages/CreateLead.tsx'
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx'
import { ResetPassword } from './pages/admin/ResetPassword.tsx'
import { AuditPage } from './pages/AuditPage.tsx'

import { DomainRouter } from './DomainRouter.tsx'

import { DomainAdminRedirect } from './components/admin/DomainAdminRedirect.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DomainRouter />} />
        <Route path="/admin" element={<DomainAdminRedirect />} />
        {/* Public Website */}
        <Route path="/w/:slug" element={<PublicWebsite />} />

        {/* Audit Funnel */}
        <Route path="/audit/:token" element={<AuditPage />} />

        {/* Admin Panel */}
        <Route path="/w/:slug/admin/login" element={<AdminLogin />} />
        <Route path="/w/:slug/admin/reset-password" element={<ResetPassword />} />
        <Route path="/w/:slug/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
