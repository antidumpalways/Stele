import { Link, useLocation } from "react-router-dom";
import { Menu, X, PenLine, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { useWorldApp } from "@/hooks/useWorldApp";
import { useTheme } from "@/hooks/useTheme";
import { SteleLogoMark } from "./SteleLogo";

const Navbar = () => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isWorldApp } = useWorldApp();
  const { isDark, toggle } = useTheme();

  const links = [
    { to: "/", label: "Home" },
    { to: "/feed", label: "Feed" },
    { to: "/network", label: "Network" },
  ];

  return (
    <nav
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${isWorldApp ? "top-10" : "top-0"}`}
    >
      <div className="mx-4 mt-3 rounded-xl border border-foreground/8 bg-background/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div className="px-5 h-14 flex items-center justify-between">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            data-testid="link-home-logo"
          >
            <SteleLogoMark size={30} className="transition-transform duration-200 group-hover:scale-105" />
            <div className="flex flex-col leading-none">
              <span
                className="font-display font-bold text-base tracking-tight text-gradient-gold"
                style={{ letterSpacing: "-0.01em" }}
              >
                STELE
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/60 tracking-widest uppercase leading-none">
                Witness Protocol
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                  className={`relative px-4 py-2 text-xs font-mono tracking-widest uppercase rounded-lg transition-all duration-200 ${
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  }`}
                >
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                  {link.label}
                </Link>
              );
            })}

            <div className="w-px h-4 bg-border mx-2" />

            {/* Theme toggle */}
            <button
              onClick={toggle}
              data-testid="button-theme-toggle"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all duration-200"
            >
              {isDark
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>

            <Link
              to="/publish"
              data-testid="link-nav-inscribe"
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold tracking-widest uppercase rounded-lg transition-all duration-200 ml-1 ${
                location.pathname === "/publish"
                  ? "bg-primary text-primary-foreground shadow-[0_0_16px_rgba(205,147,60,0.4)]"
                  : "bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:brightness-110 hover:shadow-[0_0_20px_rgba(205,147,60,0.35)] active:scale-95"
              }`}
            >
              <PenLine className="w-3 h-3" />
              Inscribe
            </Link>
          </div>

          {/* Mobile: theme toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggle}
              data-testid="button-theme-toggle-mobile"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              data-testid="button-mobile-menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-foreground/8 px-4 py-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-xs font-mono tracking-widest uppercase transition-colors ${
                  location.pathname === link.to
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/publish"
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 mt-2 bg-gradient-to-r from-primary to-amber-500 text-primary-foreground text-xs font-mono font-bold tracking-widest uppercase rounded-lg"
            >
              <PenLine className="w-3.5 h-3.5" />
              Inscribe Truth
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
