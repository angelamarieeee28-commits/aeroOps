
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ArrowLeft,
  Plane,
  Gauge,
  Hash,
  RefreshCw,
  Plus,
  Pencil,
  Save,
  X
} from "lucide-react";
import "./LifeLimitedParts.css";

const STORAGE_KEY = "aeroops-parts";

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

const blankForm = {
  name: "",
  partNumber: "",
  serialNumber: "",
  aircraft: "",
  cyclesUsed: "0",
  cycleLimit: ""
};

function loadParts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return initialParts;

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : initialParts;
  } catch {
    return initialParts;
  }
}

// Configurable display thresholds for this frontend register.
function getPartStatus(remaining) {
  if (remaining <= 500) return "Critical";
  if (remaining <= 1500) return "Near Limit";
  return "Normal";
}

function enrichPart(part) {
  const cyclesUsed = Number(part.cyclesUsed) || 0;
  const cycleLimit = Number(part.cycleLimit) || 0;
  const remaining = cycleLimit - cyclesUsed;
  const utilization = cycleLimit > 0
    ? (cyclesUsed / cycleLimit) * 100
    : 0;

  return {
    ...part,
    cyclesUsed,
    cycleLimit,
    remaining,
    utilization,
    status: getPartStatus(remaining)
  };
}

function LifeLimitedParts() {
  const navigate = useNavigate();

  const [savedParts, setSavedParts] = useState(loadParts);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Status");
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedParts));
    window.dispatchEvent(new Event("aeroops-data-updated"));
  }, [savedParts]);

  const parts = savedParts.map(enrichPart);
  const selectedPart = parts.find(p => p.id === selectedId);

  const filteredParts = parts.filter(part => {
    const searchText = [
      part.id,
      part.name,
      part.partNumber,
      part.serialNumber,
      part.aircraft
    ].join(" ").toLowerCase();

    return (
      searchText.includes(search.toLowerCase()) &&
      (filter === "All Status" || part.status === filter)
    );
  });

  function openAdd() {
    setEditingId(null);
    setForm({ ...blankForm });
    setError("");
    setShowForm(true);
  }

  function openEdit(part) {
    setEditingId(part.id);
    setForm({
      name: part.name,
      partNumber: part.partNumber,
      serialNumber: part.serialNumber,
      aircraft: part.aircraft,
      cyclesUsed: String(part.cyclesUsed),
      cycleLimit: String(part.cycleLimit)
    });
    setError("");
    setShowForm(true);
  }

  function savePart(event) {
    event.preventDefault();

    const name = form.name.trim();
    const partNumber = form.partNumber.trim().toUpperCase();
    const serialNumber = form.serialNumber.trim().toUpperCase();
    const aircraft = form.aircraft.trim().toUpperCase();
    const cyclesUsed = Number(form.cyclesUsed);
    const cycleLimit = Number(form.cycleLimit);

    if (!name || !partNumber || !serialNumber || !aircraft) {
      setError("Please complete all component details.");
      return;
    }

    if (
      form.cyclesUsed === "" ||
      form.cycleLimit === "" ||
      !Number.isSafeInteger(cyclesUsed) ||
      !Number.isSafeInteger(cycleLimit) ||
      cyclesUsed < 0 ||
      cycleLimit <= 0
    ) {
      setError("Enter valid non-negative whole cycles and a positive cycle limit.");
      return;
    }

    if (cyclesUsed > cycleLimit) {
      setError("Cycles Used cannot exceed the Cycle Limit.");
      return;
    }

    const duplicate = savedParts.some(part =>
      part.serialNumber.toUpperCase() === serialNumber &&
      part.id !== editingId
    );

    if (duplicate) {
      setError("This serial number is already registered.");
      return;
    }

    const values = {
      name,
      partNumber,
      serialNumber,
      aircraft,
      cyclesUsed,
      cycleLimit
    };

    if (editingId) {
      setSavedParts(prev =>
        prev.map(part =>
          part.id === editingId
            ? { ...part, ...values }
            : part
        )
      );
    } else {
      const nextNumber = Math.max(
        0,
        ...savedParts.map(part => {
          const match = part.id.match(/^LLP-(\d+)$/);
          return match ? Number(match[1]) : 0;
        })
      ) + 1;

      setSavedParts(prev => [
        ...prev,
        {
          id: `LLP-${String(nextNumber).padStart(3, "0")}`,
          ...values
        }
      ]);
    }

    setShowForm(false);
    setError("");
  }

  const badgeClass = status =>
    status.toLowerCase().replaceAll(" ", "-");

  return (
    <div className="llp-page">
      {!selectedPart ? (
        <>
          <div className="llp-heading">
            <div>
              <p className="llp-eyebrow">AIRCRAFT MAINTENANCE</p>
              <h1>Life-Limited Parts</h1>
              <p>
                Monitor component cycle limits and remaining
                service-life records.
              </p>
            </div>

            <div className="llp-heading-actions">
              <button className="llp-primary" onClick={openAdd}>
                <Plus size={17} />
                Add Part
              </button>

              <button
                className="llp-secondary-button"
                onClick={() => navigate("/flight-cycle")}
              >
                <RefreshCw size={17} />
                Flight Cycle Records
              </button>
            </div>
          </div>

          <div className="llp-stats">
            {[
              {
                label: "Tracked Components",
                value: parts.length,
                icon: Layers,
                color: "blue"
              },
              {
                label: "Normal",
                value: parts.filter(p => p.status === "Normal").length,
                icon: CheckCircle2,
                color: "green"
              },
              {
                label: "Near Limit",
                value: parts.filter(p => p.status === "Near Limit").length,
                icon: Clock3,
                color: "orange"
              },
              {
                label: "Critical",
                value: parts.filter(p => p.status === "Critical").length,
                icon: AlertTriangle,
                color: "red"
              }
            ].map(({ label, value, icon: Icon, color }) => (
              <div className="llp-stat" key={label}>
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <div className={`llp-stat-icon ${color}`}>
                  <Icon size={22} />
                </div>
              </div>
            ))}
          </div>

          <div className="llp-panel">
            <div className="llp-panel-heading">
              <div>
                <h2>Component Lifecycle Register</h2>
                <p>Monitor and manage aircraft component records.</p>
              </div>
            </div>

            <div className="llp-filters">
              <div className="llp-search">
                <Search size={17} />
                <input
                  placeholder="Search part number, serial, aircraft..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option>All Status</option>
                <option>Normal</option>
                <option>Near Limit</option>
                <option>Critical</option>
              </select>
            </div>

            <div className="llp-table-wrap">
              <table className="llp-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Aircraft</th>
                    <th>Cycles Used</th>
                    <th>Cycle Limit</th>
                    <th>Remaining</th>
                    <th>Life Utilization</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredParts.map(part => (
                    <tr key={part.id}>
                      <td>
                        <strong>{part.name}</strong>
                        <small>
                          {part.partNumber} · {part.serialNumber}
                        </small>
                      </td>

                      <td>{part.aircraft}</td>
                      <td>{part.cyclesUsed.toLocaleString()}</td>
                      <td>{part.cycleLimit.toLocaleString()}</td>
                      <td className="llp-remaining">
                        {part.remaining.toLocaleString()}
                      </td>

                      <td>
                        <div className="llp-usage">
                          <span>{part.utilization.toFixed(1)}%</span>
                          <div className="llp-progress">
                            <div
                              className={badgeClass(part.status)}
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(part.utilization, 100)
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className={`llp-badge ${
                          badgeClass(part.status)
                        }`}>
                          {part.status}
                        </span>
                      </td>

                      <td>
                        <div className="llp-row-actions">
                          <button
                            className="llp-open"
                            onClick={() => setSelectedId(part.id)}
                          >
                            View Details
                          </button>
                          <button
                            className="llp-edit-button"
                            onClick={() => openEdit(part)}
                            title="Edit Component"
                            aria-label={`Edit ${part.name}`}
                          >
                            <Pencil size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredParts.length === 0 && (
                <p className="llp-empty">No components found.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <button
            className="llp-back"
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeft size={18} />
            Back to Parts Register
          </button>

          <div className="llp-heading">
            <div>
              <p className="llp-eyebrow">COMPONENT DETAILS</p>
              <h1>{selectedPart.name}</h1>
              <p>{selectedPart.id}</p>
            </div>

            <div className="llp-heading-actions">
              <span className={`llp-badge ${
                badgeClass(selectedPart.status)
              }`}>
                {selectedPart.status}
              </span>

              <button
                className="llp-primary"
                onClick={() => openEdit(selectedPart)}
              >
                <Pencil size={17} />
                Edit Part
              </button>
            </div>
          </div>

          <div className="llp-detail-grid">
            {[
              {
                label: "Part Number",
                value: selectedPart.partNumber,
                icon: Hash
              },
              {
                label: "Serial Number",
                value: selectedPart.serialNumber,
                icon: Hash
              },
              {
                label: "Aircraft Registration",
                value: selectedPart.aircraft,
                icon: Plane
              },
              {
                label: "Cycles Used",
                value: selectedPart.cyclesUsed.toLocaleString(),
                icon: Gauge
              },
              {
                label: "Cycle Limit",
                value: selectedPart.cycleLimit.toLocaleString(),
                icon: Gauge
              },
              {
                label: "Remaining Cycles",
                value: selectedPart.remaining.toLocaleString(),
                icon: Clock3
              }
            ].map(({ label, value, icon: Icon }) => (
              <div className="llp-detail-card" key={label}>
                <Icon size={20} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="llp-panel llp-detail-panel">
            <h2>Component Life Utilization</h2>
            <p>Component flight cycle usage and remaining life</p>

            <div className="llp-large-value">
              {selectedPart.utilization.toFixed(2)}%
            </div>

            <div className="llp-progress large">
              <div
                className={badgeClass(selectedPart.status)}
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(selectedPart.utilization, 100)
                  )}%`
                }}
              />
            </div>

            <div className="llp-life-labels">
              <span>
                Used: {selectedPart.cyclesUsed.toLocaleString()}
              </span>
              <span>
                Limit: {selectedPart.cycleLimit.toLocaleString()}
              </span>
            </div>

            <div className="llp-detail-actions">
              <button
                className="llp-primary"
                onClick={() => navigate("/flight-cycle", {
                  state: { aircraft: selectedPart.aircraft }
                })}
              >
                <RefreshCw size={17} />
                View Aircraft Cycle History
              </button>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="llp-modal-backdrop">
          <div
            className="llp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="llp-modal-title"
          >
            <div className="llp-modal-header">
              <div>
                <h2 id="llp-modal-title">
                  {editingId ? "Edit Component" : "Add New Component"}
                </h2>
                <p>Enter the component information.</p>
              </div>

              <button
                className="llp-modal-close"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={savePart}>
              <div className="llp-form-grid">
                <label>
                  Component Name
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={e => setForm({
                      ...form, name: e.target.value
                    })}
                    placeholder="Turbine Disk"
                  />
                </label>

                <label>
                  Part Number
                  <input
                    required
                    maxLength={60}
                    value={form.partNumber}
                    onChange={e => setForm({
                      ...form, partNumber: e.target.value
                    })}
                    placeholder="TD-320-145"
                  />
                </label>

                <label>
                  Serial Number
                  <input
                    required
                    maxLength={60}
                    value={form.serialNumber}
                    onChange={e => setForm({
                      ...form, serialNumber: e.target.value
                    })}
                    placeholder="SN-003921"
                  />
                </label>

                <label>
                  Aircraft Registration
                  <input
                    required
                    maxLength={60}
                    value={form.aircraft}
                    onChange={e => setForm({
                      ...form, aircraft: e.target.value
                    })}
                    placeholder="RP-C8612"
                  />
                </label>

                <label>
                  Cycles Used
                  <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.cyclesUsed}
                    onChange={e => setForm({
                      ...form, cyclesUsed: e.target.value
                    })}
                  />
                </label>

                <label>
                  Cycle Limit
                  <input
                    required
                    type="number"
                    min="1"
                    step="1"
                    value={form.cycleLimit}
                    onChange={e => setForm({
                      ...form, cycleLimit: e.target.value
                    })}
                  />
                </label>
              </div>

              {error && (
                <p className="llp-form-error" role="alert">{error}</p>
              )}

              <div className="llp-modal-actions">
                <button
                  type="button"
                  className="llp-secondary-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="llp-primary">
                  <Save size={17} />
                  {editingId ? "Save Changes" : "Add Component"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LifeLimitedParts;
