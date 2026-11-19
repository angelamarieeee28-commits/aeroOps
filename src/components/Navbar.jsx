
import { Bell, ChevronDown, Search } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-title">
        <h2>Aircraft Operations</h2>
        <p>Ground Operations & Maintenance Management</p>
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <Search size={17} />
          <span>Search operations...</span>
        </div>

        <button className="notification-button" aria-label="Notifications">
          <Bell size={20} />
          <span className="notification-dot"></span>
        </button>

        <div className="navbar-user">
          <div className="user-avatar">KP</div>
          <div className="user-info">
            <strong>Kiara Pangilinan</strong>
            <span>Operations Staff</span>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
