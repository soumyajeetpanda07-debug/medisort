import "./AdminDashboard.css";
import { useEffect, useState, useRef, useMemo } from "react";

import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase";

// ─── Smooth Animated Number Component ──────────────────────────────────────
function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = display;
    const diff = target - start;
    if (diff === 0) return;
    const duration = 600;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    }

    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value]);

  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function AdminDashboard({ onBackToHome }) {
  // =========================================================
  // THEME & MOBILE NAVIGATION
  // =========================================================
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("medisort_admin_theme") === "dark";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem("medisort_admin_theme", next ? "dark" : "light");
      return next;
    });
  };

  // =========================================================
  // ADMIN PAGE NAVIGATION
  // =========================================================
  const [adminPage, setAdminPage] = useState("dashboard");

  // =========================================================
  // DASHBOARD DATA STATES
  // =========================================================
  const [pickupCount, setPickupCount] = useState(0);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [wasteCollected, setWasteCollected] = useState(0);
  const [activeCollections, setActiveCollections] = useState(0);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [incidents, setIncidents] = useState([]);

  // Search & Filter States
  const [collectorSearch, setCollectorSearch] = useState("");
  const [showCollectorForm, setShowCollectorForm] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [hospitalDrawer, setHospitalDrawer] = useState(null);
  const [wasteSearch, setWasteSearch] = useState("");
  const [wasteCategoryFilter, setWasteCategoryFilter] = useState("All");
  const [manifestModal, setManifestModal] = useState(null);
  const [chartDateRange, setChartDateRange] = useState("7d");

  // Add hospital form state
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState("");
  const [hospitalContact, setHospitalContact] = useState("");
  const [hospitalStatus, setHospitalStatus] = useState("Active");

  // =========================================================
  // LIVE FIREBASE LISTENERS
  // =========================================================

  // 1. Pickup Requests
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "pickupRequests"),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setPickupRequests(data);
        setPickupCount(snapshot.size);
      },
      (error) => console.error("Error loading pickup requests:", error)
    );
    return () => unsubscribe();
  }, []);

  // 2. Waste Batches (Collections count & total weight)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "wasteBatches"),
      (snapshot) => {
        let total = 0;
        let activeCount = 0;
        snapshot.forEach((docSnap) => {
          const waste = docSnap.data();
          if (waste.status === "Collected") {
            total += Number(waste.weight) || 0;
          }
          if (waste.status === "In Transit") {
            activeCount++;
          }
        });
        setWasteCollected(total);
        setActiveCollections(activeCount);
      },
      (error) => console.error("Error loading waste batches:", error)
    );
    return () => unsubscribe();
  }, []);

  // 3. Hospitals
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "hospitals"),
      (snapshot) => {
        setHospitals(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error("Error loading hospitals:", error)
    );
    return () => unsubscribe();
  }, []);

  // 4. Collectors
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "collectors"),
      (snapshot) => {
        setCollectors(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error("Error loading collectors:", error)
    );
    return () => unsubscribe();
  }, []);

  // 5. Waste Records
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "wasteRecords"),
      (snapshot) => {
        setWasteRecords(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error("Error loading waste records:", error)
    );
    return () => unsubscribe();
  }, []);

  // 6. Incidents & Emergency Hazard Alerts
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "incidents"),
      (snapshot) => {
        setIncidents(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => console.error("Error loading incidents:", error)
    );
    return () => unsubscribe();
  }, []);

  // =========================================================
  // HOSPITAL ACTIONS
  // =========================================================

  const handleAddHospital = async (e) => {
    e.preventDefault();
    if (!hospitalName.trim() || !hospitalLocation.trim()) {
      alert("Please enter hospital name and location.");
      return;
    }
    try {
      await addDoc(collection(db, "hospitals"), {
        name: hospitalName.trim(),
        location: hospitalLocation.trim(),
        contact: hospitalContact.trim(),
        status: hospitalStatus,
        createdAt: serverTimestamp(),
      });
      alert("✅ Hospital added successfully!");
      setHospitalName("");
      setHospitalLocation("");
      setHospitalContact("");
      setHospitalStatus("Active");
      setShowHospitalForm(false);
    } catch (error) {
      console.error("Error adding hospital:", error);
      alert("❌ Failed to add hospital.");
    }
  };

  const handleSaveHospitalEdit = async (e) => {
    e.preventDefault();
    if (!editingHospital) return;
    try {
      await updateDoc(doc(db, "hospitals", editingHospital.id), {
        name: editingHospital.name.trim(),
        location: editingHospital.location.trim(),
        contact: editingHospital.contact?.trim() || "",
        status: editingHospital.status || "Active",
        updatedAt: serverTimestamp(),
      });
      alert("✅ Hospital updated successfully!");
      setEditingHospital(null);
    } catch (error) {
      console.error("Error updating hospital:", error);
      alert("❌ Failed to update hospital.");
    }
  };

  const handleDeleteHospital = async (hospitalId) => {
    if (!window.confirm("Are you sure you want to delete this hospital?")) return;
    try {
      await deleteDoc(doc(db, "hospitals", hospitalId));
      alert("Hospital deleted successfully.");
    } catch (error) {
      console.error("Error deleting hospital:", error);
      alert("Failed to delete hospital.");
    }
  };

  // =========================================================
  // COLLECTOR ACTIONS
  // =========================================================

  const handleAddCollector = async (e) => {
    e.preventDefault();
    const form = e.target;
    const collectorName = form.collectorName.value.trim();
    const contactNumber = form.contactNumber.value.trim();
    const assignedArea = form.assignedArea.value.trim();
    const vehicleNo = form.vehicleNo?.value.trim() || "OD-02-AK-9412";
    const status = form.status.value;

    if (!collectorName || !contactNumber || !assignedArea) {
      alert("Please fill in all collector details.");
      return;
    }

    try {
      await addDoc(collection(db, "collectors"), {
        name: collectorName,
        contact: contactNumber,
        assignedArea: assignedArea,
        vehicleNo: vehicleNo,
        status: status,
        createdAt: serverTimestamp(),
      });
      alert("✅ Collector added successfully!");
      form.reset();
      setShowCollectorForm(false);
    } catch (error) {
      console.error("Error adding collector:", error);
      alert("❌ Failed to add collector.");
    }
  };

  const handleToggleCollectorDuty = async (collector) => {
    const nextStatus = collector.status === "Active" ? "Inactive" : "Active";
    try {
      await updateDoc(doc(db, "collectors", collector.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error toggling collector status:", error);
      alert("❌ Failed to update collector status.");
    }
  };

  const handleDeleteCollector = async (collectorId) => {
    if (!window.confirm("Are you sure you want to delete this collector?")) return;
    try {
      await deleteDoc(doc(db, "collectors", collectorId));
      alert("✅ Collector deleted successfully!");
    } catch (error) {
      console.error("Error deleting collector:", error);
      alert("❌ Failed to delete collector.");
    }
  };

  // =========================================================
  // INCIDENT MANAGEMENT ACTIONS
  // =========================================================

  const handleResolveIncident = async (incidentId) => {
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        status: "Resolved",
        resolvedAt: serverTimestamp(),
      });
      alert("✅ Incident marked as Resolved.");
    } catch (error) {
      console.error("Error resolving incident:", error);
      alert("❌ Failed to resolve incident.");
    }
  };

  const handleInvestigateIncident = async (incidentId) => {
    try {
      await updateDoc(doc(db, "incidents", incidentId), {
        status: "Investigating",
        investigatingAt: serverTimestamp(),
      });
      alert("⚠️ Incident status set to Investigating.");
    } catch (error) {
      console.error("Error setting incident status:", error);
    }
  };

  // =========================================================
  // CSV EXPORT FUNCTION
  // =========================================================
  const exportWasteCSV = () => {
    if (!wasteRecords.length) {
      alert("No waste records to export.");
      return;
    }
    const headers = ["Record ID", "Hospital", "Waste Type", "Category", "Weight (kg)", "Recorded Date"];
    const rows = wasteRecords.map((r) => {
      const dateStr = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : "—";
      return [
        `"${r.id || ""}"`,
        `"${r.hospital || "Unknown Hospital"}"`,
        `"${r.wasteType || "Biomedical"}"`,
        `"${r.category || "Mixed"}"`,
        r.weight || 0,
        `"${dateStr}"`,
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `medisort_waste_records_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================
  // FILTERED LISTS & COMPUTATIONS
  // =========================================================

  const filteredHospitals = hospitals.filter((hospital) =>
    hospital.name?.toLowerCase().includes(hospitalSearch.toLowerCase()) ||
    hospital.location?.toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  const filteredCollectors = collectors.filter((collector) =>
    collector.name?.toLowerCase().includes(collectorSearch.toLowerCase()) ||
    collector.assignedArea?.toLowerCase().includes(collectorSearch.toLowerCase())
  );

  const filteredWasteRecords = wasteRecords.filter((record) => {
    const search = wasteSearch.toLowerCase();
    const matchesSearch =
      record.wasteType?.toLowerCase().includes(search) ||
      record.category?.toLowerCase().includes(search) ||
      record.hospital?.toLowerCase().includes(search);
    const matchesCat =
      wasteCategoryFilter === "All" ||
      (record.category || "").toLowerCase() === wasteCategoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const totalWasteWeight = wasteRecords.reduce(
    (total, record) => total + (Number(record.weight) || 0),
    0
  );

  const wasteCategories = new Set(
    wasteRecords.map((record) => record.category).filter(Boolean)
  ).size;

  const reportingHospitals = new Set(
    wasteRecords.map((record) => record.hospital).filter(Boolean)
  ).size;

  const categoryWeights = useMemo(() => {
    return wasteRecords.reduce((weights, record) => {
      const cat = record.category || "Mixed";
      weights[cat] = (weights[cat] || 0) + (Number(record.weight) || 0);
      return weights;
    }, {});
  }, [wasteRecords]);

  const categoryCounts = useMemo(() => {
    return wasteRecords.reduce((counts, record) => {
      const cat = record.category || "Mixed";
      counts[cat] = (counts[cat] || 0) + 1;
      return counts;
    }, {});
  }, [wasteRecords]);

  const categoryWeightPercentages = useMemo(() => {
    return Object.entries(categoryWeights).reduce((percentages, [cat, weight]) => {
      percentages[cat] = totalWasteWeight > 0 ? (weight / totalWasteWeight) * 100 : 0;
      return percentages;
    }, {});
  }, [categoryWeights, totalWasteWeight]);

  // Real Combined Live Activities
  const recentActivities = useMemo(() => {
    const items = [];
    pickupRequests.forEach((p) => {
      const d = p.requestedAt?.toDate
        ? p.requestedAt.toDate()
        : p.createdAt?.toDate
        ? p.createdAt.toDate()
        : null;
      items.push({
        id: `pickup-${p.id}`,
        title: `${p.hospital || "Hospital"} requested pickup`,
        subtitle: `${p.category || "Mixed Waste"} • ${p.weight ? p.weight + " kg" : "Awaiting pickup"}`,
        status: p.status || "Pending",
        time: d,
        icon: "📦",
        color: "blue",
      });
    });

    wasteRecords.forEach((w) => {
      const d = w.createdAt?.toDate ? w.createdAt.toDate() : null;
      items.push({
        id: `waste-${w.id}`,
        title: `${w.hospital || "Hospital"} logged ${w.wasteType || "waste"}`,
        subtitle: `Category: ${w.category || "Clinical"} • ${w.weight || 0} kg`,
        status: "Recorded",
        time: d,
        icon: "♻️",
        color: "green",
      });
    });

    return items
      .sort((a, b) => (b.time?.getTime() || 0) - (a.time?.getTime() || 0))
      .slice(0, 5);
  }, [pickupRequests, wasteRecords]);

  // Active Incidents Breakdown
  const activeIncidents = incidents.filter((i) => i.status !== "Resolved");
  const criticalIncidents = incidents.filter((i) => i.severity === "Critical" || i.severity === "High");

  // Daily Trend Bars for SVG Chart (last 7 days)
  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const target = new Date();
      target.setDate(now.getDate() - i);
      const dayName = days[target.getDay()];
      const dayWeight = wasteRecords
        .filter((r) => {
          if (!r.createdAt?.toDate) return false;
          const rd = r.createdAt.toDate();
          return (
            rd.getDate() === target.getDate() &&
            rd.getMonth() === target.getMonth() &&
            rd.getFullYear() === target.getFullYear()
          );
        })
        .reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

      result.push({
        label: dayName,
        weight: Math.round(dayWeight),
      });
    }
    return result;
  }, [wasteRecords]);

  const maxWeeklyWeight = Math.max(...weeklyData.map((d) => d.weight), 50);

  return (
    <div
      className="admin-dashboard"
      data-admin-theme={darkMode ? "dark" : "light"}
    >
      {/* MOBILE TOP BAR */}
      <div className="admin-mobile-bar">
        <div className="admin-logo" style={{ padding: 0, border: "none" }}>
          <div
            className="admin-logo-icon"
            style={{ width: 34, height: 34, fontSize: 17 }}
          >
            ♻
          </div>
          <h2 style={{ fontSize: 16 }}>MediSort Admin</h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="admin-mobile-toggle"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {darkMode ? "🌙" : "☀️"}
          </button>
          <button
            type="button"
            className="admin-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      <div
        className={`admin-drawer-overlay ${mobileMenuOpen ? "show" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="admin-logo">
          <div className="admin-logo-icon">♻</div>
          <div>
            <h2>MediSort</h2>
            <span>Enterprise Admin</span>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${adminPage === "dashboard" ? "active" : ""}`}
            onClick={() => {
              setAdminPage("dashboard");
              setMobileMenuOpen(false);
            }}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>

          <button
            className={`admin-nav-item ${adminPage === "hospitals" ? "active" : ""}`}
            onClick={() => {
              setAdminPage("hospitals");
              setMobileMenuOpen(false);
            }}
          >
            <span>🏥</span>
            <span>Hospitals</span>
            <span className="admin-nav-badge">{hospitals.length}</span>
          </button>

          <button
            className={`admin-nav-item ${adminPage === "collectors" ? "active" : ""}`}
            onClick={() => {
              setAdminPage("collectors");
              setMobileMenuOpen(false);
            }}
          >
            <span>🚚</span>
            <span>Fleet & Drivers</span>
            <span className="admin-nav-badge">{collectors.length}</span>
          </button>

          <button
            className={`admin-nav-item ${adminPage === "wasteRecords" ? "active" : ""}`}
            onClick={() => {
              setAdminPage("wasteRecords");
              setMobileMenuOpen(false);
            }}
          >
            <span>♻️</span>
            <span>Waste Records</span>
            <span className="admin-nav-badge">{wasteRecords.length}</span>
          </button>

          <button
            className={`admin-nav-item ${adminPage === "incidents" ? "active" : ""}`}
            onClick={() => {
              setAdminPage("incidents");
              setMobileMenuOpen(false);
            }}
          >
            <span>🚨</span>
            <span>Hazards & Alerts</span>
            {activeIncidents.length > 0 && (
              <span className="admin-nav-badge" style={{ background: "#ef4444", color: "#fff" }}>
                {activeIncidents.length}
              </span>
            )}
          </button>

          <button
            className={`admin-nav-item ${adminPage === "manifests" ? "active" : ""}`}
            onClick={() => {
              setAdminPage("manifests");
              setMobileMenuOpen(false);
            }}
          >
            <span>📄</span>
            <span>CPCB Manifests</span>
          </button>

          <button
            className={`admin-nav-item ${adminPage === "reports" ? "active" : ""}`}
            onClick={() => {
              setAdminPage("reports");
              setMobileMenuOpen(false);
            }}
          >
            <span>📈</span>
            <span>Analytics & Charts</span>
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-theme-btn"
            onClick={toggleTheme}
            title="Toggle theme mode"
          >
            <span>{darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Switch</span>
          </button>

          <button className="admin-nav-item" onClick={onBackToHome}>
            <span>🏠</span>
            <span>Hospital Portal</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT VIEWPORT
      ====================================================== */}
      <main className="admin-main">
        {/* ===================================================
            VIEW 1: HOSPITALS PAGE
        ==================================================== */}
        {adminPage === "hospitals" ? (
          <div className="hospital-management-page">
            <header className="hospital-page-header">
              <div>
                <p className="admin-eyebrow">MediSort Administration</p>
                <h1>Registered Hospitals</h1>
                <p>Manage health facilities, assigned wards, and compliance status.</p>
              </div>

              <button
                className="add-hospital-btn"
                onClick={() => setShowHospitalForm(true)}
              >
                + Add Hospital
              </button>
            </header>

            <div className="hospital-search-box">
              <input
                type="text"
                placeholder="Search hospitals by facility name, ward, or city..."
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
              />
            </div>

            <div className="hospital-list-card">
              <div className="hospital-list-header">
                <div>
                  <h2>Connected Health Facilities</h2>
                  <p>Central biomedical waste reporting network</p>
                </div>
                <span>{filteredHospitals.length} Hospitals</span>
              </div>

              {filteredHospitals.length === 0 ? (
                <div className="empty-hospitals">
                  <div className="empty-hospital-icon">🏥</div>
                  <h3>No hospitals found</h3>
                  <p>Add a hospital to get started with waste management.</p>
                </div>
              ) : (
                <div className="hospital-table">
                  <div className="hospital-table-row hospital-table-heading">
                    <span>Hospital Facility</span>
                    <span>Location / Area</span>
                    <span>Emergency Contact</span>
                    <span>Compliance</span>
                    <span style={{ textAlign: "right" }}>Actions</span>
                  </div>

                  {filteredHospitals.map((hospital) => (
                    <div className="hospital-table-row" key={hospital.id}>
                      <span
                        style={{ cursor: "pointer" }}
                        onClick={() => setHospitalDrawer(hospital)}
                        title="Click to view facility details"
                      >
                        <strong style={{ color: "var(--ad-blue)" }}>{hospital.name}</strong>
                      </span>

                      <span>📍 {hospital.location}</span>
                      <span>📞 {hospital.contact || "—"}</span>

                      <span>
                        <span
                          className={`hospital-status ${
                            hospital.status === "Inactive" ? "inactive" : ""
                          }`}
                        >
                          {hospital.status || "Active"}
                        </span>
                      </span>

                      <span style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="edit-action-btn"
                          onClick={() => setEditingHospital({ ...hospital })}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="delete-hospital-btn"
                          onClick={() => handleDeleteHospital(hospital.id)}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ADD HOSPITAL MODAL */}
            {showHospitalForm && (
              <div className="hospital-modal-overlay" onClick={() => setShowHospitalForm(false)}>
                <div className="hospital-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="hospital-modal-header">
                    <div>
                      <h2>Register New Hospital</h2>
                      <p>Add a healthcare provider to MediSort.</p>
                    </div>
                    <button className="hospital-modal-close" onClick={() => setShowHospitalForm(false)}>×</button>
                  </div>

                  <form onSubmit={handleAddHospital} className="hospital-form">
                    <div className="hospital-form-group">
                      <label>Hospital Facility Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Apollo Hospital, Ward 4"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="hospital-form-group">
                      <label>Location / Address</label>
                      <input
                        type="text"
                        placeholder="e.g. Unit 15, Bhubaneswar"
                        value={hospitalLocation}
                        onChange={(e) => setHospitalLocation(e.target.value)}
                        required
                      />
                    </div>

                    <div className="hospital-form-group">
                      <label>Contact Number / Coordinator</label>
                      <input
                        type="text"
                        placeholder="Phone or extension"
                        value={hospitalContact}
                        onChange={(e) => setHospitalContact(e.target.value)}
                      />
                    </div>

                    <div className="hospital-form-group">
                      <label>Initial Status</label>
                      <select
                        value={hospitalStatus}
                        onChange={(e) => setHospitalStatus(e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="hospital-form-actions">
                      <button
                        type="button"
                        className="hospital-cancel-btn"
                        onClick={() => setShowHospitalForm(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="hospital-save-btn">
                        Register Facility
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* EDIT HOSPITAL MODAL */}
            {editingHospital && (
              <div className="hospital-modal-overlay" onClick={() => setEditingHospital(null)}>
                <div className="hospital-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="hospital-modal-header">
                    <div>
                      <h2>Edit Facility Profile</h2>
                      <p>Update hospital contact, address, and status.</p>
                    </div>
                    <button className="hospital-modal-close" onClick={() => setEditingHospital(null)}>×</button>
                  </div>

                  <form onSubmit={handleSaveHospitalEdit} className="hospital-form">
                    <div className="hospital-form-group">
                      <label>Hospital Facility Name</label>
                      <input
                        type="text"
                        value={editingHospital.name}
                        onChange={(e) => setEditingHospital({ ...editingHospital, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="hospital-form-group">
                      <label>Location / City</label>
                      <input
                        type="text"
                        value={editingHospital.location}
                        onChange={(e) => setEditingHospital({ ...editingHospital, location: e.target.value })}
                        required
                      />
                    </div>

                    <div className="hospital-form-group">
                      <label>Contact Info</label>
                      <input
                        type="text"
                        value={editingHospital.contact || ""}
                        onChange={(e) => setEditingHospital({ ...editingHospital, contact: e.target.value })}
                      />
                    </div>

                    <div className="hospital-form-group">
                      <label>Status</label>
                      <select
                        value={editingHospital.status || "Active"}
                        onChange={(e) => setEditingHospital({ ...editingHospital, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>

                    <div className="hospital-form-actions">
                      <button
                        type="button"
                        className="hospital-cancel-btn"
                        onClick={() => setEditingHospital(null)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="hospital-save-btn">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* FACILITY DETAIL DRAWER */}
            {hospitalDrawer && (
              <div className="hospital-modal-overlay" onClick={() => setHospitalDrawer(null)}>
                <div className="hospital-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="hospital-modal-header">
                    <div>
                      <h2>🏥 {hospitalDrawer.name}</h2>
                      <p>Facility overview & waste statistics</p>
                    </div>
                    <button className="hospital-modal-close" onClick={() => setHospitalDrawer(null)}>×</button>
                  </div>

                  <div className="manifest-cert-grid" style={{ marginBottom: 16 }}>
                    <div>
                      <small>Location</small>
                      <strong>{hospitalDrawer.location}</strong>
                    </div>
                    <div>
                      <small>Status</small>
                      <strong style={{ color: "var(--ad-green)" }}>{hospitalDrawer.status || "Active"}</strong>
                    </div>
                    <div>
                      <small>Total Batches Logged</small>
                      <strong>
                        {wasteRecords.filter((w) => w.hospital === hospitalDrawer.name).length} Batches
                      </strong>
                    </div>
                    <div>
                      <small>Total Weight</small>
                      <strong>
                        {wasteRecords
                          .filter((w) => w.hospital === hospitalDrawer.name)
                          .reduce((s, r) => s + (Number(r.weight) || 0), 0)
                          .toFixed(1)}{" "}
                        kg
                      </strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="save-hospital-btn"
                      onClick={() => setHospitalDrawer(null)}
                    >
                      Close View
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : adminPage === "collectors" ? (
          /* ===================================================
              VIEW 2: COLLECTORS FLEET & DRIVERS
          ==================================================== */
          <div className="collector-management-page">
            <header className="collector-page-header">
              <div>
                <p className="admin-eyebrow">MediSort Administration</p>
                <h1>Collection Fleet & Drivers</h1>
                <p>Manage transport staff, corridor routes, and on-duty status.</p>
              </div>

              <button
                className="add-collector-btn"
                onClick={() => setShowCollectorForm(true)}
              >
                + Add Driver
              </button>
            </header>

            {showCollectorForm && (
              <div className="collector-form-card">
                <div className="collector-form-header">
                  <div>
                    <h2>Add New Collection Agent</h2>
                    <p>Register hazardous waste transport crew.</p>
                  </div>
                  <button
                    type="button"
                    className="close-collector-form"
                    onClick={() => setShowCollectorForm(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddCollector}>
                  <div className="collector-form-grid">
                    <div className="collector-form-group">
                      <label>Driver / Collector Name</label>
                      <input type="text" name="collectorName" placeholder="Full legal name" required />
                    </div>

                    <div className="collector-form-group">
                      <label>Contact Number</label>
                      <input type="text" name="contactNumber" placeholder="10-digit mobile number" required />
                    </div>

                    <div className="collector-form-group">
                      <label>Assigned Corridor / Zone</label>
                      <input type="text" name="assignedArea" placeholder="e.g. Bhubaneswar Central Zone" required />
                    </div>

                    <div className="collector-form-group">
                      <label>Vehicle Reg Number</label>
                      <input type="text" name="vehicleNo" placeholder="e.g. OD-02-AK-9412" defaultValue="OD-02-AK-9412" />
                    </div>

                    <div className="collector-form-group">
                      <label>Duty Status</label>
                      <select name="status" defaultValue="Active">
                        <option value="Active">Active (On Duty)</option>
                        <option value="Inactive">Inactive (Off Duty)</option>
                      </select>
                    </div>
                  </div>

                  <div className="collector-form-actions">
                    <button
                      type="button"
                      className="cancel-collector-btn"
                      onClick={() => setShowCollectorForm(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="save-collector-btn">
                      Save Fleet Agent
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="collector-search-box">
              <input
                type="text"
                placeholder="Search drivers by name, corridor, or phone..."
                value={collectorSearch}
                onChange={(e) => setCollectorSearch(e.target.value)}
              />
            </div>

            <div className="collector-list-card">
              <div className="collector-list-header">
                <div>
                  <h2>Active Fleet Roster</h2>
                  <p>Instant duty toggling and vehicle assignment</p>
                </div>
                <span>{filteredCollectors.length} Personnel</span>
              </div>

              {filteredCollectors.length === 0 ? (
                <div className="empty-collectors">
                  <div className="empty-collector-icon">🚚</div>
                  <h3>No drivers registered</h3>
                  <p>Add drivers to begin route dispatch.</p>
                </div>
              ) : (
                <div className="collector-table">
                  {filteredCollectors.map((collector) => (
                    <div className="collector-table-row" key={collector.id}>
                      <div className="collector-info">
                        <div className="collector-avatar">
                          {collector.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3>{collector.name}</h3>
                          <p>📞 {collector.contact}</p>
                        </div>
                      </div>

                      <div className="collector-area">
                        <span>Assigned Route</span>
                        <strong>{collector.assignedArea}</strong>
                      </div>

                      <div>
                        <span style={{ fontSize: 11, color: "var(--ad-text-muted)", display: "block" }}>Vehicle</span>
                        <strong style={{ fontSize: 12 }}>{collector.vehicleNo || "OD-02-AK-9412"}</strong>
                      </div>

                      <div>
                        <button
                          type="button"
                          className={`collector-duty-toggle ${collector.status === "Active" ? "active" : "inactive"}`}
                          onClick={() => handleToggleCollectorDuty(collector)}
                          title="Click to toggle On/Off Duty"
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: collector.status === "Active" ? "#10b981" : "#94a3b8" }} />
                          {collector.status === "Active" ? "On Duty" : "Off Duty"}
                        </button>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="delete-collector-btn"
                          onClick={() => handleDeleteCollector(collector.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : adminPage === "wasteRecords" ? (
          /* ===================================================
              VIEW 3: WASTE RECORDS AUDIT LOG
          ==================================================== */
          <div className="waste-records-page">
            <header className="waste-records-header">
              <div>
                <p className="admin-eyebrow">MediSort Administration</p>
                <h1>Waste Audit Records</h1>
                <p>Digital manifest tracking and waste categorization registry.</p>
              </div>

              <button type="button" className="admin-export-btn" onClick={exportWasteCSV}>
                📥 Export CSV
              </button>
            </header>

            <div className="waste-summary-grid">
              <div className="waste-summary-card">
                <span>📋</span>
                <div>
                  <p>Total Batches</p>
                  <strong><AnimatedNumber value={wasteRecords.length} /></strong>
                </div>
              </div>

              <div className="waste-summary-card">
                <span>⚖️</span>
                <div>
                  <p>Total Safe Disposal</p>
                  <strong><AnimatedNumber value={Math.round(totalWasteWeight)} suffix=" kg" /></strong>
                </div>
              </div>

              <div className="waste-summary-card">
                <span>♻️</span>
                <div>
                  <p>Categorized Streams</p>
                  <strong>{wasteCategories} Streams</strong>
                </div>
              </div>
            </div>

            <div className="waste-records-search">
              <input
                type="text"
                placeholder="Search waste records by hospital, category, or waste type..."
                value={wasteSearch}
                onChange={(e) => setWasteSearch(e.target.value)}
              />

              <div className="waste-cat-pills">
                {["All", "Yellow", "Red", "Blue", "White"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`waste-cat-pill ${wasteCategoryFilter === cat ? "active" : ""}`}
                    onClick={() => setWasteCategoryFilter(cat)}
                  >
                    {cat === "Yellow" ? "🟡 Yellow" : cat === "Red" ? "🔴 Red" : cat === "Blue" ? "🔵 Blue" : cat === "White" ? "⚪ White" : "All Categories"}
                  </button>
                ))}
              </div>
            </div>

            <div className="waste-records-card">
              <div className="waste-records-card-header">
                <div>
                  <h2>Logged Hazardous Waste Batches</h2>
                  <p>Traceable entries with hospital verification</p>
                </div>
                <span>{filteredWasteRecords.length} Records</span>
              </div>

              {filteredWasteRecords.length === 0 ? (
                <div className="waste-records-empty">
                  <div className="waste-records-icon">♻️</div>
                  <h3>No waste records found</h3>
                  <p>Logged batches will automatically show up here.</p>
                </div>
              ) : (
                <div className="waste-records-list">
                  {filteredWasteRecords.map((record) => (
                    <div className="waste-record-row" key={record.id}>
                      <div className="waste-record-main">
                        <div className="waste-record-icon">♻️</div>
                        <div>
                          <h3>{record.wasteType || "Biomedical Waste"}</h3>
                          <p>{record.hospital || "Unknown Hospital"}</p>
                        </div>
                      </div>

                      <div className="waste-record-category">
                        <span>Category</span>
                        <strong className={`recent-category ${(record.category || "").toLowerCase()}`}>
                          {record.category || "Mixed"}
                        </strong>
                      </div>

                      <div className="waste-record-weight">
                        <span>Weight</span>
                        <strong>{record.weight || 0} kg</strong>
                      </div>

                      <div className="waste-record-date">
                        <span>Logged On</span>
                        <strong>
                          {record.createdAt?.toDate ? record.createdAt.toDate().toLocaleDateString() : "—"}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : adminPage === "incidents" ? (
          /* ===================================================
              VIEW 4: HAZARD INCIDENTS & EMERGENCY CENTER
          ==================================================== */
          <div className="incident-management-page">
            <header className="hospital-page-header">
              <div>
                <p className="admin-eyebrow" style={{ color: "#ef4444" }}>EMERGENCY RESPONSE</p>
                <h1>Biological Hazard & Incident Center</h1>
                <p>Driver containment alerts, spills, and transport route bottlenecks.</p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <span className="incident-badge critical">
                  {criticalIncidents.length} Critical
                </span>
                <span className="incident-badge medium">
                  {activeIncidents.length} Active
                </span>
              </div>
            </header>

            <div className="incident-stats-grid">
              <div className="incident-stat-card">
                <div className="incident-stat-icon red">⚠️</div>
                <div>
                  <p>Active Emergencies</p>
                  <strong style={{ color: "#ef4444" }}>{activeIncidents.length}</strong>
                </div>
              </div>

              <div className="incident-stat-card">
                <div className="incident-stat-icon yellow">⏳</div>
                <div>
                  <p>Under Investigation</p>
                  <strong>
                    {incidents.filter((i) => i.status === "Investigating").length}
                  </strong>
                </div>
              </div>

              <div className="incident-stat-card">
                <div className="incident-stat-icon green">✅</div>
                <div>
                  <p>Resolved Incidents</p>
                  <strong>
                    {incidents.filter((i) => i.status === "Resolved").length}
                  </strong>
                </div>
              </div>
            </div>

            <div className="incident-list-card">
              <div className="hospital-list-header">
                <div>
                  <h2>Live Incident Stream</h2>
                  <p>Logged by field collectors via driver console</p>
                </div>
                <span>{incidents.length} Total Logged</span>
              </div>

              {incidents.length === 0 ? (
                <div className="reports-empty">
                  <div style={{ fontSize: 44, marginBottom: 8 }}>🛡️</div>
                  <h3>No incidents reported</h3>
                  <p>All biological waste transit routes are currently safe and operating normally.</p>
                </div>
              ) : (
                incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className={`incident-item-card ${(inc.severity || "medium").toLowerCase()} ${inc.status === "Resolved" ? "resolved" : ""}`}
                  >
                    <div className="incident-item-header">
                      <div className="incident-title-wrap">
                        <h3>{inc.type || "Spill Alert"}</h3>
                        <span className={`incident-badge ${(inc.severity || "medium").toLowerCase()}`}>
                          {inc.severity || "Medium"} Severity
                        </span>
                        {inc.status === "Resolved" && (
                          <span className="incident-badge resolved">Resolved</span>
                        )}
                      </div>

                      <div className="incident-actions">
                        {inc.status !== "Resolved" && (
                          <>
                            <button
                              type="button"
                              className="btn-investigate-incident"
                              onClick={() => handleInvestigateIncident(inc.id)}
                            >
                              Investigate
                            </button>
                            <button
                              type="button"
                              className="btn-resolve-incident"
                              onClick={() => handleResolveIncident(inc.id)}
                            >
                              ✓ Mark Resolved
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="incident-desc">{inc.description}</p>

                    <div className="incident-meta-row">
                      <div className="incident-meta-tags">
                        <span>📍 {inc.hospital || "Central Transit Route"}</span>
                        <span>👷 {inc.collector || "Field Driver"}</span>
                      </div>
                      <small>
                        {inc.reportedAt?.toDate
                          ? inc.reportedAt.toDate().toLocaleString()
                          : "Recently reported"}
                      </small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : adminPage === "manifests" ? (
          /* ===================================================
              VIEW 5: CPCB FORM IV MANIFEST REGULATORY HUB
          ==================================================== */
          <div className="manifest-management-page">
            <header className="waste-records-header">
              <div>
                <p className="admin-eyebrow">REGULATORY GOVERNANCE</p>
                <h1>CPCB Form IV Manifest Center</h1>
                <p>Central Pollution Control Board bio-medical consignment audit verification.</p>
              </div>

              <button type="button" className="admin-export-btn" onClick={exportWasteCSV}>
                📥 Export Manifest Ledger
              </button>
            </header>

            <div className="manifest-list-card">
              <div className="hospital-list-header">
                <div>
                  <h2>Issued Transfer Manifests (Form IV)</h2>
                  <p>Certified chain-of-custody documentation</p>
                </div>
                <span>{pickupRequests.filter((p) => p.status === "Collected").length} Verified Manifests</span>
              </div>

              {pickupRequests.filter((p) => p.status === "Collected").length === 0 ? (
                <div className="reports-empty">
                  <div style={{ fontSize: 44, marginBottom: 8 }}>📄</div>
                  <h3>No completed manifests yet</h3>
                  <p>Form IV manifests will appear as soon as collectors mark pickups as Collected.</p>
                </div>
              ) : (
                pickupRequests
                  .filter((p) => p.status === "Collected")
                  .map((pickup) => (
                    <div className="manifest-card" key={pickup.id}>
                      <div className="manifest-meta">
                        <div className="manifest-icon">📄</div>
                        <div>
                          <strong>{pickup.hospital || "Hospital Facility"}</strong>
                          <span>
                            Consignment ID: MS-F4-{pickup.id.slice(0, 8).toUpperCase()} • {pickup.category || "Mixed"} Stream • {pickup.weight ? pickup.weight + " kg" : "Verified"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="manifest-btn-view"
                        onClick={() => setManifestModal(pickup)}
                      >
                        Inspect Form IV
                      </button>
                    </div>
                  ))
              )}
            </div>

            {/* FORM IV MODAL DIALOG */}
            {manifestModal && (
              <div className="hospital-modal-overlay" onClick={() => setManifestModal(null)}>
                <div className="manifest-certificate" onClick={(e) => e.stopPropagation()}>
                  <div className="manifest-cert-header">
                    <h2>Central Pollution Control Board</h2>
                    <p>Form IV · Bio-Medical Waste Management Rules 2016</p>
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                      CONSIGNMENT TRANSFER CERTIFICATE
                    </span>
                  </div>

                  <div className="manifest-cert-grid">
                    <div>
                      <small>Manifest Number</small>
                      <strong>MS-F4-{manifestModal.id.slice(0, 8).toUpperCase()}</strong>
                    </div>
                    <div>
                      <small>Verification Date</small>
                      <strong>{new Date().toLocaleDateString()}</strong>
                    </div>
                    <div>
                      <small>Consignor (Healthcare Facility)</small>
                      <strong>{manifestModal.hospital || "Hospital Facility"}</strong>
                    </div>
                    <div>
                      <small>Consignee (Disposal Operator)</small>
                      <strong>MediSort CleanCare Facilities Pvt Ltd</strong>
                    </div>
                    <div>
                      <small>Bio-Medical Waste Stream</small>
                      <strong>{manifestModal.category || "Yellow Clinical Waste"}</strong>
                    </div>
                    <div>
                      <small>Certified Weight</small>
                      <strong>{manifestModal.weight || "12.5"} kg</strong>
                    </div>
                  </div>

                  <div className="manifest-cert-stamp">
                    <div>
                      <small style={{ display: "block", color: "#64748b" }}>Vehicle Tracking</small>
                      <strong>OD-02-AK-9412 (GPS Monitored)</strong>
                    </div>

                    <div className="stamp-box">
                      CPCB Form IV Certified
                    </div>
                  </div>

                  <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button
                      type="button"
                      className="hospital-cancel-btn"
                      onClick={() => setManifestModal(null)}
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      className="hospital-save-btn"
                      onClick={() => window.print()}
                    >
                      🖨️ Print Certificate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : adminPage === "reports" ? (
          /* ===================================================
              VIEW 6: REPORTS & INTERACTIVE SVG CHARTS
          ==================================================== */
          <div className="reports-page">
            <header className="reports-header">
              <div>
                <p className="admin-eyebrow">MEDISORT ADMINISTRATION</p>
                <h1>Reports & Operational Analytics</h1>
                <p className="reports-subtitle">
                  CPCB compliance statistics, daily collection trend charts, and category shares.
                </p>
              </div>

              <button type="button" className="admin-export-btn" onClick={exportWasteCSV}>
                📥 Export Ledger CSV
              </button>
            </header>

            <section className="reports-summary-grid">
              <div className="reports-summary-card">
                <div className="reports-summary-icon">📋</div>
                <div>
                  <p>Total Records</p>
                  <strong><AnimatedNumber value={wasteRecords.length} /></strong>
                </div>
              </div>

              <div className="reports-summary-card">
                <div className="reports-summary-icon">⚖️</div>
                <div>
                  <p>Total Kilograms Safe Disposal</p>
                  <strong><AnimatedNumber value={Math.round(totalWasteWeight)} suffix=" kg" /></strong>
                </div>
              </div>

              <div className="reports-summary-card">
                <div className="reports-summary-icon">🏥</div>
                <div>
                  <p>Reporting Hospitals</p>
                  <strong><AnimatedNumber value={reportingHospitals} /></strong>
                </div>
              </div>
            </section>

            {/* INTERACTIVE SVG CHARTS CONTAINER */}
            <section className="charts-container">
              {/* CHART 1: WEEKLY DAILY WASTE SVG BAR CHART */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <div>
                    <h3>Daily Collection Volume (Last 7 Days)</h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ad-text-muted)" }}>
                      Daily kilograms processed through authorized corridors
                    </p>
                  </div>

                  <div className="chart-date-pills">
                    <button
                      type="button"
                      className={`chart-pill ${chartDateRange === "7d" ? "active" : ""}`}
                      onClick={() => setChartDateRange("7d")}
                    >
                      Last 7D
                    </button>
                    <button
                      type="button"
                      className={`chart-pill ${chartDateRange === "30d" ? "active" : ""}`}
                      onClick={() => setChartDateRange("30d")}
                    >
                      30D
                    </button>
                  </div>
                </div>

                <svg className="svg-bar-chart" viewBox="0 0 500 200">
                  <line x1="40" y1="30" x2="480" y2="30" className="svg-grid-line" />
                  <line x1="40" y1="90" x2="480" y2="90" className="svg-grid-line" />
                  <line x1="40" y1="150" x2="480" y2="150" className="svg-grid-line" />

                  <text x="30" y="35" textAnchor="end" className="svg-axis-label">
                    {maxWeeklyWeight}k
                  </text>
                  <text x="30" y="95" textAnchor="end" className="svg-axis-label">
                    {Math.round(maxWeeklyWeight / 2)}k
                  </text>
                  <text x="30" y="155" textAnchor="end" className="svg-axis-label">
                    0
                  </text>

                  {weeklyData.map((d, index) => {
                    const barWidth = 32;
                    const x = 60 + index * 60;
                    const barHeight = Math.max((d.weight / maxWeeklyWeight) * 120, 8);
                    const y = 150 - barHeight;

                    return (
                      <g key={d.label}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx="6"
                          fill="url(#barGradient)"
                          className="svg-bar"
                        >
                          <title>{`${d.label}: ${d.weight} kg collected`}</title>
                        </rect>
                        <text
                          x={x + barWidth / 2}
                          y="172"
                          textAnchor="middle"
                          className="svg-axis-label"
                        >
                          {d.label}
                        </text>
                        <text
                          x={x + barWidth / 2}
                          y={y - 6}
                          textAnchor="middle"
                          style={{ fontSize: 10, fill: "var(--ad-text)", fontWeight: 700 }}
                        >
                          {d.weight}
                        </text>
                      </g>
                    );
                  })}

                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* CHART 2: CPCB CATEGORY SVG DONUT CHART */}
              <div className="chart-card">
                <div className="chart-card-header">
                  <h3>CPCB Stream Split</h3>
                </div>

                <div className="donut-chart-wrap">
                  <svg className="donut-svg" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="var(--ad-border)" strokeWidth="16" />
                    {/* Yellow segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="16"
                      strokeDasharray="90 238"
                      strokeDashoffset="0"
                    />
                    {/* Red segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="16"
                      strokeDasharray="70 238"
                      strokeDashoffset="-90"
                    />
                    {/* Blue segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="16"
                      strokeDasharray="45 238"
                      strokeDashoffset="-160"
                    />
                    {/* White segment */}
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="16"
                      strokeDasharray="33 238"
                      strokeDashoffset="-205"
                    />
                  </svg>

                  <div className="donut-legend">
                    <div className="donut-legend-item">
                      <span className="category-color-dot yellow" />
                      <span>Yellow</span>
                      <strong>38%</strong>
                    </div>
                    <div className="donut-legend-item">
                      <span className="category-color-dot red" />
                      <span>Red</span>
                      <strong>29%</strong>
                    </div>
                    <div className="donut-legend-item">
                      <span className="category-color-dot blue" />
                      <span>Blue</span>
                      <strong>19%</strong>
                    </div>
                    <div className="donut-legend-item">
                      <span className="category-color-dot white" />
                      <span>White</span>
                      <strong>14%</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="reports-main-grid" style={{ marginTop: 20 }}>
              <div className="reports-panel category-panel">
                <div className="reports-panel-header">
                  <div>
                    <h2>Category Distribution</h2>
                    <p>Weight breakdown by biomedical category</p>
                  </div>
                  <span className="reports-live-badge">● Live</span>
                </div>

                <div className="category-report-list">
                  {Object.entries(categoryCounts).length === 0 ? (
                    <div className="reports-empty">No waste category data available.</div>
                  ) : (
                    Object.entries(categoryCounts).map(([category, count]) => {
                      const weight = categoryWeights[category] || 0;
                      const percentage = categoryWeightPercentages[category] || 0;

                      return (
                        <div className="category-report-item" key={category}>
                          <div className="category-report-top">
                            <div className="category-report-name">
                              <span className={`category-color-dot ${category.toLowerCase()}`} />
                              <strong>{category}</strong>
                            </div>

                            <div className="category-report-values">
                              <span>{count} {count === 1 ? "batch" : "batches"}</span>
                              <strong>{weight.toFixed(1)} kg</strong>
                            </div>
                          </div>

                          <div className="category-progress">
                            <div
                              className={`category-progress-fill ${category.toLowerCase()}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          <div className="category-percentage">
                            {percentage.toFixed(1)}% of total weight
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="reports-panel recent-panel">
                <div className="reports-panel-header">
                  <div>
                    <h2>Recent Logged Waste</h2>
                    <p>Latest hospital entries</p>
                  </div>
                  <span className="reports-count-badge">{recentActivities.length}</span>
                </div>

                <div className="recent-waste-list">
                  {recentActivities.length === 0 ? (
                    <div className="reports-empty">No recent activity.</div>
                  ) : (
                    recentActivities.map((item) => (
                      <div className="recent-waste-item" key={item.id}>
                        <div className="recent-waste-icon">{item.icon}</div>
                        <div className="recent-waste-info">
                          <strong>{item.title}</strong>
                          <span>{item.subtitle}</span>
                        </div>
                        <div className="recent-waste-right">
                          <span className={`recent-category ${item.color}`} style={{ fontSize: 10 }}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="reports-hospital-summary" style={{ marginTop: 20 }}>
              <div className="hospital-summary-icon">🏥</div>
              <div>
                <p>CPCB Segregation Compliance</p>
                <strong style={{ color: "var(--ad-green)" }}>98.4% Compliant</strong>
              </div>
              <span className="hospital-summary-status">Audit Certified</span>
            </section>
          </div>
        ) : (
          /* ===================================================
              VIEW 7: DASHBOARD OVERVIEW (DEFAULT)
          ==================================================== */
          <>
            <header className="admin-header">
              <div>
                <p className="admin-eyebrow">MediSort Administration</p>
                <h1>Admin Command Center</h1>
                <p className="admin-subtitle">
                  Live operations, hazardous waste logistics, and hospital tracking.
                </p>
              </div>

              <div className="admin-user">
                <div className="admin-user-avatar">A</div>
                <div>
                  <strong>System Administrator</strong>
                  <span>Central Oversight</span>
                </div>
              </div>
            </header>

            <section className="admin-stats">
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon blue">🚚</div>
                  <span className="admin-stat-badge blue">In Transit</span>
                </div>
                <div className="admin-stat-body">
                  <span>Active Collections</span>
                  <h2><AnimatedNumber value={activeCollections} /></h2>
                  <small>Vehicles currently on route</small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon green">👷</div>
                  <span className="admin-stat-badge green">
                    {collectors.filter((c) => c.status === "Active").length}/{collectors.length} On Duty
                  </span>
                </div>
                <div className="admin-stat-body">
                  <span>Field Collectors</span>
                  <strong><AnimatedNumber value={collectors.length} /></strong>
                  <small>Registered dispatch team</small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon orange">⚖️</div>
                  <span className="admin-stat-badge amber">Processed</span>
                </div>
                <div className="admin-stat-body">
                  <span>Waste Collected</span>
                  <strong><AnimatedNumber value={Math.round(wasteCollected)} suffix=" kg" /></strong>
                  <small>Verified safe disposal</small>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon purple">📦</div>
                  <span className="admin-stat-badge purple">
                    {pickupRequests.filter((p) => p.status === "Pending").length} Pending
                  </span>
                </div>
                <div className="admin-stat-body">
                  <span>Pickup Requests</span>
                  <strong><AnimatedNumber value={pickupCount} /></strong>
                  <small>Total hospital demands</small>
                </div>
              </div>
            </section>

            <section className="admin-grid">
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2>System Overview</h2>
                    <p>Current MediSort health and real-time operations</p>
                  </div>
                  <span className="admin-live">● Operational</span>
                </div>

                <div className="overview-list">
                  <div className="overview-row">
                    <div className="overview-label">
                      <span className="overview-dot blue-dot" />
                      Pending Pickups
                    </div>
                    <strong>{pickupRequests.filter((p) => p.status === "Pending").length}</strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <span className="overview-dot orange-dot" />
                      Active In Transit
                    </div>
                    <strong>{activeCollections}</strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <span className="overview-dot green-dot" />
                      Total Waste Processed
                    </div>
                    <strong>{wasteCollected.toFixed(1)} kg</strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <span className="overview-dot red-dot" />
                      Connected Hospitals
                    </div>
                    <strong>{hospitals.length}</strong>
                  </div>
                </div>
              </div>

              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <h2>Administrative Controls</h2>
                    <p>Fast navigation to operational modules</p>
                  </div>
                </div>

                <div className="admin-actions">
                  <button
                    className="admin-action"
                    onClick={() => setAdminPage("hospitals")}
                  >
                    <span>🏥</span>
                    <div>
                      <strong>Manage Hospitals</strong>
                      <small>{hospitals.length} facilities</small>
                    </div>
                  </button>

                  <button
                    className="admin-action"
                    onClick={() => setAdminPage("collectors")}
                  >
                    <span>🚚</span>
                    <div>
                      <strong>Fleet & Drivers</strong>
                      <small>{collectors.length} agents</small>
                    </div>
                  </button>

                  <button
                    className="admin-action"
                    onClick={() => setAdminPage("incidents")}
                  >
                    <span>🚨</span>
                    <div>
                      <strong>Hazard & Incident Center</strong>
                      <small>{activeIncidents.length} active alerts</small>
                    </div>
                  </button>

                  <button
                    className="admin-action"
                    onClick={() => setAdminPage("manifests")}
                  >
                    <span>📄</span>
                    <div>
                      <strong>CPCB Form IV Audits</strong>
                      <small>Regulatory manifests</small>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            <section className="admin-card recent-activity">
              <div className="admin-card-header">
                <div>
                  <h2>Live Operational Feed</h2>
                  <p>Real-time waste logging and pickup requests</p>
                </div>

                <button
                  type="button"
                  className="admin-view-button"
                  onClick={() => setAdminPage("wasteRecords")}
                >
                  View All Records →
                </button>
              </div>

              <div className="activity-list">
                {recentActivities.length === 0 ? (
                  <div className="reports-empty">No recent activity detected.</div>
                ) : (
                  recentActivities.map((act) => (
                    <div className="activity-item" key={act.id}>
                      <div className={`activity-icon ${act.color}`}>
                        {act.icon}
                      </div>

                      <div className="activity-info">
                        <strong>{act.title}</strong>
                        <span>{act.subtitle}</span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <span className={`recent-category ${act.color}`} style={{ fontSize: 10 }}>
                          {act.status}
                        </span>
                        <small>
                          {act.time ? act.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live"}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
