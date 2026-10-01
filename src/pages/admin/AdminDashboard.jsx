import "./AdminDashboard.css";
import { useEffect, useState, useRef, useMemo } from "react";

import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
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
  // DASHBOARD DATA
  // =========================================================
  const [pickupCount, setPickupCount] = useState(0);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [wasteCollected, setWasteCollected] = useState(0);
  const [activeCollections, setActiveCollections] = useState(0);

  // =========================================================
  // ADMIN PAGE NAVIGATION
  // =========================================================
  const [adminPage, setAdminPage] = useState("dashboard");
  const [collectorSearch, setCollectorSearch] = useState("");
  const [showCollectorForm, setShowCollectorForm] = useState(false);
  const [collectors, setCollectors] = useState([]);
  const [wasteRecords, setWasteRecords] = useState([]);
  const [wasteSearch, setWasteSearch] = useState("");
  const [wasteCategoryFilter, setWasteCategoryFilter] = useState("All");

  // =========================================================
  // HOSPITAL DATA
  // =========================================================
  const [hospitals, setHospitals] = useState([]);
  const [hospitalSearch, setHospitalSearch] = useState("");

  // Add hospital form
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState("");
  const [hospitalContact, setHospitalContact] = useState("");
  const [hospitalStatus, setHospitalStatus] = useState("Active");

  // =========================================================
  // PICKUP REQUESTS - LIVE FIREBASE LISTENER
  // =========================================================
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "pickupRequests"),
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        setPickupRequests(data);
        setPickupCount(snapshot.size);
      },
      (error) => {
        console.error("Error loading pickup requests:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================================
  // WASTE BATCHES — LIVE FIREBASE LISTENER
  // =========================================================
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "wasteBatches"),
      (snapshot) => {
        let total = 0;
        let activeCount = 0;

        snapshot.forEach((document) => {
          const waste = document.data();

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
      (error) => {
        console.error("Error loading waste batches:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================================
  // HOSPITALS - LIVE FIREBASE LISTENER
  // =========================================================
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "hospitals"),
      (snapshot) => {
        const hospitalData = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        setHospitals(hospitalData);
      },
      (error) => {
        console.error("Error loading hospitals:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================================
  // COLLECTORS - LIVE FIREBASE LISTENER
  // =========================================================
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "collectors"),
      (snapshot) => {
        const collectorData = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        setCollectors(collectorData);
      },
      (error) => {
        console.error("Error loading collectors:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================================
  // WASTE RECORDS - LIVE FIREBASE LISTENER
  // =========================================================
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "wasteRecords"),
      (snapshot) => {
        const wasteData = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));
        setWasteRecords(wasteData);
      },
      (error) => {
        console.error("Error loading waste records:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================================
  // ADD COLLECTOR
  // =========================================================
  const handleAddCollector = async (e) => {
    e.preventDefault();

    const form = e.target;
    const collectorName = form.collectorName.value.trim();
    const contactNumber = form.contactNumber.value.trim();
    const assignedArea = form.assignedArea.value.trim();
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

  // =========================================================
  // ADD HOSPITAL
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

  // =========================================================
  // DELETE COLLECTOR
  // =========================================================
  const handleDeleteCollector = async (collectorId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this collector?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "collectors", collectorId));
      alert("✅ Collector deleted successfully!");
    } catch (error) {
      console.error("Error deleting collector:", error);
      alert("❌ Failed to delete collector.");
    }
  };

  // =========================================================
  // DELETE HOSPITAL
  // =========================================================
  const handleDeleteHospital = async (hospitalId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this hospital?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "hospitals", hospitalId));
      alert("Hospital deleted successfully.");
    } catch (error) {
      console.error("Error deleting hospital:", error);
      alert("Failed to delete hospital.");
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

    const headers = [
      "Record ID",
      "Hospital",
      "Waste Type",
      "Category",
      "Weight (kg)",
      "Recorded Date",
    ];

    const rows = wasteRecords.map((r) => {
      const dateStr = r.createdAt?.toDate
        ? r.createdAt.toDate().toLocaleDateString()
        : "—";
      return [
        `"${r.id || ""}"`,
        `"${r.hospital || "Unknown Hospital"}"`,
        `"${r.wasteType || "Biomedical"}"`,
        `"${r.category || "Mixed"}"`,
        r.weight || 0,
        `"${dateStr}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `medisort_waste_records_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================
  // FILTERED LISTS & COMPUTATIONS
  // =========================================================
  const filteredHospitals = hospitals.filter((hospital) =>
    hospital.name?.toLowerCase().includes(hospitalSearch.toLowerCase())
  );

  const filteredCollectors = collectors.filter((collector) =>
    collector.name?.toLowerCase().includes(collectorSearch.toLowerCase())
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

  const categoryCounts = wasteRecords.reduce((counts, record) => {
    const category = record.category;
    if (category) {
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, {});

  const categoryWeights = wasteRecords.reduce((weights, record) => {
    const category = record.category;
    const weight = Number(record.weight) || 0;
    if (category) {
      weights[category] = (weights[category] || 0) + weight;
    }
    return weights;
  }, {});

  const categoryWeightPercentages = Object.entries(categoryWeights).reduce(
    (percentages, [category, weight]) => {
      percentages[category] =
        totalWasteWeight > 0 ? (weight / totalWasteWeight) * 100 : 0;
      return percentages;
    },
    {}
  );

  // Real Combined Live System Activities
  const recentActivities = useMemo(() => {
    const items = [];

    // From pickup requests
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

    // From waste records
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

    // Sort newest first
    return items
      .sort((a, b) => (b.time?.getTime() || 0) - (a.time?.getTime() || 0))
      .slice(0, 5);
  }, [pickupRequests, wasteRecords]);

  const activeCollectorsCount = collectors.filter(
    (c) => c.status === "Active"
  ).length;

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
        {/* LOGO */}
        <div className="admin-logo">
          <div className="admin-logo-icon">♻</div>
          <div>
            <h2>MediSort</h2>
            <span>Admin Control</span>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="admin-nav">
          {/* DASHBOARD */}
          <button
            className={`admin-nav-item ${
              adminPage === "dashboard" ? "active" : ""
            }`}
            onClick={() => {
              setAdminPage("dashboard");
              setMobileMenuOpen(false);
            }}
          >
            <span>📊</span>
            <span>Dashboard</span>
          </button>

          {/* HOSPITALS */}
          <button
            className={`admin-nav-item ${
              adminPage === "hospitals" ? "active" : ""
            }`}
            onClick={() => {
              setAdminPage("hospitals");
              setMobileMenuOpen(false);
            }}
          >
            <span>🏥</span>
            <span>Hospitals</span>
            <span className="admin-nav-badge">{hospitals.length}</span>
          </button>

          {/* COLLECTORS */}
          <button
            className={`admin-nav-item ${
              adminPage === "collectors" ? "active" : ""
            }`}
            onClick={() => {
              setAdminPage("collectors");
              setMobileMenuOpen(false);
            }}
          >
            <span>🚚</span>
            <span>Collectors</span>
            <span className="admin-nav-badge">{collectors.length}</span>
          </button>

          {/* WASTE RECORDS */}
          <button
            className={`admin-nav-item ${
              adminPage === "wasteRecords" ? "active" : ""
            }`}
            onClick={() => {
              setAdminPage("wasteRecords");
              setMobileMenuOpen(false);
            }}
          >
            <span>♻️</span>
            <span>Waste Records</span>
            <span className="admin-nav-badge">{wasteRecords.length}</span>
          </button>

          {/* REPORTS */}
          <button
            className={`admin-nav-item ${
              adminPage === "reports" ? "active" : ""
            }`}
            onClick={() => {
              setAdminPage("reports");
              setMobileMenuOpen(false);
            }}
          >
            <span>📈</span>
            <span>Reports</span>
          </button>
        </nav>

        {/* SIDEBAR BOTTOM */}
        <div className="admin-sidebar-bottom">
          {/* THEME TOGGLE */}
          <button
            type="button"
            className="admin-theme-btn"
            onClick={toggleTheme}
            title="Toggle theme mode"
          >
            <span>{darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Switch</span>
          </button>

          {/* HOSPITAL FRONT PAGE */}
          <button className="admin-nav-item" onClick={onBackToHome}>
            <span>🏠</span>
            <span>Hospital Front Page</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <main className="admin-main">
        {/* ===================================================
            HOSPITALS PAGE
        ==================================================== */}
        {adminPage === "hospitals" ? (
          <div className="hospital-management-page">
            <header className="hospital-page-header">
              <div>
                <p className="admin-eyebrow">MediSort Administration</p>
                <h1>Hospitals</h1>
                <p>Manage registered hospitals and facility profiles.</p>
              </div>

              <button
                className="add-hospital-btn"
                onClick={() => setShowHospitalForm(true)}
              >
                + Add Hospital
              </button>
            </header>

            {/* SEARCH */}
            <div className="hospital-search-box">
              <input
                type="text"
                placeholder="Search hospitals by name or location..."
                value={hospitalSearch}
                onChange={(e) => setHospitalSearch(e.target.value)}
              />
            </div>

            {/* HOSPITAL LIST */}
            <div className="hospital-list-card">
              <div className="hospital-list-header">
                <div>
                  <h2>Registered Facilities</h2>
                  <p>Hospitals connected to the MediSort network</p>
                </div>

                <span>
                  {filteredHospitals.length}{" "}
                  {filteredHospitals.length === 1 ? "Hospital" : "Hospitals"}
                </span>
              </div>

              {/* EMPTY STATE */}
              {filteredHospitals.length === 0 ? (
                <div className="empty-hospitals">
                  <div className="empty-hospital-icon">🏥</div>
                  <h3>No hospitals found</h3>
                  <p>Add a hospital to get started.</p>
                </div>
              ) : (
                <div className="hospital-table">
                  <div className="hospital-table-row hospital-table-heading">
                    <span>Hospital Name</span>
                    <span>Location</span>
                    <span>Contact</span>
                    <span>Status</span>
                    <span>Action</span>
                  </div>

                  {filteredHospitals.map((hospital) => (
                    <div className="hospital-table-row" key={hospital.id}>
                      <span>
                        <strong>{hospital.name}</strong>
                      </span>

                      <span>{hospital.location}</span>

                      <span>{hospital.contact || "—"}</span>

                      <span>
                        <span
                          className={`hospital-status ${
                            hospital.status === "Inactive" ? "inactive" : ""
                          }`}
                        >
                          {hospital.status || "Active"}
                        </span>
                      </span>

                      <span>
                        <button
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
              <div className="hospital-modal-overlay">
                <div className="hospital-modal">
                  <div className="hospital-modal-header">
                    <div>
                      <h2>Add Hospital</h2>
                      <p>Register a new hospital in MediSort.</p>
                    </div>

                    <button
                      className="hospital-modal-close"
                      onClick={() => setShowHospitalForm(false)}
                    >
                      ×
                    </button>
                  </div>

                  <form onSubmit={handleAddHospital} className="hospital-form">
                    <div className="hospital-form-group">
                      <label>Hospital Name</label>
                      <input
                        type="text"
                        placeholder="Enter hospital name (e.g. AIIMS Ward 3)"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="hospital-form-group">
                      <label>Location / City</label>
                      <input
                        type="text"
                        placeholder="Enter location or area"
                        value={hospitalLocation}
                        onChange={(e) => setHospitalLocation(e.target.value)}
                        required
                      />
                    </div>

                    <div className="hospital-form-group">
                      <label>Contact Number</label>
                      <input
                        type="text"
                        placeholder="Enter phone or emergency contact"
                        value={hospitalContact}
                        onChange={(e) => setHospitalContact(e.target.value)}
                      />
                    </div>

                    <div className="hospital-form-group">
                      <label>Status</label>
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
                        Add Hospital
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : adminPage === "collectors" ? (
          /* ===================================================
              COLLECTORS PAGE
          ==================================================== */
          <div className="collector-management-page">
            <header className="collector-page-header">
              <div>
                <p className="admin-eyebrow">MediSort Administration</p>
                <h1>Collectors</h1>
                <p>Manage collection agents and corridor dispatch.</p>
              </div>

              <button
                className="add-collector-btn"
                onClick={() => setShowCollectorForm(true)}
              >
                + Add Collector
              </button>
            </header>

            {/* ADD COLLECTOR FORM */}
            {showCollectorForm && (
              <div className="collector-form-card">
                <div className="collector-form-header">
                  <div>
                    <h2>Add New Collector</h2>
                    <p>Register a certified hazardous waste collection driver.</p>
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
                      <label>Collector Name</label>
                      <input
                        type="text"
                        name="collectorName"
                        placeholder="Enter collector full name"
                        required
                      />
                    </div>

                    <div className="collector-form-group">
                      <label>Contact Number</label>
                      <input
                        type="text"
                        name="contactNumber"
                        placeholder="Enter 10-digit mobile number"
                        required
                      />
                    </div>

                    <div className="collector-form-group">
                      <label>Assigned Area / Corridor</label>
                      <input
                        type="text"
                        name="assignedArea"
                        placeholder="e.g. Bhubaneswar Central, Cuttack Zone"
                        required
                      />
                    </div>

                    <div className="collector-form-group">
                      <label>Status</label>
                      <select name="status" defaultValue="Active">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
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
                      Save Collector
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="collector-search-box">
              <input
                type="text"
                placeholder="Search collectors by name or assigned area..."
                value={collectorSearch}
                onChange={(e) => setCollectorSearch(e.target.value)}
              />
            </div>

            <div className="collector-list-card">
              <div className="collector-list-header">
                <div>
                  <h2>Active Staff</h2>
                  <p>Certified collection partners in service</p>
                </div>

                <span>
                  {filteredCollectors.length}{" "}
                  {filteredCollectors.length === 1 ? "Collector" : "Collectors"}
                </span>
              </div>

              {filteredCollectors.length === 0 ? (
                <div className="empty-collectors">
                  <div className="empty-collector-icon">🚚</div>
                  <h3>No collectors found</h3>
                  <p>Add a collector to begin managing field dispatch.</p>
                </div>
              ) : (
                <div className="collector-table">
                  {filteredCollectors.map((collector) => (
                    <div className="collector-row" key={collector.id}>
                      <div className="collector-info">
                        <div className="collector-avatar">
                          {collector.name?.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <h3>{collector.name}</h3>
                          <p>{collector.contact}</p>
                        </div>
                      </div>

                      <div className="collector-area">
                        <span>Assigned Area</span>
                        <strong>{collector.assignedArea}</strong>
                      </div>

                      <div className="collector-status">
                        <span
                          className={
                            collector.status === "Active"
                              ? "status-active"
                              : "status-inactive"
                          }
                        >
                          {collector.status}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="delete-collector-btn"
                        onClick={() => handleDeleteCollector(collector.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : adminPage === "wasteRecords" ? (
          /* ===================================================
              WASTE RECORDS PAGE
          ==================================================== */
          <div className="waste-records-page">
            <header className="waste-records-header">
              <div>
                <p className="admin-eyebrow">MediSort Administration</p>
                <h1>Waste Records</h1>
                <p>Complete CPCB Bio-Medical waste audit trail.</p>
              </div>

              <button
                type="button"
                className="admin-export-btn"
                onClick={exportWasteCSV}
                title="Export all waste records as CSV"
              >
                📥 Export CSV
              </button>
            </header>

            <div className="waste-summary-grid">
              <div className="waste-summary-card">
                <span>📋</span>
                <div>
                  <p>Total Records</p>
                  <strong>
                    <AnimatedNumber value={wasteRecords.length} />
                  </strong>
                </div>
              </div>

              <div className="waste-summary-card">
                <span>⚖️</span>
                <div>
                  <p>Total Weight</p>
                  <strong>
                    <AnimatedNumber value={Math.round(totalWasteWeight)} suffix=" kg" />
                  </strong>
                </div>
              </div>

              <div className="waste-summary-card">
                <span>♻️</span>
                <div>
                  <p>Active Categories</p>
                  <strong>{wasteCategories}</strong>
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

              {/* Category Filter Pills */}
              <div className="waste-cat-pills">
                {["All", "Yellow", "Red", "Blue", "White"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`waste-cat-pill ${
                      wasteCategoryFilter === cat ? "active" : ""
                    }`}
                    onClick={() => setWasteCategoryFilter(cat)}
                  >
                    {cat === "Yellow"
                      ? "🟡 Yellow"
                      : cat === "Red"
                      ? "🔴 Red"
                      : cat === "Blue"
                      ? "🔵 Blue"
                      : cat === "White"
                      ? "⚪ White"
                      : "All Categories"}
                  </button>
                ))}
              </div>
            </div>

            <div className="waste-records-card">
              <div className="waste-records-card-header">
                <div>
                  <h2>Logged Waste Batches</h2>
                  <p>Real-time records from hospital facilities</p>
                </div>

                <span>
                  {filteredWasteRecords.length}{" "}
                  {filteredWasteRecords.length === 1 ? "Record" : "Records"}
                </span>
              </div>

              {filteredWasteRecords.length === 0 ? (
                <div className="waste-records-empty">
                  <div className="waste-records-icon">♻️</div>
                  <h3>No waste records found</h3>
                  <p>Recorded medical waste will appear here automatically.</p>
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
                        <strong
                          className={`recent-category ${(
                            record.category || ""
                          ).toLowerCase()}`}
                        >
                          {record.category || "Mixed"}
                        </strong>
                      </div>

                      <div className="waste-record-weight">
                        <span>Weight</span>
                        <strong>{record.weight || 0} kg</strong>
                      </div>

                      <div className="waste-record-date">
                        <span>Recorded</span>
                        <strong>
                          {record.createdAt?.toDate
                            ? record.createdAt.toDate().toLocaleDateString()
                            : "—"}
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : adminPage === "reports" ? (
          /* ===================================================
              REPORTS & ANALYTICS PAGE
          ==================================================== */
          <div className="reports-page">
            <header className="reports-header">
              <div>
                <p className="admin-eyebrow">MEDISORT ADMINISTRATION</p>
                <h1>Reports & Analytics</h1>
                <p className="reports-subtitle">
                  CPCB compliance statistics, category distribution, and weight trends.
                </p>
              </div>

              <button
                type="button"
                className="admin-export-btn"
                onClick={exportWasteCSV}
              >
                📥 Export Full Report
              </button>
            </header>

            <section className="reports-summary-grid">
              <div className="reports-summary-card">
                <div className="reports-summary-icon">📋</div>
                <div>
                  <p>Total Records</p>
                  <strong>
                    <AnimatedNumber value={wasteRecords.length} />
                  </strong>
                </div>
              </div>

              <div className="reports-summary-card">
                <div className="reports-summary-icon">⚖️</div>
                <div>
                  <p>Total Weight Processed</p>
                  <strong>
                    <AnimatedNumber
                      value={Math.round(totalWasteWeight)}
                      suffix=" kg"
                    />
                  </strong>
                </div>
              </div>

              <div className="reports-summary-card">
                <div className="reports-summary-icon">🏥</div>
                <div>
                  <p>Reporting Hospitals</p>
                  <strong>
                    <AnimatedNumber value={reportingHospitals} />
                  </strong>
                </div>
              </div>
            </section>

            <section className="reports-main-grid">
              {/* CATEGORY ANALYTICS */}
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
                    <div className="reports-empty">
                      No waste category data available.
                    </div>
                  ) : (
                    Object.entries(categoryCounts).map(([category, count]) => {
                      const weight = categoryWeights[category] || 0;
                      const percentage =
                        categoryWeightPercentages[category] || 0;

                      return (
                        <div className="category-report-item" key={category}>
                          <div className="category-report-top">
                            <div className="category-report-name">
                              <span
                                className={`category-color-dot ${category.toLowerCase()}`}
                              ></span>
                              <strong>{category}</strong>
                            </div>

                            <div className="category-report-values">
                              <span>
                                {count} {count === 1 ? "record" : "records"}
                              </span>
                              <strong>{weight.toFixed(1)} kg</strong>
                            </div>
                          </div>

                          <div className="category-progress">
                            <div
                              className={`category-progress-fill ${category.toLowerCase()}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
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

              {/* RECENT WASTE ACTIVITY */}
              <div className="reports-panel recent-panel">
                <div className="reports-panel-header">
                  <div>
                    <h2>Recent Logged Waste</h2>
                    <p>Latest hospital entries</p>
                  </div>

                  <span className="reports-count-badge">
                    {recentActivities.length}
                  </span>
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
                          <span
                            className={`recent-category ${item.color}`}
                            style={{ fontSize: 10 }}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="reports-hospital-summary">
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
              DASHBOARD OVERVIEW (DEFAULT)
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

            {/* KPI STAT CARDS */}
            <section className="admin-stats">
              {/* ACTIVE COLLECTIONS */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon blue">🚚</div>
                  <span className="admin-stat-badge blue">In Transit</span>
                </div>
                <div className="admin-stat-body">
                  <span>Active Collections</span>
                  <h2>
                    <AnimatedNumber value={activeCollections} />
                  </h2>
                  <small>Vehicles currently on route</small>
                </div>
              </div>

              {/* ACTIVE COLLECTORS */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon green">👷</div>
                  <span className="admin-stat-badge green">
                    {activeCollectorsCount}/{collectors.length} On Duty
                  </span>
                </div>
                <div className="admin-stat-body">
                  <span>Field Collectors</span>
                  <strong>
                    <AnimatedNumber value={collectors.length} />
                  </strong>
                  <small>Registered dispatch team</small>
                </div>
              </div>

              {/* WASTE COLLECTED */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon orange">⚖️</div>
                  <span className="admin-stat-badge amber">Processed</span>
                </div>
                <div className="admin-stat-body">
                  <span>Waste Collected</span>
                  <strong>
                    <AnimatedNumber
                      value={Math.round(wasteCollected)}
                      suffix=" kg"
                    />
                  </strong>
                  <small>Verified safe disposal</small>
                </div>
              </div>

              {/* PICKUP REQUESTS */}
              <div className="admin-stat-card">
                <div className="admin-stat-top">
                  <div className="admin-stat-icon purple">📦</div>
                  <span className="admin-stat-badge purple">
                    {pickupRequests.filter((p) => p.status === "Pending").length} Pending
                  </span>
                </div>
                <div className="admin-stat-body">
                  <span>Pickup Requests</span>
                  <strong>
                    <AnimatedNumber value={pickupCount} />
                  </strong>
                  <small>Total hospital demands</small>
                </div>
              </div>
            </section>

            {/* 2-COLUMN GRID */}
            <section className="admin-grid">
              {/* SYSTEM OVERVIEW */}
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
                      <span className="overview-dot blue-dot"></span>
                      Pending Pickups
                    </div>
                    <strong>
                      {pickupRequests.filter((p) => p.status === "Pending").length}
                    </strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <span className="overview-dot orange-dot"></span>
                      Active In Transit
                    </div>
                    <strong>{activeCollections}</strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <span className="overview-dot green-dot"></span>
                      Total Waste Processed
                    </div>
                    <strong>{wasteCollected.toFixed(1)} kg</strong>
                  </div>

                  <div className="overview-row">
                    <div className="overview-label">
                      <span className="overview-dot red-dot"></span>
                      Connected Hospitals
                    </div>
                    <strong>{hospitals.length}</strong>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS */}
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
                      <strong>Manage Collectors</strong>
                      <small>{collectors.length} agents</small>
                    </div>
                  </button>

                  <button
                    className="admin-action"
                    onClick={() => setAdminPage("wasteRecords")}
                  >
                    <span>♻️</span>
                    <div>
                      <strong>Waste Audit Records</strong>
                      <small>{wasteRecords.length} entries</small>
                    </div>
                  </button>

                  <button
                    className="admin-action"
                    onClick={() => setAdminPage("reports")}
                  >
                    <span>📈</span>
                    <div>
                      <strong>Analytics & Reports</strong>
                      <small>CPCB Compliance</small>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            {/* LIVE ACTIVITY FEED */}
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
                        <span
                          className={`recent-category ${act.color}`}
                          style={{ fontSize: 10 }}
                        >
                          {act.status}
                        </span>
                        <small>
                          {act.time ? act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live"}
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
