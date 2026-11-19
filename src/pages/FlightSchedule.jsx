
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Plane, Search, Plus, Pencil, X, ArrowLeft,
  Clock, MapPin, CheckCircle2, Circle,
  ShieldCheck, ClipboardCheck, Save
} from "lucide-react";
import "./FlightSchedule.css";

const FLIGHTS_KEY = "aeroops-flights";
const TASKS_KEY = "aeroops-ground-tasks";

const inspectionZones = [
  { position: "nose", label: "Nose", checkIndex: 0 },
  { position: "left", label: "Left Side", checkIndex: 1 },
  { position: "right", label: "Right Side", checkIndex: 2 },
  { position: "tail", label: "Tail", checkIndex: 4 }
];

function AircraftInspectionDiagram({ checks }) {
  return (
    <figure className="flight-inspection-diagram">
      <figcaption>360° Aircraft Inspection</figcaption>
      <ul className="flight-inspection-zones">
        {inspectionZones.map(({ position, label, checkIndex }) => {
          const checked = checks.includes(checkIndex);
          const StatusIcon = checked ? CheckCircle2 : Circle;

          return (
            <li className={`flight-inspection-zone flight-inspection-zone-${position}`} key={position}>
              {label}
              <StatusIcon
                size={17}
                className={checked ? "flight-inspection-checked" : undefined}
                role="img"
                aria-label={checked ? "Checked" : "Pending"}
              />
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

const demoFlights = [
  {
    id: "PR 204", aircraft: "Airbus A320",
    registration: "RP-C8612", route: "MNL → CEB",
    departure: "08:45", arrival: "10:15",
    bay: "Bay 03", status: "In Progress"
  },
  {
    id: "5J 615", aircraft: "Airbus A321",
    registration: "RP-C4110", route: "CEB → MNL",
    departure: "10:20", arrival: "11:50",
    bay: "Bay 05", status: "Scheduled"
  },
  {
    id: "PR 186", aircraft: "Airbus A320",
    registration: "RP-C8607", route: "MNL → DVO",
    departure: "12:15", arrival: "14:10",
    bay: "Bay 02", status: "Scheduled"
  },
  {
    id: "5J 931", aircraft: "Airbus A320",
    registration: "RP-C3299", route: "MNL → ILO",
    departure: "14:30", arrival: "15:45",
    bay: "Bay 01", status: "Scheduled"
  }
];

const operations = [
  {
    id: "marshall",
    name: "Marshalling",
    photo: {
      file: "marshalling.jpg",
      alt: "Ground crew member guiding an aircraft on the apron"
    },
    icon: Plane,
    items: [
      "Assigned marshaller confirmed",
      "Marshalling area checked",
      "Required communication established",
      "Aircraft positioned at assigned bay",
      "Marshalling task reported"
    ]
  },
  {
    id: "chocks",
    name: "Chocks",
    icon: Circle,
    items: [
      "Aircraft stop confirmed",
      "Chock placement authorized",
      "Required wheel chocks positioned",
      "Chock placement verified",
      "Chock status reported"
    ]
  },
  {
    id: "inspection",
    name: "360° Inspection",
    icon: ClipboardCheck,
    items: [
      "Nose and forward fuselage checked",
      "Left-side exterior checked",
      "Right-side exterior checked",
      "Wings and engine areas checked",
      "Tail section checked",
      "Landing gear areas checked",
      "Findings documented"
    ]
  },
  {
    id: "fireguard",
    name: "Fire Guard",
    photo: {
      file: "fire-guard.jpg",
      alt: "Fire extinguisher on the apron beside an aircraft"
    },
    icon: ShieldCheck,
    items: [
      "Assigned fire guard confirmed",
      "Required firefighting equipment verified",
      "Fire guard position confirmed",
      "Area conditions monitored",
      "Communication readiness confirmed",
      "Fire guard task reported"
    ]
  }
];

const emptyFlight = {
  id: "", aircraft: "", registration: "", route: "",
  departure: "", arrival: "", bay: "", status: "Scheduled"
};

function readLocal(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object"
      ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function FlightSchedule() {
  const location = useLocation();

  const [flights, setFlights] = useState(() => {
    const saved = readLocal(FLIGHTS_KEY, demoFlights);
    return Array.isArray(saved) ? saved : demoFlights;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = readLocal(TASKS_KEY, {});
    return Array.isArray(saved) ? {} : saved;
  });

  const [selectedId, setSelectedId] = useState(null);
  const [activeOperation, setActiveOperation] = useState("marshall");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Flights");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyFlight);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const requestedOperation = location.state?.operation;

  // Open the requested module from the sidebar.
  useEffect(() => {
    if (!requestedOperation) return;

    if (operations.some(op => op.id === requestedOperation)) {
      setActiveOperation(requestedOperation);
      setSelectedId(null);
      setMessage("");
    }
  }, [requestedOperation, location.key]);

  useEffect(() => {
    localStorage.setItem(FLIGHTS_KEY, JSON.stringify(flights));
  }, [flights]);

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const selectedFlight = flights.find(f => f.id === selectedId);
  const selectedOperation = operations.find(
    op => op.id === activeOperation
  );

  const taskKey = selectedFlight
    ? `${selectedFlight.id}::${activeOperation}`
    : null;

  const currentTask = taskKey && tasks[taskKey]
    ? tasks[taskKey]
    : { checks: [], remarks: "", completed: false };

  const checkedCount = currentTask.checks.length;
  const totalItems = selectedOperation.items.length;
  const progress = Math.round(checkedCount / totalItems * 100);

  const filteredFlights = flights.filter(f => {
    const query = search.toLowerCase();

    const matchesSearch = [
      f.id, f.aircraft, f.registration, f.route, f.bay
    ].some(value => String(value).toLowerCase().includes(query));

    return matchesSearch &&
      (filter === "All Flights" || f.status === filter);
  });

  function getRecord(flightId, operationId) {
    return tasks[`${flightId}::${operationId}`] || {
      checks: [], remarks: "", completed: false
    };
  }

  function getCompletedOperations(flightId) {
    return operations.filter(op =>
      getRecord(flightId, op.id).completed
    ).length;
  }

  function openAdd() {
    setEditingId(null);
    setForm({ ...emptyFlight });
    setError("");
    setShowForm(true);
  }

  function openEdit(flight) {
    setEditingId(flight.id);
    setForm({ ...flight });
    setError("");
    setShowForm(true);
  }

  function saveFlight(e) {
    e.preventDefault();

    const cleaned = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key, typeof value === "string" ? value.trim() : value
      ])
    );

    cleaned.id = cleaned.id.toUpperCase();
    cleaned.registration = cleaned.registration.toUpperCase();

    const required = [
      "id", "aircraft", "registration", "route",
      "departure", "arrival", "bay"
    ];

    if (required.some(key => !cleaned[key])) {
      setError("Please complete all required fields.");
      return;
    }

    const duplicate = flights.some(f =>
      f.id.toUpperCase() === cleaned.id &&
      f.id !== editingId
    );

    if (duplicate) {
      setError("Flight number already exists.");
      return;
    }

    if (editingId) {
      setFlights(prev => prev.map(f =>
        f.id === editingId ? cleaned : f
      ));

      if (editingId !== cleaned.id) {
        setTasks(prev => {
          const updated = { ...prev };
          operations.forEach(op => {
            const oldKey = `${editingId}::${op.id}`;
            const newKey = `${cleaned.id}::${op.id}`;
            if (oldKey in updated) {
              updated[newKey] = updated[oldKey];
              delete updated[oldKey];
            }
          });
          return updated;
        });

        if (selectedId === editingId) {
          setSelectedId(cleaned.id);
        }
      }
    } else {
      setFlights(prev => [...prev, cleaned]);
    }

    setShowForm(false);
    setError("");
    setMessage("Flight saved successfully.");
  }

  function updateTask(changes) {
    if (!taskKey) return;

    setTasks(prev => ({
      ...prev,
      [taskKey]: {
        checks: prev[taskKey]?.checks || [],
        remarks: prev[taskKey]?.remarks || "",
        completed: prev[taskKey]?.completed || false,
        ...changes
      }
    }));
  }

  function toggleCheck(index) {
    const checks = currentTask.checks.includes(index)
      ? currentTask.checks.filter(i => i !== index)
      : [...currentTask.checks, index];

    updateTask({ checks, completed: false });
    setMessage("");
  }

  function completeTask() {
    if (checkedCount !== totalItems) {
      setMessage("Complete all checklist items first.");
      return;
    }

    updateTask({ completed: true });
    setMessage("Task completed in the demo.");
  }

  function getStatus(flightId, opId) {
    const record = getRecord(flightId, opId);
    if (record.completed) return "Completed";
    if (record.checks.length > 0) return "In Progress";
    return "Pending";
  }

  const statusClass = status =>
    status === "Completed" ? "completed" :
    status === "In Progress" ? "in-progress" : "scheduled";

  return (
    <div className="flight-page">
      {!selectedFlight ? (
        <>
          <div className="flight-heading">
            <div>
              <p className="flight-eyebrow">GROUND OPERATIONS</p>
              <h1>Flight Schedule</h1>
              <p>Manage aircraft schedules and ground tasks.</p>
            </div>

            <button className="flight-action-primary" onClick={openAdd}>
              <Plus size={18} /> Add Flight
            </button>
          </div>

          <div className="flight-summary">
            <div>
              <span>Total Flights</span>
              <strong>{flights.length}</strong>
            </div>
            <div>
              <span>In Progress</span>
              <strong>
                {flights.filter(f => f.status === "In Progress").length}
              </strong>
            </div>
            <div>
              <span>Scheduled</span>
              <strong>
                {flights.filter(f => f.status === "Scheduled").length}
              </strong>
            </div>
          </div>

          <div className="flight-panel">
            <div className="flight-panel-header">
              <div>
                <h2>Aircraft Flight Schedule</h2>
                <p>
                  Select Manage to open the chosen ground operation.
                </p>
                {requestedOperation && (
                  <p style={{ color: "#1768d9", marginTop: 7 }}>
                    Selected: {
                      operations.find(op =>
                        op.id === activeOperation
                      )?.name
                    }
                  </p>
                )}
              </div>

              <div className="flight-filters">
                <div className="flight-search">
                  <Search size={17} />
                  <input
                    placeholder="Search flight..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option>All Flights</option>
                  <option>Scheduled</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>Cancelled</option>
                </select>
              </div>
            </div>

            <div className="flight-table-wrap">
              <table className="flight-table">
                <thead>
                  <tr>
                    <th>Flight No.</th>
                    <th>Aircraft</th>
                    <th>Route</th>
                    <th>Departure</th>
                    <th>Arrival</th>
                    <th>Bay</th>
                    <th>Tasks</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFlights.map(f => (
                    <tr key={f.id}>
                      <td className="flight-number">{f.id}</td>
                      <td>
                        <strong>{f.aircraft}</strong>
                        <small>{f.registration}</small>
                      </td>
                      <td>{f.route}</td>
                      <td>{f.departure}</td>
                      <td>{f.arrival}</td>
                      <td>{f.bay}</td>
                      <td>
                        <strong>{getCompletedOperations(f.id)}/4</strong>
                      </td>
                      <td>
                        <span className={`flight-badge ${statusClass(f.status)}`}>
                          {f.status}
                        </span>
                      </td>
                      <td>
                        <div className="flight-row-actions">
                          <button
                            className="flight-manage"
                            onClick={() => {
                              setSelectedId(f.id);
                              setActiveOperation(
                                operations.some(op =>
                                  op.id === requestedOperation
                                )
                                  ? requestedOperation
                                  : "marshall"
                              );
                              setMessage("");
                            }}
                          >
                            Manage
                          </button>
                          <button
                            className="flight-edit-button"
                            onClick={() => openEdit(f)}
                            title="Edit Flight"
                            aria-label={`Edit ${f.id}`}
                          >
                            <Pencil size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredFlights.length === 0 && (
                <p className="flight-empty">No matching flights found.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <button
            className="flight-back"
            onClick={() => {
              setSelectedId(null);
              setMessage("");
            }}
          >
            <ArrowLeft size={17} /> Back to Flight Schedule
          </button>

          <div className="flight-detail-heading">
            <div>
              <p className="flight-eyebrow">FLIGHT DETAILS</p>
              <h1>{selectedFlight.id}</h1>
              <p>
                {selectedFlight.aircraft} · {selectedFlight.registration}
              </p>
            </div>
            <button
              className="flight-action-primary"
              onClick={() => openEdit(selectedFlight)}
            >
              <Pencil size={17} /> Edit Flight
            </button>
          </div>

          <div className="flight-detail-info">
            {[
              { label: "Route", value: selectedFlight.route, icon: Plane },
              { label: "Departure", value: selectedFlight.departure, icon: Clock },
              { label: "Arrival", value: selectedFlight.arrival, icon: Clock },
              { label: "Parking Bay", value: selectedFlight.bay, icon: MapPin }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <Icon size={19} />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="flight-operation-tabs">
            {operations.map(op => {
              const Icon = op.icon;
              const taskStatus = getStatus(selectedFlight.id, op.id);

              return (
                <button
                  key={op.id}
                  className={`flight-operation-tab ${
                    activeOperation === op.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setActiveOperation(op.id);
                    setMessage("");
                  }}
                >
                  <Icon size={18} />
                  {op.name}
                  {taskStatus === "Completed" && (
                    <CheckCircle2 size={15} />
                  )}
                </button>
              );
            })}
          </div>

          <div className={
            selectedOperation.photo || activeOperation === "inspection"
              ? "flight-operation-with-visual"
              : undefined
          }>
            {activeOperation === "inspection" && (
              <AircraftInspectionDiagram checks={currentTask.checks} />
            )}
            {selectedOperation.photo && (
              <img
                className="flight-operation-photo"
                src={import.meta.env.BASE_URL + selectedOperation.photo.file}
                alt={selectedOperation.photo.alt}
                width={3}
                height={2}
              />
            )}
            <div className="flight-checklist-panel">
              <div className="flight-checklist-heading">
                <div>
                  <h2>{selectedOperation.name}</h2>
                  <p>Ground operations checklist</p>
                </div>
                <span className={`flight-badge ${
                  statusClass(getStatus(
                    selectedFlight.id, activeOperation
                  ))
                }`}>
                  {getStatus(selectedFlight.id, activeOperation)}
                </span>
              </div>

              <div className="flight-progress-heading">
                <span>Checklist Progress</span>
                <strong>
                  {checkedCount}/{totalItems} ({progress}%)
                </strong>
              </div>
              <div className="flight-progress-bar">
                <div style={{ width: `${progress}%` }} />
              </div>

              <div className="flight-checklist">
                {selectedOperation.items.map((item, index) => (
                  <label className="flight-check-item" key={item}>
                    <input
                      type="checkbox"
                      checked={currentTask.checks.includes(index)}
                      onChange={() => toggleCheck(index)}
                    />
                    <span>{item}</span>
                    {currentTask.checks.includes(index) && (
                      <CheckCircle2 size={18} color="#159966" />
                    )}
                  </label>
                ))}
              </div>

              <div className="flight-remarks">
                <label htmlFor="flight-remarks">
                  Remarks / Findings
                </label>
                <textarea
                  id="flight-remarks"
                  rows="4"
                  placeholder="Enter observations or remarks..."
                  value={currentTask.remarks}
                  onChange={e => {
                    updateTask({ remarks: e.target.value });
                    setMessage("");
                  }}
                />
              </div>

              {message && (
                <p className="flight-message" role="status">{message}</p>
              )}

              <div className="flight-checklist-actions">
                <button
                  className="flight-save"
                  onClick={() =>
                    setMessage("Progress saved in this browser.")
                  }
                >
                  <Save size={17} /> Save Progress
                </button>

                <button
                  className="flight-complete"
                  onClick={completeTask}
                >
                  <CheckCircle2 size={17} />
                  {currentTask.completed
                    ? "Completed"
                    : "Complete Task"}
                </button>

                {activeOperation === "chocks" &&
                  currentTask.completed && (
                    <button
                      className="flight-action-primary"
                      onClick={() => {
                        setActiveOperation("inspection");
                        setMessage("");
                      }}
                    >
                      Next: 360° Inspection →
                    </button>
                  )}
              </div>
            </div>
          </div>

          <p className="flight-demo-disclaimer">
            Demonstration only. Checklist statuses do not authorize
            aircraft operation or maintenance release.
          </p>
        </>
      )}

      {showForm && (
        <div className="flight-modal-backdrop">
          <div
            className="flight-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="flight-modal-title"
          >
            <div className="flight-modal-heading">
              <div>
                <h2 id="flight-modal-title">
                  {editingId ? "Edit Flight" : "Add New Flight"}
                </h2>
                <p>Enter the aircraft schedule information.</p>
              </div>
              <button
                className="flight-modal-close"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveFlight}>
              <div className="flight-form-grid">
                {[
                  ["id", "Flight Number", "PR 204"],
                  ["aircraft", "Aircraft Type", "Airbus A320"],
                  ["registration", "Aircraft Registration", "RP-C8612"],
                  ["route", "Route", "MNL → CEB"],
                  ["bay", "Parking Bay", "Bay 03"]
                ].map(([field, label, placeholder]) => (
                  <label key={field}>
                    {label}
                    <input
                      required
                      maxLength={80}
                      placeholder={placeholder}
                      value={form[field]}
                      onChange={e =>
                        setForm({ ...form, [field]: e.target.value })
                      }
                    />
                  </label>
                ))}

                <label>
                  Departure Time
                  <input
                    required
                    type="time"
                    value={form.departure}
                    onChange={e =>
                      setForm({ ...form, departure: e.target.value })
                    }
                  />
                </label>
                <label>
                  Arrival Time
                  <input
                    required
                    type="time"
                    value={form.arrival}
                    onChange={e =>
                      setForm({ ...form, arrival: e.target.value })
                    }
                  />
                </label>
                <label>
                  Flight Status
                  <select
                    value={form.status}
                    onChange={e =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option>Scheduled</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </label>
              </div>

              {error && (
                <p className="flight-form-error" role="alert">{error}</p>
              )}

              <div className="flight-modal-actions">
                <button
                  type="button"
                  className="flight-save"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="flight-action-primary">
                  <Save size={17} />
                  {editingId ? "Save Changes" : "Add Flight"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FlightSchedule;
