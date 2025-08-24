import { Outlet, NavLink } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-neutral-50 text-neutral-900">
      <aside className="w-72 bg-white border-r shadow-lg">
        <div className="p-6 border-b">
          <div className="text-2xl font-extrabold gradient-text">GiftBloom</div>
          <div className="text-sm text-neutral-500">Admin Dashboard</div>
        </div>

        <nav className="p-6">
          <ul className="space-y-3">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-semibold"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`
                }
              >
                Overview
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/products"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-semibold"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`
                }
              >
                Products
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/users"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-semibold"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`
                }
              >
                Users
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive
                      ? "bg-primary-50 text-primary-700 font-semibold"
                      : "text-neutral-700 hover:bg-neutral-100"
                  }`
                }
              >
                Orders
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="px-6 mt-auto mb-6">
          <button className="btn-secondary w-full">Logout</button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
