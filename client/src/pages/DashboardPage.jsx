export default function DashboardPage() {
  return (
    <div className="container section-pad">
      <h2>Admin dashboard</h2>
      <div className="stats-grid">
        <div className="stat-box"><span>Revenue</span><strong>₹18.4L</strong></div>
        <div className="stat-box"><span>Bookings</span><strong>236</strong></div>
        <div className="stat-box"><span>Packages</span><strong>18</strong></div>
        <div className="stat-box"><span>Users</span><strong>142</strong></div>
      </div>
    </div>
  );
}
