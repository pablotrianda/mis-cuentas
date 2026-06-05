import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { IncomesPage } from './features/incomes/IncomesPage'
import { ExpensesPage } from './features/expenses/ExpensesPage'
import { FutureDebtPage } from './features/future-debt/FutureDebtPage'
import { CategoriesPage } from './features/categories/CategoriesPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { FixedExpensesPage } from './features/fixed-expenses/FixedExpensesPage'
import { FixedExpenseDetailPage } from './features/fixed-expenses/FixedExpenseDetailPage'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/incomes" element={<IncomesPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/fixed-expenses" element={<FixedExpensesPage />} />
        <Route path="/fixed-expenses/:id" element={<FixedExpenseDetailPage />} />
        <Route path="/future-debt" element={<FutureDebtPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
