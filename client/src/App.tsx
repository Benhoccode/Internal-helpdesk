import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthProvider'
import { AdminRoute } from './components/auth/AdminRoute'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { CreateTicketPage } from './pages/CreateTicketPage'
import { DashboardPage } from './pages/DashboardPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { ArticleDetailPage } from './pages/ArticleDetailPage'
import { ArticleFormPage } from './pages/ArticleFormPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { TicketDetailPage } from './pages/TicketDetailPage'
import { TicketListPage } from './pages/TicketListPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="tickets" element={<TicketListPage />} />
              <Route path="tickets/new" element={<CreateTicketPage />} />
              <Route path="tickets/:id" element={<TicketDetailPage />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="knowledge/:slug" element={<ArticleDetailPage />} />
              <Route element={<AdminRoute />}>
                <Route path="knowledge/manage" element={<KnowledgePage management />} />
                <Route path="knowledge/new" element={<ArticleFormPage />} />
                <Route path="knowledge/:slug/edit" element={<ArticleFormPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
