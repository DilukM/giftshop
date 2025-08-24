export default function Overview() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Overview</h2>
        <div className="text-sm text-neutral-500">Welcome back, Admin</div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="card p-6">
          {" "}
          <div className="text-sm text-neutral-500">Total Orders</div>
          <div className="text-2xl font-bold mt-2">—</div>
        </div>
        <div className="card p-6">
          {" "}
          <div className="text-sm text-neutral-500">Total Users</div>
          <div className="text-2xl font-bold mt-2">—</div>
        </div>
        <div className="card p-6">
          {" "}
          <div className="text-sm text-neutral-500">Total Revenue</div>
          <div className="text-2xl font-bold mt-2">—</div>
        </div>
      </div>
    </div>
  );
}
