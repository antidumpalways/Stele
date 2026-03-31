import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import Publish from "./pages/Publish";
import Network from "./pages/Network";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import { WorldAppBanner } from "./components/WorldAppBanner";

const queryClient = new QueryClient();

function MiniKitInit() {
  useEffect(() => {
    const appId = import.meta.env.VITE_WORLD_ID_APP_ID || "";
    if (appId) {
      MiniKit.install(appId);
    }
  }, []);
  return null;
}

function ThemeInit() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stele-theme") || "dark";
      const root = document.documentElement;
      if (saved === "light") {
        root.classList.add("light");
        root.classList.remove("dark");
      } else {
        root.classList.add("dark");
        root.classList.remove("light");
      }
    } catch {}
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MiniKitInit />
    <ThemeInit />
    <TooltipProvider>
      <WorldAppBanner />
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/feed"
            element={
              <>
                <Navbar />
                <Feed />
              </>
            }
          />
          <Route
            path="/publish"
            element={
              <>
                <Navbar />
                <Publish />
              </>
            }
          />
          <Route
            path="/network"
            element={
              <>
                <Navbar />
                <Network />
              </>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
