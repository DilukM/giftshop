import { Routes, Route } from "react-router-dom";
import DashboardLayout from "./shared/layouts/DashboardLayout";
import Overview from "./features/overview/Overview";
import ProductsPage from "./features/products/pages/ProductsPage";
import UsersPage from "./features/users/UsersPage";
import OrdersPage from "./features/orders/OrdersPage";
import "./index.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Overview />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>
    </Routes>
  );
}
