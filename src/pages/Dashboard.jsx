
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plane,
  CalendarDays,
  ClipboardList,
  Layers,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Clock3,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ShieldCheck
} from "lucide-react";
import "./Dashboard.css";
import { getFlightProgress, readGroundTasks } from "../flightStatus.js";

const defaultFlights = [
  {
    id: "PR 204",
    aircraft: "Airbus A320",
    registration: "RP-C8612",
    route: "MNL → CEB",
    departure: "08:45",
    bay: "Bay 03",
    status: "In Progress"
  },
  {
    id: "5J 615",
    aircraft: "Airbus A321",
    registration: "RP-C4110",
    route: "CEB → MNL",
    departure: "10:20",
    bay: "Bay 05",
    status: "Scheduled"
  },
  {
    id: "PR 186",
    aircraft: "Airbus A320",
    registration: "RP-C8607",
    route: "MNL → DVO",
    departure: "12:15",
    bay: "Bay 02",
    status: "Scheduled"
  },
  {
    id: "5J 931",
    aircraft: "Airbus A320",
    registration: "RP-C3299",
    route: "MNL → ILO",
    departure: "14:30",
    bay: "Bay 01",
    status: "Scheduled"
  }
];

const defaultOrders = [
  {
    id: "WO-1024",
    title: "Preflight Exterior Inspection",
    category: "Preflight",
    flight: "PR 204",
    status: "In Progress"
  },
  {
    id: "WO-1025",
    title: "Ground Tool Collection",
    category: "Tools Pick Slip",
    flight: "5J 615",
    status: "Pending"
  },
  {
    id: "WO-1026",
    title: "Postflight Inspection",
    category: "Postflight",
    flight: "PR 186",
    status: "Completed"
  },
  {
    id: "WO-1027",
    title: "Aircraft Turnaround Coordination",
    category: "Operations",
    flight: "5J 931",
    status: "Pending"
  }
];

const defaultParts = [
  { cyclesUsed: 17750, cycleLimit: 20000 },
  { cyclesUsed: 9400, cycleLimit: 10000 },
  { cyclesUsed: 12800, cycleLimit: 18000 },
  { cyclesUsed: 14950, cycleLimit: 15000 },
  { cyclesUsed: 7200, cycleLimit: 12000 }
];

function readArray(key, fallback = []) {
  try {
    const stored = localStorage.getItem(key);

    if (stored === null) return fallback;

    const parsed = JSON.parse(stored);

    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function getDashboardData() {
  const tasks = readGroundTasks();

  return {
    flights: readArray("aeroops-flights", defaultFlights).map(flight => ({
      ...flight,
      status: getFlightProgress(flight, tasks).status
    })),
    orders: readArray("aeroops-workorders", defaultOrders),
    parts: readArray("aeroops-parts", defaultParts),
    cycles: readArray("aeroops-flight-cycles", [])
  };
}

function getPartStatus(part) {
  const remaining =
    Number(part.cycleLimit) - Number(part.cyclesUsed);

  if (remaining <= 500) return "Critical";
  if (remaining <= 1500) return "Near Limit";
  return "Normal";
}

function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(getDashboardData);

  useEffect(() => {
    const refresh = () => {
      setData(getDashboardData());
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("aeroops-data-updated", refresh);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("aeroops-data-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const { flights, orders, parts, cycles } = data;

  const openOrders = orders.filter(
    order => order.status !== "Completed"
  ).length;

  const pendingOrders = orders.filter(
    order => order.status === "Pending"
  ).length;

  const inProgressOrders = orders.filter(
    order => order.status === "In Progress"
  ).length;

  const completedOrders = orders.filter(
    order => order.status === "Completed"
  ).length;

  const scheduledFlights = flights.filter(
    flight => flight.status === "Scheduled"
  ).length;

  const inProgressFlights = flights.filter(
    flight => flight.status === "In Progress"
  ).length;

  const completedFlights = flights.filter(
    flight => flight.status === "Completed"
  ).length;

  const criticalParts = parts.filter(
    part => getPartStatus(part) === "Critical"
  ).length;

  const nearLimitParts = parts.filter(
    part => getPartStatus(part) === "Near Limit"
  ).length;

  const normalParts = parts.filter(
    part => getPartStatus(part) === "Normal"
  ).length;

  const totalRecordedCycles = cycles.reduce((total, record) => {
    const value = Number(
      record.cycles ?? record.cycleCount ?? 0
    );

    return total + (Number.isFinite(value) ? value : 0);
  }, 0);

  const statCards = [
    {
      label: "Total Flights",
      value: flights.length,
      icon: Plane,
      tone: "blue",
      detail: `${scheduledFlights} scheduled`
    },
    {
      label: "Open Work Orders",
      value: openOrders,
      icon: ClipboardList,
      tone: "orange",
      detail: `${inProgressOrders} in progress`
    },
    {
      label: "Tracked Components",
      value: parts.length,
      icon: Layers,
      tone: "purple",
      detail: `${criticalParts} critical`
    },
    {
      label: "Flight Cycles Recorded",
      value: totalRecordedCycles,
      icon: RefreshCw,
      tone: "green",
      detail: `${cycles.length} cycle records`
    }
  ];

  const modules = [
    {
      title: "Flight Schedule",
      description: "Marshalling, Chocks, 360° Inspection and Fire Guard",
      icon: CalendarDays,
      tone: "blue",
      path: "/flights"
    },
    {
      title: "Work Orders",
      description: "Operations, Tools Pick Slip, Preflight and Postflight",
      icon: ClipboardList,
      tone: "purple",
      path: "/work-orders"
    },
    {
      title: "Life-Limited Parts",
      description: "Component records, cycle limits and remaining life",
      icon: Layers,
      tone: "orange",
      path: "/parts"
    },
    {
      title: "Flight Cycle",
      description: "Record and review aircraft flight cycles",
      icon: RefreshCw,
      tone: "green",
      path: "/flight-cycle"
    }
  ];

  const statusClass = value =>
    String(value || "Pending")
      .toLowerCase()
      .replaceAll(" ", "-");

  return (
    <div className="aero-dashboard">
      <div className="aero-dashboard-heading">
        <div>
          <p className="aero-dashboard-eyebrow">
            OPERATIONS OVERVIEW
          </p>
          <h1>Dashboard</h1>
          <p>
            Flight operations and aircraft maintenance overview
          </p>
        </div>

        <button
          className="aero-dashboard-refresh"
          onClick={() => setData(getDashboardData())}
        >
          <RefreshCw size={17} />
          Refresh Data
        </button>
      </div>

      {/* WELCOME BANNER */}
      <div className="aero-welcome-banner">
        <div className="aero-welcome-content">
          <span>GROUND & MAINTENANCE OPERATIONS</span>
          <h2>Welcome to AeroOps</h2>
          <p>
            Manage flight schedules, ground operations,
            work orders and aircraft component records.
          </p>
          <button onClick={() => navigate("/flights")}>
            Open Flight Schedule
            <ArrowUpRight size={17} />
          </button>
        </div>

      </div>

      {/* QUICK ACCESS */}
      <div className="aero-dashboard-section-heading">
        <div>
          <h2>Operations Modules</h2>
          <p>Access AeroOps management features</p>
        </div>
      </div>

      <div className="aero-module-grid">
        {modules.map(module => {
          const Icon = module.icon;

          return (
            <button
              key={module.title}
              className="aero-module-card"
              onClick={() => navigate(module.path)}
            >
              <div className={`aero-module-icon ${module.tone}`}>
                <Icon size={24} />
              </div>

              <strong>{module.title}</strong>
              <p>{module.description}</p>

              <span className="aero-module-open">
                Open Module <ArrowUpRight size={15} />
              </span>
            </button>
          );
        })}
      </div>

      {/* DYNAMIC STATISTICS */}
      <div className="aero-dashboard-section-heading">
        <div>
          <h2>Operations at a Glance</h2>
          <p>Statistics from your saved records</p>
        </div>
      </div>

      <div className="aero-stat-grid">
        {statCards.map(card => {
          const Icon = card.icon;

          return (
            <div className="aero-stat-card" key={card.label}>
              <div className="aero-stat-top">
                <span>{card.label}</span>
                <div className={`aero-stat-icon ${card.tone}`}>
                  <Icon size={21} />
                </div>
              </div>

              <strong>{card.value.toLocaleString()}</strong>
              <p>{card.detail}</p>
            </div>
          );
        })}
      </div>

      {/* FLIGHTS AND QUICK ACTIONS */}
      <div className="aero-dashboard-columns">
        <div className="aero-dashboard-panel">
          <div className="aero-panel-heading">
            <div>
              <h2>Flight Schedule</h2>
              <p>Current flight records</p>
            </div>

            <button onClick={() => navigate("/flights")}>
              View All <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="aero-dashboard-table-wrap">
            <table className="aero-dashboard-table">
              <thead>
                <tr>
                  <th>Flight</th>
                  <th>Aircraft</th>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {flights.slice(0, 5).map(flight => (
                  <tr key={flight.id}>
                    <td>
                      <strong>{flight.id}</strong>
                    </td>
                    <td>{flight.registration || flight.aircraft}</td>
                    <td>{flight.route}</td>
                    <td>{flight.departure}</td>
                    <td>
                      <span className={`aero-status ${
                        statusClass(flight.status)
                      }`}>
                        {flight.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {flights.length === 0 && (
              <p className="aero-empty">
                No flight records available.
              </p>
            )}
          </div>
        </div>

        <div className="aero-dashboard-panel">
          <div className="aero-panel-heading">
            <div>
              <h2>Quick Actions</h2>
              <p>Frequently used tasks</p>
            </div>
          </div>

          <div className="aero-quick-actions">
            <button onClick={() => navigate("/work-orders")}>
              <span className="aero-quick-icon blue">
                <Plus size={19} />
              </span>
              <span>
                <strong>Manage Work Orders</strong>
                <small>Create and update work orders</small>
              </span>
              <ArrowUpRight size={17} />
            </button>

            <button onClick={() => navigate("/flight-cycle")}>
              <span className="aero-quick-icon green">
                <RefreshCw size={19} />
              </span>
              <span>
                <strong>Record Flight Cycle</strong>
                <small>Manage aircraft cycle history</small>
              </span>
              <ArrowUpRight size={17} />
            </button>

            <button onClick={() => navigate("/parts")}>
              <span className="aero-quick-icon orange">
                <Layers size={19} />
              </span>
              <span>
                <strong>Manage Components</strong>
                <small>Update life-limited parts</small>
              </span>
              <ArrowUpRight size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* RECORD STATUS */}
      <div className="aero-dashboard-columns aero-bottom-panels">
        <div className="aero-dashboard-panel">
          <div className="aero-panel-heading">
            <div>
              <h2>Work Order Status</h2>
              <p>Current task distribution</p>
            </div>

            <button onClick={() => navigate("/work-orders")}>
              View All <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="aero-breakdown-grid">
            <div>
              <Clock3 size={21} color="#d5962c" />
              <strong>{pendingOrders}</strong>
              <span>Pending</span>
            </div>

            <div>
              <Wrench size={21} color="#1768d9" />
              <strong>{inProgressOrders}</strong>
              <span>In Progress</span>
            </div>

            <div>
              <CheckCircle2 size={21} color="#159966" />
              <strong>{completedOrders}</strong>
              <span>Completed</span>
            </div>
          </div>
        </div>

        <div className="aero-dashboard-panel">
          <div className="aero-panel-heading">
            <div>
              <h2>Component Status</h2>
              <p>Life-Limited Parts monitoring</p>
            </div>

            <button onClick={() => navigate("/parts")}>
              View All <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="aero-breakdown-grid">
            <div>
              <ShieldCheck size={21} color="#159966" />
              <strong>{normalParts}</strong>
              <span>Normal</span>
            </div>

            <div>
              <Clock3 size={21} color="#d5962c" />
              <strong>{nearLimitParts}</strong>
              <span>Near Limit</span>
            </div>

            <div>
              <AlertTriangle size={21} color="#db4a56" />
              <strong>{criticalParts}</strong>
              <span>Critical</span>
            </div>
          </div>
        </div>
      </div>

      <div className="aero-dashboard-footer">
        <span>
          <Plane size={15} />
          {flights.length} flights · {orders.length} work orders
        </span>

        <span>
          {completedFlights} completed flights · {parts.length} parts
        </span>
      </div>
    </div>
  );
}

export default Dashboard;
