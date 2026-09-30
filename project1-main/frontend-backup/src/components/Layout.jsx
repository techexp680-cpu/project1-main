import Nav from "./Nav";
import Footer from "./Footer";
import SlidingCart from "./SlidingCart";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

export default function Layout() {
  return (
    <div className="App">
      <Nav />
      <SlidingCart />
      <main className="min-h-[60vh]">
        <Outlet />
      </main>
      <Footer />
      <Toaster theme="dark" position="top-center" toastOptions={{ style: { background: "#0A0A0A", border: "1px solid #2D2D2D", color: "#fff", borderRadius: 0 } }} />
    </div>
  );
}
