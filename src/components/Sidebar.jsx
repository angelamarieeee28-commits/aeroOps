
import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Plane,
  LayoutDashboard,
  CalendarDays,
  BriefcaseBusiness,
  ClipboardList,
  Wrench,
  ClipboardCheck,
  ShieldCheck,
  Layers,
  RefreshCw,
  ChevronDown,
  LogOut,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [expanded, setExpanded] = useState({
    flights: true,
    work: true,
    parts: true,
  });

  const flightActive = location.pathname === "/flights";
  const workActive = location.pathname === "/work-orders";
  const partsActive = ["/parts", "/flight-cycle"].includes(
    location.pathname
  );

  const toggle = (section) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const goToFlight = (operation = "marshall") => {
    navigate("/flights", {
      state: { operation, requestId: Date.now() },
    });
  };

  const goToWork = (category = "All Orders") => {
    navigate("/work-orders", {
      state: { category, requestId: Date.now() },
    });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Plane size={29} />
        <div>
          <h2>AeroOps</h2>
          <span>AVIATION MANAGEMENT</span>
        </div>
      </div>

      <div className="sidebar-label">MAIN MENU</div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>

        <button
          type="button"
          className={`sidebar-link sidebar-group ${
            flightActive ? "active" : ""
          }`}
          onClick={() => toggle("flights")}
          aria-expanded={expanded.flights}
        >
          <CalendarDays size={19} />
          <span>Flight Schedule</span>
          <ChevronDown
            size={16}
            className={expanded.flights ? "chevron-open" : ""}
          />
        </button>

        {expanded.flights && (
          <div className="sidebar-submenu">
            <NavLink
              to="/flights"
              className="sidebar-sublink"
              end
            >
              <CalendarDays size={15} />
              All Flights
            </NavLink>

            <button
              type="button"
              className="sidebar-sublink"
              onClick={() => goToFlight("marshall")}
            >
              <Plane size={15} />
              Marshalling
            </button>

            <button
              type="button"
              className="sidebar-sublink"
              onClick={() => goToFlight("chocks")}
            >
              <ClipboardCheck size={15} />
              Chocks / 360° Inspection
            </button>

            <button
              type="button"
              className="sidebar-sublink"
              onClick={() => goToFlight("fireguard")}
            >
              <ShieldCheck size={15} />
              Fire Guard
            </button>
          </div>
        )}

        <button
          type="button"
          className={`sidebar-link sidebar-group ${
            workActive ? "active" : ""
          }`}
          onClick={() => toggle("work")}
          aria-expanded={expanded.work}
        >
          <BriefcaseBusiness size={19} />
          <span>Work</span>
          <ChevronDown
            size={16}
            className={expanded.work ? "chevron-open" : ""}
          />
        </button>

        {expanded.work && (
          <div className="sidebar-submenu">
            <button
              type="button"
              className="sidebar-sublink"
              onClick={() => goToWork("All Orders")}
            >
              <ClipboardList size={15} />
              Work Orders (Ops)
            </button>

            <button
              type="button"
              className="sidebar-sublink"
              onClick={() => goToWork("Tools Pick Slip")}
            >
              <Wrench size={15} />
              Tools Pick Slip
            </button>

            <button
              type="button"
              className="sidebar-sublink"
              onClick={() => goToWork("Preflight")}
            >
              <Plane size={15} />
              Preflight
            </button>

            <button
              type="button"
              className="sidebar-sublink"
              onClick={() => goToWork("Postflight")}
            >
              <ClipboardCheck size={15} />
              Postflight
            </button>
          </div>
        )}

        <button
          type="button"
          className={`sidebar-link sidebar-group ${
            partsActive ? "active" : ""
          }`}
          onClick={() => toggle("parts")}
          aria-expanded={expanded.parts}
        >
          <Layers size={19} />
          <span>Life-Limited Parts</span>
          <ChevronDown
            size={16}
            className={expanded.parts ? "chevron-open" : ""}
          />
        </button>

        {expanded.parts && (
          <div className="sidebar-submenu">
            <NavLink
              to="/parts"
              className={({ isActive }) =>
                `sidebar-sublink ${isActive ? "active" : ""}`
              }
            >
              <Layers size={15} />
              Parts Register
            </NavLink>

            <NavLink
              to="/flight-cycle"
              className={({ isActive }) =>
                `sidebar-sublink ${isActive ? "active" : ""}`
              }
            >
              <RefreshCw size={15} />
              Flight Cycle
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-bottom">
        <button
          type="button"
          className="logout-button"
          onClick={() => navigate("/")}
        >
          <LogOut size={19} />
          <span>Log Out</span>
        </button>

        <div className="sidebar-profile">
          <div className="profile-avatar">KP</div>
          <div>
            <strong>Kiara Pangilinan</strong>
            <span>Operations Staff</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
