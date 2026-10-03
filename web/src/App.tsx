import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/AppShell";
import { StoreProvider, useStore, type Role } from "@/lib/store";
import { Family } from "@/pages/Family";
import { Login } from "@/pages/Login";
import { Overview } from "@/pages/Overview";
import { Senior } from "@/pages/Senior";
import { Simulator } from "@/pages/Simulator";
import { Today } from "@/pages/Today";
import { CareShell } from "@/care/AppShell";
import { AuthProvider, RequireAuth } from "@/care/auth";
import { SignIn } from "@/care/SignIn";
import { CallDetail, CallsList } from "@/care/Calls";
import { Landing } from "@/care/Landing";
import { Questions, Settings, SettingsEdit } from "@/care/Settings";
import { CareProvider } from "@/care/state";
import { Today as CareToday } from "@/care/Today";
import { Success, Wizard } from "@/care/Wizard";

// Two products, one engine:
//  "/" …        family app (B2C): landing, wizard, dashboard, calls, questions, settings
//  "/ops" …     social-welfare-centre panel (B2G) with the detection engine on synthetic data
function Guard({ role, children }: { role: Exclude<Role, null>; children: ReactNode }) {
  const { role: current } = useStore();
  if (!current) return <Navigate to="/ops" replace />;
  if (current !== role) return <Navigate to={current === "staff" ? "/panel" : "/rodzina"} replace />;
  return children;
}

function OpsHome() {
  const { role } = useStore();
  if (role === "staff") return <Navigate to="/panel" replace />;
  if (role === "family") return <Navigate to="/rodzina" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
    <CareProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/logowanie" element={<SignIn />} />
            <Route path="/kreator" element={<RequireAuth><Wizard /></RequireAuth>} />
            <Route path="/gotowe" element={<RequireAuth><Success /></RequireAuth>} />
            <Route path="/app" element={<RequireAuth><CareShell /></RequireAuth>}>
              <Route index element={<CareToday />} />
              <Route path="rozmowy" element={<CallsList />} />
              <Route path="rozmowy/:id" element={<CallDetail />} />
              <Route path="pytania" element={<Questions />} />
              <Route path="ustawienia" element={<Settings />} />
              <Route path="ustawienia/:n" element={<SettingsEdit />} />
            </Route>

            <Route path="/ops" element={<OpsHome />} />
            <Route element={<AppShell />}>
              <Route path="/panel" element={<Guard role="staff"><Today /></Guard>} />
              <Route path="/panel/senior/:id" element={<Guard role="staff"><Senior /></Guard>} />
              <Route path="/panel/zbiorczo" element={<Guard role="staff"><Overview /></Guard>} />
              <Route path="/symulator" element={<Guard role="staff"><Simulator /></Guard>} />
              <Route path="/rodzina" element={<Guard role="family"><Family /></Guard>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" />
      </StoreProvider>
    </CareProvider>
    </AuthProvider>
  );
}
