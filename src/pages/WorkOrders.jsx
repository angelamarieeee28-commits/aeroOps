
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ClipboardList, Plus, Search, ArrowLeft, CheckCircle2,
  Clock3, Wrench, ClipboardCheck, FileText,
  Save, X, Pencil, Trash2, RotateCcw, PackageCheck
} from "lucide-react";
import "./WorkOrders.css";

const STORAGE_KEY = "aeroops-workorders";

const categories = [
  "Operations",
  "Tools Pick Slip",
  "Preflight",
  "Postflight"
];

// Example checklists for demonstration only
const templates = {
  Operations: [
    "Review work order instructions",
    "Confirm assigned personnel",
    "Confirm work area readiness",
    "Record operational task completion",
    "Submit task report"
  ],
  "Tools Pick Slip": [
    "Review requested tools",
    "Verify tool identification and availability",
    "Record issued tools and quantities",
    "Confirm tool recipient",
    "Record tool return and reconciliation"
  ],
  Preflight: [
    "Review applicable aircraft documentation",
    "Confirm assigned inspection requirements",
    "Record completion of assigned checks",
    "Document observed discrepancies",
    "Submit inspection findings"
  ],
  Postflight: [
    "Review arrival maintenance information",
    "Record applicable postflight checks",
    "Document observed discrepancies",
    "Record required follow-up actions",
    "Submit postflight findings"
  ]
};

const demoOrders = [
  {
    id: "WO-1024",
    title: "Preflight Exterior Inspection",
    category: "Preflight",
    flight: "PR 204",
    aircraft: "RP-C8612",
    assignedTo: "Maintenance Team A",
    priority: "High",
    status: "In Progress",
    checks: [0, 1],
    remarks: "",
    tools: [],
    createdAt: "2026-11-19"
  },
  {
    id: "WO-1025",
    title: "Ground Tool Collection",
    category: "Tools Pick Slip",
    flight: "5J 615",
    aircraft: "RP-C4110",
    assignedTo: "Ground Crew B",
    priority: "Normal",
    status: "Pending",
    checks: [],
    remarks: "",
    tools: [
      {
        id: "TOOL-001",
        name: "Torque Wrench",
        quantity: 1,
        status: "Pending"
      },
      {
        id: "TOOL-002",
        name: "Wheel Chocks",
        quantity: 2,
        status: "Pending"
      }
    ],
    createdAt: "2026-11-19"
  },
  {
    id: "WO-1026",
    title: "Postflight Inspection",
    category: "Postflight",
    flight: "PR 186",
    aircraft: "RP-C8607",
    assignedTo: "Maintenance Team C",
    priority: "Normal",
    status: "Completed",
    checks: [0, 1, 2, 3, 4],
    remarks: "",
    tools: [],
    createdAt: "2026-11-19"
  },
  {
    id: "WO-1027",
    title: "Aircraft Turnaround Coordination",
    category: "Operations",
    flight: "5J 931",
    aircraft: "RP-C3299",
    assignedTo: "Operations Team",
    priority: "High",
    status: "Pending",
    checks: [],
    remarks: "",
    tools: [],
    createdAt: "2026-11-19"
  }
];

const emptyForm = {
  title: "",
  category: "Operations",
  flight: "",
  aircraft: "",
  assignedTo: "",
  priority: "Normal"
};

function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return demoOrders;

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) return demoOrders;

    // Support records saved by the previous AeroOps version
    return parsed.map(order => ({
      ...order,
      checks: Array.isArray(order.checks) ? order.checks : [],
      tools: Array.isArray(order.tools) ? order.tools : [],
      remarks: order.remarks || ""
    }));
  } catch {
    return demoOrders;
  }
}

function WorkOrders() {
  const location = useLocation();
  const requestedCategory = location.state?.category;

  const [orders, setOrders] = useState(loadOrders);
  const [selectedId, setSelectedId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(
    ["All Orders", ...categories].includes(requestedCategory)
      ? requestedCategory
      : "All Orders"
  );
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");

  const [newTool, setNewTool] = useState({
    id: "",
    name: "",
    quantity: 1
  });

  useEffect(() => {
    if (!requestedCategory) return;

    if (["All Orders", ...categories].includes(requestedCategory)) {
      setCategoryFilter(requestedCategory);
      setSelectedId(null);
      setSearch("");
      setStatusFilter("All Status");
      setMessage("");
    }
  }, [requestedCategory, location.key]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event("aeroops-data-updated"));
  }, [orders]);

  const selectedOrder = orders.find(o => o.id === selectedId);

  const filteredOrders = orders.filter(o => {
    const keyword = search.toLowerCase();

    const matchesSearch = [
      o.id, o.title, o.flight, o.aircraft, o.assignedTo
    ].some(value => String(value).toLowerCase().includes(keyword));

    return (
      matchesSearch &&
      (categoryFilter === "All Orders" ||
        o.category === categoryFilter) &&
      (statusFilter === "All Status" ||
        o.status === statusFilter)
    );
  });

  function updateOrder(id, changes) {
    setOrders(prev =>
      prev.map(order =>
        order.id === id ? { ...order, ...changes } : order
      )
    );
  }

  function toggleChecklist(index) {
    if (!selectedOrder || selectedOrder.status === "Completed") return;

    const checks = selectedOrder.checks.includes(index)
      ? selectedOrder.checks.filter(i => i !== index)
      : [...selectedOrder.checks, index];

    updateOrder(selectedOrder.id, {
      checks,
      status: checks.length ? "In Progress" : "Pending"
    });

    setMessage("");
  }

  function addTool(event) {
    event.preventDefault();
    if (!selectedOrder || selectedOrder.status === "Completed") return;

    const id = newTool.id.trim().toUpperCase();
    const name = newTool.name.trim();
    const quantity = Number(newTool.quantity);

    if (!id || !name || !Number.isInteger(quantity) || quantity < 1) {
      setMessage("Enter a Tool ID, Tool Name and valid quantity.");
      return;
    }

    if (selectedOrder.tools.some(t => t.id === id)) {
      setMessage("This Tool ID already exists in the pick slip.");
      return;
    }

    updateOrder(selectedOrder.id, {
      tools: [
        ...selectedOrder.tools,
        { id, name, quantity, status: "Pending" }
      ],
      status: "In Progress"
    });

    setNewTool({ id: "", name: "", quantity: 1 });
    setMessage("Tool added to the pick slip.");
  }

  function editTool(toolId, field, value) {
    if (!selectedOrder || selectedOrder.status === "Completed") return;

    // Issued/returned tool details are locked for this demo.
    const tools = selectedOrder.tools.map(tool => {
      if (tool.id !== toolId || tool.status !== "Pending") return tool;

      if (field === "quantity") {
        const number = Number(value);

        if (!Number.isInteger(number) || number < 1) return tool;

        return { ...tool, quantity: number };
      }

      return { ...tool, [field]: value };
    });

    updateOrder(selectedOrder.id, { tools });
    setMessage("");
  }

  function changeToolStatus(toolId, nextStatus) {
    if (!selectedOrder || selectedOrder.status === "Completed") return;

    const tools = selectedOrder.tools.map(tool => {
      if (tool.id !== toolId) return tool;

      if (
        tool.status === "Pending" &&
        nextStatus === "Issued"
      ) {
        return { ...tool, status: "Issued" };
      }

      if (
        tool.status === "Issued" &&
        nextStatus === "Returned"
      ) {
        return { ...tool, status: "Returned" };
      }

      return tool;
    });

    updateOrder(selectedOrder.id, {
      tools,
      status: "In Progress"
    });

    setMessage(`Tool status updated to ${nextStatus}.`);
  }

  function removeTool(toolId) {
    if (!selectedOrder || selectedOrder.status === "Completed") return;

    const tool = selectedOrder.tools.find(t => t.id === toolId);

    if (!tool || tool.status !== "Pending") {
      setMessage("Only pending tools can be removed.");
      return;
    }

    updateOrder(selectedOrder.id, {
      tools: selectedOrder.tools.filter(t => t.id !== toolId)
    });

    setMessage("Pending tool removed.");
  }

  function completeOrder() {
    if (!selectedOrder) return;

    const total = templates[selectedOrder.category].length;

    if (selectedOrder.checks.length !== total) {
      setMessage("Complete all checklist items first.");
      return;
    }

    if (selectedOrder.category === "Tools Pick Slip") {
      if (selectedOrder.tools.length === 0) {
        setMessage("Add at least one tool before completing.");
        return;
      }

      if (!selectedOrder.tools.every(t => t.status === "Returned")) {
        setMessage(
          "All listed tools must be returned before completing."
        );
        return;
      }
    }

    updateOrder(selectedOrder.id, { status: "Completed" });
    setMessage("Work order marked Completed in demo records.");
  }

  function openAddForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      category: categories.includes(categoryFilter)
        ? categoryFilter : "Operations"
    });
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(order) {
    setEditingId(order.id);
    setForm({
      title: order.title,
      category: order.category,
      flight: order.flight,
      aircraft: order.aircraft,
      assignedTo: order.assignedTo,
      priority: order.priority
    });
    setFormError("");
    setShowForm(true);
  }

  function saveOrder(event) {
    event.preventDefault();

    const cleaned = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key, String(value).trim()
      ])
    );

    if (Object.values(cleaned).some(value => !value)) {
      setFormError("Please complete all fields.");
      return;
    }

    if (editingId) {
      const oldOrder = orders.find(o => o.id === editingId);

      updateOrder(editingId, {
        ...cleaned,
        flight: cleaned.flight.toUpperCase(),
        aircraft: cleaned.aircraft.toUpperCase(),
        checks:
          oldOrder.category === cleaned.category
            ? oldOrder.checks
            : [],
        tools:
          cleaned.category === "Tools Pick Slip" &&
          oldOrder.category === cleaned.category
            ? oldOrder.tools
            : [],
        status:
          oldOrder.category === cleaned.category
            ? oldOrder.status
            : "Pending"
      });

      setSelectedId(editingId);
    } else {
      const nextNumber = Math.max(
        1023,
        ...orders.map(o => {
          const match = o.id.match(/^WO-(\d+)$/);
          return match ? Number(match[1]) : 0;
        })
      ) + 1;

      const newOrder = {
        ...cleaned,
        id: `WO-${nextNumber}`,
        flight: cleaned.flight.toUpperCase(),
        aircraft: cleaned.aircraft.toUpperCase(),
        checks: [],
        tools: [],
        remarks: "",
        status: "Pending",
        createdAt: new Date().toISOString().slice(0, 10)
      };

      setOrders(prev => [newOrder, ...prev]);
      setSelectedId(newOrder.id);
    }

    setShowForm(false);
    setMessage("Work order saved successfully.");
  }

  function reopenOrder() {
    if (!selectedOrder || selectedOrder.status !== "Completed") return;

    updateOrder(selectedOrder.id, {
      status: "In Progress"
    });

    setMessage("Work order reopened for demo editing.");
  }

  const totalItems = selectedOrder
    ? templates[selectedOrder.category].length
    : 0;

  const checkedCount = selectedOrder
    ? selectedOrder.checks.length
    : 0;

  const progress = totalItems
    ? (checkedCount / totalItems) * 100
    : 0;

  const badgeClass = value =>
    String(value).toLowerCase().replaceAll(" ", "-");

  return (
    <div className="wo-page">
      {!selectedOrder ? (
        <>
          <div className="wo-page-heading">
            <div>
              <p className="wo-eyebrow">MAINTENANCE OPERATIONS</p>
              <h1>Work Orders</h1>
              <p>
                Operations, Tools Pick Slip, Preflight and Postflight.
              </p>
            </div>

            <button className="wo-primary" onClick={openAddForm}>
              <Plus size={18} /> Create Work Order
            </button>
          </div>

          <div className="wo-stats">
            {[
              {
                label: "Total Work Orders",
                value: orders.length,
                icon: ClipboardList
              },
              {
                label: "Pending",
                value: orders.filter(o => o.status === "Pending").length,
                icon: Clock3
              },
              {
                label: "In Progress",
                value: orders.filter(o => o.status === "In Progress").length,
                icon: Wrench
              },
              {
                label: "Completed",
                value: orders.filter(o => o.status === "Completed").length,
                icon: CheckCircle2
              }
            ].map(({ label, value, icon: Icon }) => (
              <div className="wo-stat-card" key={label}>
                <div>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
                <Icon size={25} />
              </div>
            ))}
          </div>

          <div className="wo-panel">
            <div className="wo-panel-heading">
              <h2>Work Order Management</h2>
              <p>Choose a category to manage its records.</p>
            </div>

            <div className="wo-tabs">
              {["All Orders", ...categories].map(category => (
                <button
                  key={category}
                  className={
                    categoryFilter === category ? "active" : ""
                  }
                  onClick={() => setCategoryFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="wo-filters">
              <div className="wo-search">
                <Search size={18} />
                <input
                  placeholder="Search work orders..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>

            <div className="wo-table-wrap">
              <table className="wo-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Job Description</th>
                    <th>Category</th>
                    <th>Flight</th>
                    <th>Assigned To</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(o => (
                    <tr key={o.id}>
                      <td className="wo-order-id">{o.id}</td>
                      <td>{o.title}</td>
                      <td>{o.category}</td>
                      <td>{o.flight}</td>
                      <td>{o.assignedTo}</td>
                      <td>
                        <span className={`wo-badge ${badgeClass(o.priority)}`}>
                          {o.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`wo-badge ${badgeClass(o.status)}`}>
                          {o.status}
                        </span>
                      </td>
                      <td>
                        <div className="wo-row-actions">
                          <button
                            className="wo-open"
                            onClick={() => {
                              setSelectedId(o.id);
                              setMessage("");
                            }}
                          >
                            Open
                          </button>

                          <button
                            className="wo-open"
                            title="Edit Work Order"
                            aria-label={`Edit ${o.id}`}
                            onClick={() => openEditForm(o)}
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <p className="wo-empty">No work orders found.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <button
            className="wo-back"
            onClick={() => {
              setSelectedId(null);
              setMessage("");
            }}
          >
            <ArrowLeft size={18} />
            Back to Work Orders
          </button>

          <div className="wo-page-heading">
            <div>
              <p className="wo-eyebrow">WORK ORDER DETAILS</p>
              <h1>{selectedOrder.id}</h1>
              <p>{selectedOrder.title}</p>
            </div>

            <div className="wo-row-actions">
              <button
                className="wo-secondary"
                onClick={() => openEditForm(selectedOrder)}
              >
                <Pencil size={17} />
                Edit Details
              </button>

              {selectedOrder.status === "Completed" && (
                <button
                  className="wo-secondary"
                  onClick={reopenOrder}
                >
                  <RotateCcw size={17} />
                  Reopen
                </button>
              )}
            </div>
          </div>

          <div className="wo-detail-grid">
            {[
              ["Category", selectedOrder.category],
              ["Flight", selectedOrder.flight],
              ["Aircraft", selectedOrder.aircraft],
              ["Assigned Personnel", selectedOrder.assignedTo],
              ["Priority", selectedOrder.priority],
              ["Status", selectedOrder.status]
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="wo-detail-panel">
            <div className="wo-checklist-heading">
              <div>
                <h2>
                  <ClipboardCheck size={21} />
                  {selectedOrder.category} Checklist
                </h2>
                <p>Record demo task progress and findings.</p>
              </div>

              <span className="wo-progress-label">
                {checkedCount}/{totalItems} Completed
              </span>
            </div>

            <div className="wo-progress">
              <div style={{ width: `${progress}%` }} />
            </div>

            <div className="wo-checklist">
              {templates[selectedOrder.category].map((item, index) => (
                <label className="wo-check-item" key={item}>
                  <input
                    type="checkbox"
                    checked={selectedOrder.checks.includes(index)}
                    disabled={selectedOrder.status === "Completed"}
                    onChange={() => toggleChecklist(index)}
                  />

                  <span>{item}</span>

                  {selectedOrder.checks.includes(index) && (
                    <CheckCircle2 size={18} color="#159966" />
                  )}
                </label>
              ))}
            </div>

            {/* TOOLS PICK SLIP */}
            {selectedOrder.category === "Tools Pick Slip" && (
              <div className="wo-tools-section">
                <div className="wo-tools-heading">
                  <div>
                    <h2>
                      <Wrench size={21} />
                      Tools Pick Slip
                    </h2>
                    <p>
                      Add tools, record issuance and confirm returns.
                    </p>
                  </div>
                  <span className="wo-tools-count">
                    {selectedOrder.tools.length} Tool Items
                  </span>
                </div>

                <div className="wo-tools-table-wrap">
                  <table className="wo-tools-table">
                    <thead>
                      <tr>
                        <th>Tool ID</th>
                        <th>Tool Name</th>
                        <th>Quantity</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedOrder.tools.map(tool => (
                        <tr key={tool.id}>
                          <td>
                            <strong>{tool.id}</strong>
                          </td>

                          <td>
                            <input
                              value={tool.name}
                              disabled={
                                tool.status !== "Pending" ||
                                selectedOrder.status === "Completed"
                              }
                              onChange={e =>
                                editTool(tool.id, "name", e.target.value)
                              }
                              aria-label={`Name for ${tool.id}`}
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={tool.quantity}
                              disabled={
                                tool.status !== "Pending" ||
                                selectedOrder.status === "Completed"
                              }
                              onChange={e =>
                                editTool(tool.id, "quantity", e.target.value)
                              }
                              aria-label={`Quantity for ${tool.id}`}
                              className="wo-quantity-input"
                            />
                          </td>

                          <td>
                            <span className={`wo-tool-status ${
                              tool.status.toLowerCase()
                            }`}>
                              {tool.status}
                            </span>
                          </td>

                          <td>
                            <div className="wo-tool-actions">
                              {tool.status === "Pending" && (
                                <>
                                  <button
                                    className="wo-tool-issue"
                                    disabled={
                                      selectedOrder.status === "Completed" ||
                                      !tool.name.trim()
                                    }
                                    onClick={() =>
                                      changeToolStatus(tool.id, "Issued")
                                    }
                                  >
                                    Issue
                                  </button>

                                  <button
                                    className="wo-tool-delete"
                                    onClick={() => removeTool(tool.id)}
                                    aria-label={`Remove ${tool.id}`}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </>
                              )}

                              {tool.status === "Issued" && (
                                <button
                                  className="wo-tool-return"
                                  disabled={selectedOrder.status === "Completed"}
                                  onClick={() =>
                                    changeToolStatus(tool.id, "Returned")
                                  }
                                >
                                  <RotateCcw size={14} />
                                  Return
                                </button>
                              )}

                              {tool.status === "Returned" && (
                                <span className="wo-returned-label">
                                  <PackageCheck size={16} />
                                  Returned
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {selectedOrder.tools.length === 0 && (
                    <p className="wo-tools-empty">
                      No tools added yet. Use the form below.
                    </p>
                  )}
                </div>

                {selectedOrder.status !== "Completed" && (
                  <form className="wo-add-tool" onSubmit={addTool}>
                    <div>
                      <label>Tool ID</label>
                      <input
                        value={newTool.id}
                        onChange={e =>
                          setNewTool({
                            ...newTool,
                            id: e.target.value
                          })
                        }
                        placeholder="TOOL-003"
                        required
                      />
                    </div>

                    <div>
                      <label>Tool Name</label>
                      <input
                        value={newTool.name}
                        onChange={e =>
                          setNewTool({
                            ...newTool,
                            name: e.target.value
                          })
                        }
                        placeholder="Tool description"
                        required
                      />
                    </div>

                    <div>
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={newTool.quantity}
                        onChange={e =>
                          setNewTool({
                            ...newTool,
                            quantity: e.target.value
                          })
                        }
                      />
                    </div>

                    <button type="submit" className="wo-primary">
                      <Plus size={17} />
                      Add Tool
                    </button>
                  </form>
                )}

                <div className="wo-tools-summary">
                  <div>
                    <span>Pending</span>
                    <strong>
                      {selectedOrder.tools.filter(
                        t => t.status === "Pending"
                      ).length}
                    </strong>
                  </div>
                  <div>
                    <span>Issued</span>
                    <strong>
                      {selectedOrder.tools.filter(
                        t => t.status === "Issued"
                      ).length}
                    </strong>
                  </div>
                  <div>
                    <span>Returned</span>
                    <strong>
                      {selectedOrder.tools.filter(
                        t => t.status === "Returned"
                      ).length}
                    </strong>
                  </div>
                </div>

                <p className="wo-tool-notice">
                  Demo tool register only. Actual tool control
                  requires verified identifiers, custody records,
                  condition checks and authorized reconciliation.
                </p>
              </div>
            )}

            {["Preflight", "Postflight"].includes(
              selectedOrder.category
            ) && (
              <div className="wo-info">
                <ClipboardCheck size={19} />
                <p>
                  Example inspection checklist only.
                  Actual procedures require approved documentation.
                </p>
              </div>
            )}

            <div className="wo-remarks">
              <label htmlFor="wo-remarks">
                <FileText size={17} />
                Remarks / Findings
              </label>

              <textarea
                id="wo-remarks"
                rows="4"
                value={selectedOrder.remarks}
                disabled={selectedOrder.status === "Completed"}
                onChange={e => {
                  updateOrder(selectedOrder.id, {
                    remarks: e.target.value
                  });
                  setMessage("");
                }}
                placeholder="Enter remarks..."
              />
            </div>

            {message && (
              <p className="wo-message" role="status">
                {message}
              </p>
            )}

            <div className="wo-actions">
              <button
                className="wo-secondary"
                onClick={() =>
                  setMessage("Changes saved in browser storage.")
                }
              >
                <Save size={17} />
                Save Progress
              </button>

              <button
                className="wo-primary"
                disabled={selectedOrder.status === "Completed"}
                onClick={completeOrder}
              >
                <CheckCircle2 size={17} />
                {selectedOrder.status === "Completed"
                  ? "Completed"
                  : "Complete Work Order"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ADD / EDIT WORK ORDER MODAL */}
      {showForm && (
        <div className="wo-modal-backdrop">
          <div
            className="wo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wo-modal-title"
          >
            <div className="wo-modal-heading">
              <div>
                <h2 id="wo-modal-title">
                  {editingId ? "Edit Work Order" : "Create Work Order"}
                </h2>
                <p>Enter the work order information.</p>
              </div>

              <button
                className="wo-close"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveOrder}>
              <div className="wo-form-grid">
                <label className="wo-full">
                  Job Description
                  <input
                    required
                    maxLength={120}
                    value={form.title}
                    onChange={e =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="Enter work order title"
                  />
                </label>

                <label>
                  Work Category
                  <select
                    value={form.category}
                    onChange={e =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {categories.map(category => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Flight Number
                  <input
                    required
                    value={form.flight}
                    onChange={e =>
                      setForm({ ...form, flight: e.target.value })
                    }
                    placeholder="PR 204"
                  />
                </label>

                <label>
                  Aircraft Registration
                  <input
                    required
                    value={form.aircraft}
                    onChange={e =>
                      setForm({ ...form, aircraft: e.target.value })
                    }
                    placeholder="RP-C8612"
                  />
                </label>

                <label>
                  Assigned Personnel
                  <input
                    required
                    value={form.assignedTo}
                    onChange={e =>
                      setForm({ ...form, assignedTo: e.target.value })
                    }
                    placeholder="Personnel or team"
                  />
                </label>

                <label className="wo-full">
                  Priority
                  <select
                    value={form.priority}
                    onChange={e =>
                      setForm({ ...form, priority: e.target.value })
                    }
                  >
                    <option>Normal</option>
                    <option>High</option>
                  </select>
                </label>
              </div>

              {formError && (
                <p className="wo-message" role="alert">
                  {formError}
                </p>
              )}

              <div className="wo-modal-actions">
                <button
                  type="button"
                  className="wo-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="wo-primary">
                  <Save size={17} />
                  {editingId ? "Save Changes" : "Create Work Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkOrders;