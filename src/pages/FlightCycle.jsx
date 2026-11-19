
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Plane,
  Plus,
  Search,
  CalendarDays,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Pencil,
  X,
  Save,
  ArrowLeft,
  Layers,
  AlertCircle
} from "lucide-react";
import "./FlightCycle.css";

const CYCLES_KEY = "aeroops-flight-cycles";
const PARTS_KEY = "aeroops-parts";

const initialCycles = [
  {
    id: "FC-001",
    date: "2026-11-17",
    flight: "PR 204",
    aircraft: "RP-C8612",
    route: "MNL → CEB",
    cycles: 1,
    remarks: "",
    status: "Pending Review",
    appliedToParts: false
  },
  {
    id: "FC-002",
    date: "2026-11-17",
    flight: "5J 615",
    aircraft: "RP-C4110",
    route: "CEB → MNL",
    cycles: 1,
    remarks: "",
    status: "Pending Review",
    appliedToParts: false
  },
  {
    id: "FC-003",
    date: "2026-11-18",
    flight: "PR 186",
    aircraft: "RP-C8607",
    route: "MNL → DVO",
    cycles: 1,
    remarks: "",
    status: "Pending Review",
    appliedToParts: false
  },
  {
    id: "FC-004",
    date: "2026-11-18",
    flight: "5J 931",
    aircraft: "RP-C3299",
    route: "MNL → ILO",
    cycles: 1,
    remarks: "",
    status: "Pending Review",
    appliedToParts: false
  }
];

// Used only if the Parts Register has not been opened yet.
const initialParts = [
  {
    id: "LLP-001",
    name: "Turbine Disk",
    partNumber: "TD-320-145",
    serialNumber: "SN-003921",
    aircraft: "RP-C8612",
    cyclesUsed: 17750,
    cycleLimit: 20000
  },
  {
    id: "LLP-002",
    name: "Landing Gear Assembly",
    partNumber: "LG-500-021",
    serialNumber: "SN-008142",
    aircraft: "RP-C4110",
    cyclesUsed: 9400,
    cycleLimit: 10000
  },
  {
    id: "LLP-003",
    name: "Compressor Rotor",
    partNumber: "CR-220-480",
    serialNumber: "SN-006811",
    aircraft: "RP-C8607",
    cyclesUsed: 12800,
    cycleLimit: 18000
  },
  {
    id: "LLP-004",
    name: "Engine Shaft",
    partNumber: "ES-981-016",
    serialNumber: "SN-002047",
    aircraft: "RP-C3299",
    cyclesUsed: 14950,
    cycleLimit: 15000
  },
  {
    id: "LLP-005",
    name: "High Pressure Turbine Disk",
    partNumber: "HPT-420-110",
    serialNumber: "SN-004260",
    aircraft: "RP-C8612",
    cyclesUsed: 7200,
    cycleLimit: 12000
  }
];

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const blankForm = {
  date: getToday(),
  flight: "",
  aircraft: "",
  route: "",
  cycles: "1",
  remarks: ""
};

function readArray(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeCycle(record, index) {
  const count = Number(
    record.cycles ?? record.cycleCount ?? 1
  );

  const applied = record.appliedToParts === true ||
    record.status === "Applied";

  return {
    ...record,
    id: record.id || `FC-${String(index + 1).padStart(3, "0")}`,
    date: record.date || getToday(),
    flight: record.flight || "",
    aircraft: record.aircraft || "",
    route: record.route || "",
    cycles: Number.isFinite(count) ? count : 1,
    remarks: record.remarks || "",
    appliedToParts: applied,
    status: applied ? "Applied" : "Pending Review"
  };
}

function loadCycles() {
  return readArray(CYCLES_KEY, initialCycles).map(normalizeCycle);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function FlightCycle() {
  const navigate = useNavigate();
  const location = useLocation();

  const [records, setRecords] = useState(loadCycles);
  const [search, setSearch] = useState("");
  const [aircraftFilter, setAircraftFilter] = useState(
    location.state?.aircraft || "All Aircraft"
  );
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(CYCLES_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event("aeroops-data-updated"));
  }, [records]);

  useEffect(() => {
    if (location.state?.aircraft) {
      setAircraftFilter(location.state.aircraft);
    }
  }, [location.state?.aircraft, location.key]);

  const totalCycles = records.reduce(
    (sum, record) => sum + Number(record.cycles || 0),
    0
  );

  const currentMonth = getToday().slice(0, 7);
  const currentYear = getToday().slice(0, 4);

  const monthCycles = records
    .filter(record => record.date.startsWith(currentMonth))
    .reduce((sum, record) => sum + Number(record.cycles || 0), 0);

  const yearCycles = records
    .filter(record => record.date.startsWith(currentYear))
    .reduce((sum, record) => sum + Number(record.cycles || 0), 0);

  const appliedCount = records.filter(
    record => record.appliedToParts
  ).length;

  const aircraftOptions = [
    ...new Set(
      records.map(record => record.aircraft).filter(Boolean)
    )
  ].sort();

  const filteredRecords = records.filter(record => {
    const query = search.trim().toLowerCase();

    const matchesSearch = [
      record.id,
      record.flight,
      record.aircraft,
      record.route,
      record.date
    ].some(value =>
      String(value || "").toLowerCase().includes(query)
    );

    const matchesAircraft =
      aircraftFilter === "All Aircraft" ||
      record.aircraft === aircraftFilter;

    const matchesStatus =
      statusFilter === "All Status" ||
      record.status === statusFilter;

    return matchesSearch && matchesAircraft && matchesStatus;
  });

  function openAdd() {
    setEditingId(null);
    setForm({ ...blankForm, date: getToday() });
    setError("");
    setMessage("");
    setShowModal(true);
  }

  function openEdit(record) {
    if (record.appliedToParts) {
      setMessage("Applied records are locked to prevent double counting.");
      return;
    }

    setEditingId(record.id);
    setForm({
      date: record.date,
      flight: record.flight,
      aircraft: record.aircraft,
      route: record.route,
      cycles: String(record.cycles),
      remarks: record.remarks
    });
    setError("");
    setShowModal(true);
  }

  function saveRecord(event) {
    event.preventDefault();

    const flight = form.flight.trim().toUpperCase();
    const aircraft = form.aircraft.trim().toUpperCase();
    const route = form.route.trim().toUpperCase();
    const cycles = Number(form.cycles);
    const date = form.date;

    if (!flight || !aircraft || !date) {
      setError("Complete the flight, aircraft and date fields.");
      return;
    }

    if (
      form.cycles === "" ||
      !Number.isSafeInteger(cycles) ||
      cycles < 1
    ) {
      setError("Cycle Count must be a positive whole number.");
      return;
    }

    const values = {
      date,
      flight,
      aircraft,
      route,
      cycles,
      remarks: form.remarks.trim()
    };

    if (editingId) {
      setRecords(prev => prev.map(record =>
        record.id === editingId && !record.appliedToParts
          ? { ...record, ...values }
          : record
      ));

      setMessage("Flight cycle record updated.");
    } else {
      const nextNumber = Math.max(
        0,
        ...records.map(record => {
          const match = String(record.id).match(/^FC-(\d+)$/);
          return match ? Number(match[1]) : 0;
        })
      ) + 1;

      const newRecord = {
        id: `FC-${String(nextNumber).padStart(3, "0")}`,
        ...values,
        appliedToParts: false,
        status: "Pending Review"
      };

      setRecords(prev => [newRecord, ...prev]);
      setMessage("Flight cycle record added.");
    }

    setError("");
    setShowModal(false);
  }

  function applyToParts(recordId) {
    // Read the latest saved record to prevent repeated application.
    const latestCycles = readArray(CYCLES_KEY, []);
    const record = latestCycles.find(item => item.id === recordId);

    if (!record) {
      setMessage("Record not found. Refresh and try again.");
      return;
    }

    if (
      record.appliedToParts === true ||
      record.status === "Applied"
    ) {
      setRecords(latestCycles.map(normalizeCycle));
      setMessage("This record has already been applied.");
      return;
    }

    const cycleCount = Number(
      record.cycles ?? record.cycleCount
    );

    if (
      !Number.isSafeInteger(cycleCount) ||
      cycleCount < 1
    ) {
      setMessage("Invalid cycle count.");
      return;
    }

    const savedParts = readArray(PARTS_KEY, initialParts);

    const matchingParts = savedParts.filter(
      part => String(part.aircraft).toUpperCase() ===
        String(record.aircraft).toUpperCase()
    );

    if (matchingParts.length === 0) {
      setMessage(
        `No registered parts found for ${record.aircraft}.`
      );
      return;
    }

    const invalidParts = matchingParts.filter(part => {
      const used = Number(part.cyclesUsed);
      const limit = Number(part.cycleLimit);

      return (
        !Number.isSafeInteger(used) ||
        !Number.isSafeInteger(limit) ||
        used < 0 ||
        limit <= 0 ||
        used + cycleCount > limit
      );
    });

    if (invalidParts.length > 0) {
      setMessage(
        "Cannot apply: one or more components would exceed " +
        "their configured cycle limit. Review the parts first."
      );
      return;
    }

    const updatedParts = savedParts.map(part => {
      if (
        String(part.aircraft).toUpperCase() !==
        String(record.aircraft).toUpperCase()
      ) {
        return part;
      }

      return {
        ...part,
        cyclesUsed: Number(part.cyclesUsed) + cycleCount
      };
    });

    const updatedCycles = latestCycles.map(item =>
      item.id === recordId
        ? {
            ...item,
            appliedToParts: true,
            status: "Applied",
            appliedAt: new Date().toISOString()
          }
        : item
    );

    // Both collections are saved before the screen is updated.
    localStorage.setItem(PARTS_KEY, JSON.stringify(updatedParts));
    localStorage.setItem(CYCLES_KEY, JSON.stringify(updatedCycles));

    setRecords(updatedCycles.map(normalizeCycle));
    window.dispatchEvent(new Event("aeroops-data-updated"));

    setMessage(
      `Applied ${cycleCount} cycle(s) to ` +
      `${matchingParts.length} component(s) for ${record.aircraft}.`
    );
  }

  return (
    <div className="fc-page">
      <div className="fc-heading">
        <div>
          <p className="fc-eyebrow">AIRCRAFT OPERATIONS</p>
          <h1>Flight Cycle</h1>
          <p>Manage flight cycle records and component usage.</p>
        </div>

        <div className="fc-heading-actions">
          <button
            className="fc-secondary"
            onClick={() => navigate("/parts")}
          >
            <Layers size={17} />
            Parts Register
          </button>

          <button className="fc-primary" onClick={openAdd}>
            <Plus size={17} />
            Record Flight Cycle
          </button>
        </div>
      </div>

      <div className="fc-stats">
        {[
          {
            label: "Recorded Cycles",
            value: totalCycles,
            icon: Plane
          },
          {
            label: "This Month",
            value: monthCycles,
            icon: CalendarDays
          },
          {
            label: "This Year",
            value: yearCycles,
            icon: RefreshCw
          },
          {
            label: "Applied Records",
            value: appliedCount,
            icon: CheckCircle2
          }
        ].map(({ label, value, icon: Icon }) => (
          <div className="fc-stat-card" key={label}>
            <div>
              <span>{label}</span>
              <strong>{value.toLocaleString()}</strong>
            </div>
            <Icon size={25} />
          </div>
        ))}
      </div>

      <div className="fc-panel">
        <div className="fc-panel-heading">
          <div>
            <h2>Flight Cycle Records</h2>
            <p>Record, edit and apply aircraft flight cycles.</p>
          </div>

          <span className="fc-record-count">
            {filteredRecords.length} Records
          </span>
        </div>

        <div className="fc-filters">
          <div className="fc-search">
            <Search size={17} />
            <input
              placeholder="Search flight, aircraft, route..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>

          <select
            value={aircraftFilter}
            onChange={event => setAircraftFilter(event.target.value)}
          >
            <option>All Aircraft</option>
            {aircraftOptions.map(aircraft => (
              <option key={aircraft}>{aircraft}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
          >
            <option>All Status</option>
            <option>Pending Review</option>
            <option>Applied</option>
          </select>
        </div>

        {message && (
          <div className="fc-message" role="status">
            <AlertCircle size={17} />
            {message}
            <button
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="fc-table-wrap">
          <table className="fc-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Date</th>
                <th>Flight</th>
                <th>Aircraft</th>
                <th>Route</th>
                <th>Cycles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id}>
                  <td className="fc-record-id">{record.id}</td>
                  <td>{formatDate(record.date)}</td>
                  <td><strong>{record.flight}</strong></td>
                  <td>{record.aircraft}</td>
                  <td>{record.route || "—"}</td>
                  <td>
                    <strong>{record.cycles}</strong>
                  </td>
                  <td>
                    <span className={`fc-badge ${
                      record.appliedToParts
                        ? "applied"
                        : "pending"
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td>
                    <div className="fc-row-actions">
                      {!record.appliedToParts ? (
                        <>
                          <button
                            className="fc-edit"
                            onClick={() => openEdit(record)}
                            title="Edit Record"
                          >
                            <Pencil size={15} />
                            Edit
                          </button>

                          <button
                            className="fc-apply"
                            onClick={() => applyToParts(record.id)}
                          >
                            <CheckCircle2 size={15} />
                            Apply to Parts
                          </button>
                        </>
                      ) : (
                        <span className="fc-applied-label">
                          <CheckCircle2 size={16} />
                          Applied
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRecords.length === 0 && (
            <p className="fc-empty">No matching records found.</p>
          )}
        </div>
      </div>

      {aircraftFilter !== "All Aircraft" && (
        <button
          className="fc-back-link"
          onClick={() => navigate("/parts")}
        >
          <ArrowLeft size={17} />
          Back to Parts Register
        </button>
      )}

      {showModal && (
        <div className="fc-modal-backdrop">
          <div
            className="fc-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fc-modal-title"
          >
            <div className="fc-modal-heading">
              <div>
                <h2 id="fc-modal-title">
                  {editingId
                    ? "Edit Flight Cycle"
                    : "Record Flight Cycle"}
                </h2>
                <p>Enter the flight cycle details.</p>
              </div>

              <button
                className="fc-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveRecord}>
              <div className="fc-form-grid">
                <label>
                  Flight Date
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={event => setForm({
                      ...form,
                      date: event.target.value
                    })}
                  />
                </label>

                <label>
                  Flight Number
                  <input
                    required
                    maxLength={30}
                    placeholder="PR 204"
                    value={form.flight}
                    onChange={event => setForm({
                      ...form,
                      flight: event.target.value
                    })}
                  />
                </label>

                <label>
                  Aircraft Registration
                  <input
                    required
                    maxLength={50}
                    placeholder="RP-C8612"
                    value={form.aircraft}
                    onChange={event => setForm({
                      ...form,
                      aircraft: event.target.value
                    })}
                  />
                </label>

                <label>
                  Route
                  <input
                    maxLength={100}
                    placeholder="MNL → CEB"
                    value={form.route}
                    onChange={event => setForm({
                      ...form,
                      route: event.target.value
                    })}
                  />
                </label>

                <label>
                  Cycle Count
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.cycles}
                    onChange={event => setForm({
                      ...form,
                      cycles: event.target.value
                    })}
                  />
                </label>

                <label className="fc-form-full">
                  Remarks
                  <textarea
                    rows="3"
                    placeholder="Enter remarks..."
                    value={form.remarks}
                    onChange={event => setForm({
                      ...form,
                      remarks: event.target.value
                    })}
                  />
                </label>
              </div>

              {error && (
                <p className="fc-form-error" role="alert">
                  {error}
                </p>
              )}

              <div className="fc-modal-actions">
                <button
                  type="button"
                  className="fc-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="fc-primary">
                  <Save size={17} />
                  {editingId ? "Save Changes" : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlightCycle;
