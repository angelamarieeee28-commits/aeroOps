
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

// Authentication
import Login from "./pages/Login";

// Dashboard
import Dashboard from "./pages/Dashboard";

// Flight Schedule and Ground Operations
import FlightSchedule from "./pages/FlightSchedule";

// Work Orders
import WorkOrders from "./pages/WorkOrders";

// Life-Limited Parts
import LifeLimitedParts from "./pages/LifeLimitedParts";

// Flight Cycle
import FlightCycle from "./pages/FlightCycle";

// Shared Layout
import AppLayout from "./components/AppLayout";

// Dashboard Styling
import "./pages/Dashboard.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login Page */}
        <Route path="/" element={<Login />} />

        {/* Main Application Layout */}
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Flight Schedule */}
          <Route
            path="/flights"
            element={<FlightSchedule />}
          />

          {/* Work Orders */}
          <Route
            path="/work-orders"
            element={<WorkOrders />}
          />

          {/* Life-Limited Parts */}
          <Route
            path="/parts"
            element={<LifeLimitedParts />}
          />

          {/* Flight Cycle */}
          <Route
            path="/flight-cycle"
            element={<FlightCycle />}
          />
        </Route>

        {/* Redirect Invalid Routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
