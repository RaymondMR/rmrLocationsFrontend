import { Outlet } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function AppShell() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        background: "var(--background)",
      }}
    >
      <Navbar />
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "1.5rem 1rem",
        }}
        className="px-4 md:px-6 lg:px-8"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
