import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./components/Login";
import Chat from "./components/Chat";
import Agents from "./components/Agents";

const queryClient = new QueryClient();

/** Minimal guard that reads auth directly from localStorage (no context/provider). */
const isAuthed = () => Boolean(localStorage.getItem("auth_token"));

/** Simple protected route wrapper */
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const location = useLocation();
  return isAuthed() ? children : <Navigate to="/login" replace state={{ from: location }} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Keep your landing page. If you want to auto-redirect based on auth, see comment below */}
          <Route path="/" element={<Index />} />

          {/* Public login */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route
            path="/agents"
            element={
              <ProtectedRoute>
                <Agents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

/*
If you prefer "/" to auto-redirect based on auth, replace the "/" route with:

<Route
  path="/"
  element={isAuthed() ? <Navigate to="/agents" replace /> : <Navigate to="/login" replace />}
/>

*/
