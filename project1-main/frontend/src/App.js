import "@/App.css";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

import { StoreProvider } from "@/lib/store";
import Layout from "@/components/Layout";

import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import Product from "@/pages/Product";
import { BestSellers } from "@/pages/Drops";

import MissionBoard from "@/pages/MissionBoard";
import OperatorJournal from "@/pages/OperatorJournal";

import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import TrackOrder from "@/pages/TrackOrder";

import { Login, Register, Forgot } from "@/pages/Auth";
import { Account, Orders, Wishlist } from "@/pages/Account";
import { Contact, About } from "@/pages/Static";
import Admin from "@/pages/Admin";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter basename="/project1-main">
        <ScrollToTop />

        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />

            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<Product />} />
            <Route path="/best-sellers" element={<BestSellers />} />

            <Route path="/mission-board" element={<MissionBoard />} />
            <Route path="/operator-journal" element={<OperatorJournal />} />

            {/* Old routes redirected to new professional structure */}
            <Route
              path="/new-drop"
              element={<Navigate to="/mission-board" replace />}
            />

            <Route
              path="/collections"
              element={<Navigate to="/operator-journal" replace />}
            />

            <Route
              path="/collections/:slug"
              element={<Navigate to="/operator-journal" replace />}
            />

            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success/:id" element={<OrderSuccess />} />
            <Route path="/track" element={<TrackOrder />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot" element={<Forgot />} />

            <Route path="/account" element={<Account />} />
            <Route path="/account/orders" element={<Orders />} />
            <Route path="/account/wishlist" element={<Wishlist />} />

            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />

            <Route path="/admin" element={<Admin />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
