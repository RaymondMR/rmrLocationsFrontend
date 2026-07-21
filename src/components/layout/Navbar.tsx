import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  ChevronDown,
  LogOut,
  User,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";
import { APP_NAME } from "@/lib/constants";

export default function Navbar() {
  const navigate = useNavigate();
  const { status, userName, roles, logout } = useAuthStore();
  const { theme, toggleTheme } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isAuthed = status === "authenticated";

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change (handled by link clicks)

  const handleSearch = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && searchQuery.trim()) {
        navigate(`/locations?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery("");
        setMobileMenuOpen(false);
      }
    },
    [searchQuery, navigate]
  );

  const handleLogout = useCallback(() => {
    logout();
    setProfileOpen(false);
    navigate("/");
  }, [logout, navigate]);

  const isAdmin = roles.includes("Admin");

  const navLinks = [
    { label: "Explorar", to: "/locations" },
    { label: "Categorías", to: "/categories" },
    { label: "Tags", to: "/tags" },
    { label: "Contacto", to: "/contact" },
  ];

  if (isAuthed) {
    navLinks.push({ label: "Colecciones", to: "/collections" });
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 1rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
        className="px-4 md:px-6 lg:px-8"
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
            color: "var(--ink)",
            fontFamily: "var(--display)",
            fontSize: "1.2rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <MapPin size={22} style={{ color: "var(--primary)" }} />
          {APP_NAME}
        </Link>

        {/* Desktop Search */}
        <div
          className="hidden lg:block"
          style={{
            flex: 1,
            maxWidth: "400px",
            position: "relative",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Buscar lugares..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--background)",
              color: "var(--ink)",
              fontFamily: "var(--sans)",
              fontSize: "0.875rem",
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--primary)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          />
        </div>

        {/* Desktop Nav Links */}
        <nav
          className="hidden lg:flex"
          style={{
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                color: "var(--ink-muted)",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--background)";
                (e.currentTarget as HTMLElement).style.color = "var(--ink)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--ink-muted)";
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div
          className="hidden lg:flex"
          style={{
            alignItems: "center",
            gap: "0.5rem",
            flexShrink: 0,
          }}
        >
          {/* New Location Button */}
          {isAuthed && (
            <Link
              to="/locations/new"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "8px 14px",
                borderRadius: "8px",
                background: "var(--primary)",
                color: "#fff",
                textDecoration: "none",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "0.9";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = "1";
              }}
            >
              <Plus size={16} />
              Nuevo lugar
            </Link>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--ink-muted)",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--background)";
              (e.currentTarget as HTMLElement).style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--ink-muted)";
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Auth Section */}
          {isAuthed ? (
            <div ref={profileRef} style={{ position: "relative" }}>
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-label="Menú de perfil"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--ink)",
                  cursor: "pointer",
                  fontFamily: "var(--sans)",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--background)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <User size={16} />
                <span style={{ maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {userName ?? "Usuario"}
                </span>
                <ChevronDown size={14} style={{ color: "var(--ink-muted)" }} />
              </button>

              {profileOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    width: "220px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    padding: "6px",
                    zIndex: 60,
                  }}
                >
                  {/* User info */}
                  <div
                    style={{
                      padding: "8px 10px",
                      borderBottom: "1px solid var(--border)",
                      marginBottom: "4px",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontFamily: "var(--display)",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        color: "var(--ink)",
                      }}
                    >
                      {userName ?? "Usuario"}
                    </p>
                    <p
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "0.75rem",
                        color: "var(--ink-muted)",
                        fontFamily: "var(--mono)",
                      }}
                    >
                      {roles.join(", ")}
                    </p>
                  </div>

                  {/* Profile link */}
                  <DropdownItem
                    icon={<User size={15} />}
                    label="Mi perfil"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/profile");
                    }}
                  />

                  {/* Admin Dashboard */}
                  {isAdmin && (
                    <DropdownItem
                      icon={<LayoutDashboard size={15} />}
                      label="Dashboard"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/admin");
                      }}
                    />
                  )}

                  {/* Settings placeholder */}
                  <DropdownItem
                    icon={<Settings size={15} />}
                    label="Configuración"
                    onClick={() => setProfileOpen(false)}
                  />

                  {/* Logout */}
                  <div style={{ borderTop: "1px solid var(--border)", marginTop: "4px", paddingTop: "4px" }}>
                    <DropdownItem
                      icon={<LogOut size={15} />}
                      label="Cerrar sesión"
                      onClick={handleLogout}
                      danger
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Link
                to="/login"
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  color: "var(--ink)",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--background)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                style={{
                  padding: "8px 14px",
                  borderRadius: "8px",
                  background: "var(--primary)",
                  color: "#fff",
                  textDecoration: "none",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.opacity = "1";
                }}
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger + Theme Toggle */}
        <div
          className="flex lg:hidden"
          style={{
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--ink-muted)",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              border: "none",
              background: "transparent",
              color: "var(--ink)",
              cursor: "pointer",
            }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden"
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "1rem",
          }}
        >
          {/* Mobile Search */}
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--ink-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              placeholder="Buscar lugares..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              style={{
                width: "100%",
                padding: "10px 12px 10px 36px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--ink)",
                fontFamily: "var(--sans)",
                fontSize: "0.875rem",
                outline: "none",
              }}
              autoFocus
            />
          </div>

          {/* Mobile Nav Links */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  color: "var(--ink)",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--background)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Auth Actions */}
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            {isAuthed ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <Link
                  to="/locations/new"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "var(--primary)",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Plus size={16} />
                  Nuevo lugar
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    color: "var(--ink)",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                  }}
                >
                  <User size={16} />
                  Mi perfil
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      color: "var(--ink)",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    color: "var(--danger)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    textAlign: "left",
                  }}
                >
                  <LogOut size={16} />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    color: "var(--ink)",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "var(--primary)",
                    color: "#fff",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ---- internal dropdown item ---- */

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

function DropdownItem({ icon, label, onClick, danger }: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        width: "100%",
        padding: "8px 10px",
        borderRadius: "6px",
        border: "none",
        background: "transparent",
        color: danger ? "var(--danger)" : "var(--ink)",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: 500,
        fontFamily: "var(--sans)",
        textAlign: "left",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--background)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {icon}
      {label}
    </button>
  );
}
