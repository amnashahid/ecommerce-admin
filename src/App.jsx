
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Brands from "./pages/catalog/Brands";
import Categories from "./pages/catalog/Categories";
import Products from "./pages/catalog/Products";
import Banners from "./pages/Banners";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import "./App.css";

import Deals from "./pages/promotions/Deals";
import Sections from "./pages/promotions/Sections";
import PromoCodes from "./pages/promotions/PromoCodes";     

import StoreSettings from "./pages/StoreSettings";
import Users from "./pages/Users";
import Orders from "./pages/Orders";

function AppLayout() {
  const { pathname } = useLocation();
  const showSidebar = pathname !== "/login";

  return (
    <div
      className={`app-shell${     
        showSidebar ? "" : " app-shell-login"
      }`}
    >
      {showSidebar && <Sidebar />}

      <main className="app-content">
        <Routes>
          {/* Login */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Default */}
          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          {/* Banners */}
          <Route
            path="/banners"
            element={
              <ProtectedRoute>
                <Banners />
              </ProtectedRoute>
            }
          />

          {/* Catalog - Brands */}
          <Route
            path="/catalog/brands"
            element={
              <ProtectedRoute>
                <Brands />
              </ProtectedRoute>
            }
          />

          {/* Catalog - Categories */}
          <Route
            path="/catalog/categories"
            element={
              <ProtectedRoute>
                <Categories />
              </ProtectedRoute>
            }
          />

          {/* Catalog - Products */}
          <Route
            path="/catalog/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />

          {/* Orders */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* Promotions - Deals */}
          <Route
            path="/promotions/deals"
            element={
              <ProtectedRoute>
                <Deals />
              </ProtectedRoute>
            }
          />

          {/* Promotions - Sections */}
          <Route
            path="/promotions/sections"
            element={
              <ProtectedRoute>
                <Sections />
              </ProtectedRoute>
            }
          />

          {/* Promotions - Promo Codes */}
          <Route
            path="/promotions/promo-codes"
            element={
              <ProtectedRoute>
                <PromoCodes />
              </ProtectedRoute>
            }
          />


          {/* Customers */}
          <Route
            path="/Customers"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <StoreSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;