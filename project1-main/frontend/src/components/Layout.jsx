import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";

import Nav from "./Nav";
import Footer from "./Footer";
import SlidingCart from "./SlidingCart";

export default function Layout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-gold selection:text-black">
      <Nav />

      <SlidingCart />

      <main className="min-h-[70vh]">
        <Outlet />
      </main>

      <Footer />

      <Toaster
        theme="dark"
        position="top-center"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: "#050505",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "#ffffff",
            borderRadius: "0px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            fontSize: "13px",
            letterSpacing: "0.03em",
          },
        }}
      />
    </div>
  );
}
