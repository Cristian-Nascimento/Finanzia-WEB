import { Route, Routes } from 'react-router-dom'
import { AuthLayout } from '@layouts/AuthLayout'
import { DashboardLayout } from '@layouts/DashboardLayout'
import { LoginPage } from '@pages/auth/LoginPage'
import { RegisterPage } from '@pages/auth/RegisterPage'
import { DashboardPage } from '@pages/dashboard/DashboardPage'
import { TransactionsPage } from '@pages/transactions/TransactionsPage'
import { InvestmentsPage } from '@pages/investments/InvestmentsPage'
import { CategoriesPage } from '@pages/categories/CategoriesPage'
import { ProfilePage } from '@pages/profile/ProfilePage'
import { CreditCardPage } from '@pages/creditCard/CreditCardPage'
import { ProtectedRoute } from '@components/auth/ProtectedRoute'

export function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/credit-card" element={<CreditCardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

