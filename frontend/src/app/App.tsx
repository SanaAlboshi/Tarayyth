import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { AuthProvider, useAuth } from "../features/auth/authStore";
import { ThemeProvider } from "../features/theme/themeStore";
import { AnalysisProvider } from "../features/analysis/analysisStore";
import { NotificationsProvider } from "../features/notifications/notificationsStore";
import { AppShell } from "../components/shared/AppShell";
import { LandingPage } from "../features/landing/LandingPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { AnalysisPage } from "../features/individuals/AnalysisPage";
import { StressTestPage } from "../features/individuals/StressTestPage";
import { CustomerProfilePage } from "../features/individuals/CustomerProfilePage";
import { FinancingReadinessPage } from "../features/readiness/FinancingReadinessPage";
import { SavingsPlanPage } from "../features/savingsPlan/SavingsPlanPage";
import { MonthlyCheckinPage } from "../features/checkin/MonthlyCheckinPage";
import { CheckinProvider } from "../features/checkin/checkinStore";
import { ActivePlanProvider } from "../features/savingsPlan/activePlanStore";
import { GoalsProvider } from "../features/goals/goalsStore";
import { WalletProvider } from "../features/wallet/walletStore";

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

function RootRedirect() {
  const { user } = useAuth();
  if (user) return <Navigate to="/app/financial-analysis" replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <AnalysisProvider>
            <CheckinProvider>
            <ActivePlanProvider>
            <GoalsProvider>
            <WalletProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Unified overview — Financial Analysis is the primary page */}
                <Route
                  path="/app/financial-analysis"
                  element={
                    <RequireAuth>
                      <AppShell>
                        <AnalysisPage />
                      </AppShell>
                    </RequireAuth>
                  }
                />

                {/* Legacy paths redirect to the unified page */}
                <Route path="/app" element={<Navigate to="/app/financial-analysis" replace />} />
                <Route
                  path="/app/dashboard"
                  element={<Navigate to="/app/financial-analysis" replace />}
                />
                <Route
                  path="/app/analysis"
                  element={<Navigate to="/app/financial-analysis" replace />}
                />
                <Route
                  path="/app/stress-test"
                  element={
                    <RequireAuth>
                      <AppShell>
                        <StressTestPage />
                      </AppShell>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/readiness"
                  element={
                    <RequireAuth>
                      <AppShell>
                        <FinancingReadinessPage />
                      </AppShell>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/savings-plan"
                  element={
                    <RequireAuth>
                      <AppShell>
                        <SavingsPlanPage />
                      </AppShell>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/checkin"
                  element={
                    <RequireAuth>
                      <AppShell>
                        <MonthlyCheckinPage />
                      </AppShell>
                    </RequireAuth>
                  }
                />
                <Route
                  path="/app/profile"
                  element={
                    <RequireAuth>
                      <AppShell>
                        <CustomerProfilePage />
                      </AppShell>
                    </RequireAuth>
                  }
                />

                {/* Legacy Goal Progress URLs redirect to the Dashboard */}
                <Route
                  path="/app/goal-progress/*"
                  element={<Navigate to="/app/financial-analysis" replace />}
                />
                <Route path="/app/progress/*" element={<Navigate to="/app/financial-analysis" replace />} />
                <Route path="/app/goal/*" element={<Navigate to="/app/financial-analysis" replace />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
            </WalletProvider>
            </GoalsProvider>
            </ActivePlanProvider>
            </CheckinProvider>
          </AnalysisProvider>
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
