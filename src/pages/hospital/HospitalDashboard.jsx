import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import AddWaste from "./AddWaste";
import "../../App.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOSPITAL_NAME = "AAROGYA Hospital";
const QR_BASE_URL = "https://medisort.app/batch";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeHospital(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/hospital$/, "");
}

function isThisHospital(record) {
  return normalizeHospital(record?.hospital) === "aarogya";
}

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRecordDate(record) {
  return asDate(
    record.createdAt || record.requestedAt || record.date || record.timestamp
  );
}

function formatDate(value) {
  const date = asDate(value);
  return date
    ? date.toLocaleString([], {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

function formatWeight(value) {
  const weight = Number(value);
  return `${
    Number.isFinite(weight)
      ? weight.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "0"
  } kg`;
}

// ─── Toast Notification (replaces native alert()) ─────────────────────────────

function Toast({ notification, onDismiss }) {
  if (!notification) return null;

  const colors = {
    success: "#166534",
    error: "#991b1b",
    warning: "#92400e",
    info: "#1e40af",
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 360,
        padding: "12px 16px",
        borderRadius: 8,
        background: "#fff",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        borderLeft: `4px solid ${colors[notification.type] ?? colors.info}`,
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>
          {notification.title}
        </p>
        {notification.detail && (
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#555" }}>
            {notification.detail}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
          color: "#888",
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function HospitalDashboard() {
  const [page, setPage] = useState("dashboard");
  const [wasteRecords, setWasteRecords] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [wasteBatches, setWasteBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [qrValue, setQrValue] = useState(`${QR_BASE_URL}/AAROGYA-001`);
  const [requestingPickup, setRequestingPickup] = useState(false);

  // Bug fix: Replace all native alert() calls with a non-blocking toast
  const [notification, setNotification] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((type, title, detail = "") => {
    clearTimeout(toastTimerRef.current);
    setNotification({ type, title, detail });
    toastTimerRef.current = setTimeout(() => setNotification(null), 4000);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimerRef.current);
    setNotification(null);
  }, []);

  // Bug fix: Use useRef for the settled counter to avoid stale-closure bugs
  // when multiple Firestore listeners resolve in quick succession
  const settledRef = useRef(0);

  useEffect(() => {
    settledRef.current = 0;

    const markSettled = () => {
      settledRef.current += 1;
      if (settledRef.current >= 3) setLoading(false);
    };

    const handleError = (error) => {
      console.error("Hospital dashboard data error:", error);
      setDataError(
        "Some dashboard data could not be loaded. Check your Firebase access and try again."
      );
      markSettled();
    };

    const unsubs = [
      onSnapshot(
        query(collection(db, "wasteRecords"), orderBy("createdAt", "desc")),
        (snapshot) => {
          setWasteRecords(
            snapshot.docs
              .map((item) => ({ id: item.id, ...item.data() }))
              .filter(isThisHospital)
          );
          markSettled();
        },
        handleError
      ),
      onSnapshot(
        query(collection(db, "pickupRequests"), orderBy("requestedAt", "desc")),
        (snapshot) => {
          setPickupRequests(
            snapshot.docs
              .map((item) => ({ id: item.id, ...item.data() }))
              .filter(isThisHospital)
          );
          markSettled();
        },
        handleError
      ),
      onSnapshot(
        query(collection(db, "wasteBatches"), orderBy("createdAt", "desc")),
        (snapshot) => {
          setWasteBatches(
            snapshot.docs
              .map((item) => ({ id: item.id, ...item.data() }))
              .filter(isThisHospital)
          );
          markSettled();
        },
        handleError
      ),
    ];

    return () => {
      unsubs.forEach((unsubscribe) => unsubscribe());
      // Clean up toast timer on unmount
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Bug fix: Memoize date boundaries so they don't recreate a new object on
  // every render and needlessly invalidate downstream useMemo dependencies
  const todayStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const monthStart = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ─── Derived data ────────────────────────────────────────────────────────

  const todayWaste = useMemo(
    () =>
      wasteRecords
        .filter((record) => getRecordDate(record) >= todayStart)
        .reduce((total, record) => total + (Number(record.weight) || 0), 0),
    [wasteRecords, todayStart]
  );

  const pendingRequests = useMemo(
    () =>
      pickupRequests.filter((request) =>
        ["pending", "in transit"].includes(
          String(request.status || "").toLowerCase()
        )
      ),
    [pickupRequests]
  );

  const collectedThisMonth = useMemo(
    () =>
      wasteBatches
        .filter(
          (batch) =>
            String(batch.status || "").toLowerCase() === "collected" &&
            getRecordDate(batch) >= monthStart
        )
        .reduce((total, batch) => total + (Number(batch.weight) || 0), 0),
    [wasteBatches, monthStart]
  );

  const recentWaste = useMemo(
    () =>
      [...wasteRecords]
        .sort(
          (a, b) =>
            (getRecordDate(b)?.getTime() || 0) -
            (getRecordDate(a)?.getTime() || 0)
        )
        .slice(0, 5),
    [wasteRecords]
  );

  const weeklyWaste = useMemo(
    () => wasteRecords.filter((record) => getRecordDate(record) >= weekStart),
    [wasteRecords, weekStart]
  );

  const weeklyTotal = useMemo(
    () =>
      weeklyWaste.reduce(
        (total, record) => total + (Number(record.weight) || 0),
        0
      ),
    [weeklyWaste]
  );

  const distribution = useMemo(() => {
    const groups = [
      { key: "YELLOW", label: "Infectious",  className: "yellow-dot" },
      { key: "RED",    label: "Contaminated", className: "red-dot"   },
      { key: "WHITE",  label: "Sharps",       className: "white-dot" },
      { key: "BLUE",   label: "Glass",        className: "blue-dot"  },
      { key: "OTHER",  label: "Other",        className: "black-dot" },
    ];
    const totals = Object.fromEntries(groups.map((g) => [g.key, 0]));
    weeklyWaste.forEach((record) => {
      const category = String(record.category || "").toUpperCase();
      const key = Object.hasOwn(totals, category) ? category : "OTHER";
      totals[key] += Number(record.weight) || 0;
    });
    return groups.map((group) => ({
      ...group,
      weight: totals[group.key],
      percent: weeklyTotal
        ? Math.round((totals[group.key] / weeklyTotal) * 100)
        : 0,
    }));
  }, [weeklyWaste, weeklyTotal]);

  const sortedPickups = useMemo(
    () =>
      [...pickupRequests].sort(
        (a, b) =>
          (getRecordDate(b)?.getTime() || 0) -
          (getRecordDate(a)?.getTime() || 0)
      ),
    [pickupRequests]
  );

  const alerts = useMemo(() => {
    const rows = [];

    sortedPickups
      .filter(
        (request) =>
          String(request.status || "").toLowerCase() === "pending"
      )
      .slice(0, 2)
      .forEach((request) => {
        rows.push({
          type: "warning",
          icon: "⚠",
          title: "Pickup awaiting collection",
          detail: formatDate(request.requestedAt),
        });
      });

    const yellowKg =
      distribution.find((g) => g.key === "YELLOW")?.weight || 0;
    if (weeklyTotal > 0 && yellowKg / weeklyTotal >= 0.5) {
      rows.push({
        type: "overdue",
        icon: "!",
        title: "High infectious waste",
        detail: `${formatWeight(yellowKg)} this week`,
      });
    }

    // Bug fix: Don't assume wasteBatches[0] is the newest after client-side
    // filtering; find the actual newest batch by comparing dates
    const latestBatch =
      wasteBatches.length > 0
        ? wasteBatches.reduce((newest, batch) => {
            const batchDate  = getRecordDate(batch)?.getTime()  || 0;
            const newestDate = getRecordDate(newest)?.getTime() || 0;
            return batchDate > newestDate ? batch : newest;
          })
        : null;

    if (latestBatch) {
      rows.push({
        type: "info",
        icon: "i",
        title: "Waste batch updated",
        detail: formatDate(latestBatch.createdAt),
      });
    }

    return rows.slice(0, 3);
  }, [sortedPickups, distribution, weeklyTotal, wasteBatches]);

  // Bug fix: React-controlled search state instead of window.__medisortSearch
  // DOM mutation which is an anti-pattern and can break on re-render
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecentWaste = useMemo(() => {
    if (!searchTerm.trim()) return recentWaste;
    const term = searchTerm.toLowerCase();
    return recentWaste.filter((item) =>
      [item.id, item.wasteType, item.category, item.status]
        .map((v) => String(v || "").toLowerCase())
        .some((v) => v.includes(term))
    );
  }, [recentWaste, searchTerm]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleGenerateQR = async () => {
    try {
      const latestWaste = [...wasteRecords].sort(
        (a, b) =>
          (getRecordDate(b)?.getTime() || 0) -
          (getRecordDate(a)?.getTime() || 0)
      )[0];

      if (!latestWaste) {
        showToast(
          "warning",
          "No waste record found",
          "Please add and save a waste record for AAROGYA Hospital before generating QR."
        );
        return;
      }

      const newId = `MEDISORT-WASTE-${Date.now()}`;

      await addDoc(collection(db, "wasteBatches"), {
        qrId: newId,
        hospital: HOSPITAL_NAME,
        wasteType: latestWaste.wasteType || "Biomedical Waste",
        category: latestWaste.category || "Mixed",
        weight: Number(latestWaste.weight) || 0,
        wasteRecordId: latestWaste.id,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      // Bug fix: Store a full scannable URL, not just a bare ID string
      setQrValue(`${QR_BASE_URL}/${newId}`);

      showToast(
        "success",
        "QR code generated!",
        `${latestWaste.wasteType || "Biomedical Waste"} · ${
          latestWaste.category || "Mixed"
        } · ${formatWeight(latestWaste.weight)}`
      );
    } catch (error) {
      console.error("QR generation error:", error);
      showToast("error", "Failed to generate QR code", error.message);
    }
  };

  const handleRequestPickup = async () => {
    if (requestingPickup) return;

    const activeRequest = pickupRequests.find((request) =>
      ["pending", "in transit"].includes(
        String(request.status || "").toLowerCase()
      )
    );

    if (activeRequest) {
      showToast(
        "warning",
        "Active request exists",
        `A pickup request is already ${String(
          activeRequest.status
        ).toLowerCase()}.`
      );
      return;
    }

    setRequestingPickup(true);
    try {
      // Bug fix: Sum actual pending waste weight instead of hard-coding 0
      const totalPendingWeight = wasteRecords
        .filter(
          (r) =>
            !["collected", "completed"].includes(
              String(r.status || "").toLowerCase()
            )
        )
        .reduce((sum, r) => sum + (Number(r.weight) || 0), 0);

      await addDoc(collection(db, "pickupRequests"), {
        hospital: HOSPITAL_NAME,
        wasteType: "Biomedical Waste",
        weight: totalPendingWeight,
        category: "Mixed",
        status: "Pending",
        requestedAt: serverTimestamp(),
      });

      showToast("success", "Pickup request sent successfully!");
    } catch (error) {
      console.error("Pickup request error:", error);
      showToast("error", "Failed to send pickup request", error.message);
    } finally {
      setRequestingPickup(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (page === "addWaste") return <AddWaste onBack={() => setPage("dashboard")} />;

  const categoryClass = (category) =>
    `ms-category ms-${String(category || "other").toLowerCase()}`;

  return (
    <div className="ms-dashboard">
      {/* Toast replaces all native alert() calls */}
      <Toast notification={notification} onDismiss={dismissToast} />

      <aside className="ms-sidebar">
        <div className="ms-brand">
          <div className="ms-brand-icon">+</div>
          <div>
            <h2>MediSort</h2>
            <span>Smart Medical Waste</span>
          </div>
        </div>

        <nav className="ms-navigation">
          <button
            className={`ms-nav-item ${page === "dashboard" ? "active" : ""}`}
            onClick={() => setPage("dashboard")}
          >
            <span className="ms-nav-icon">⌂</span>Dashboard
          </button>
          <button
            className="ms-nav-item"
            onClick={() => setPage("addWaste")}
          >
            <span className="ms-nav-icon">＋</span>Add Waste
          </button>
          <button
            className="ms-nav-item"
            onClick={handleRequestPickup}
            disabled={requestingPickup}
          >
            <span className="ms-nav-icon">🚚</span>
            {requestingPickup ? "Requesting…" : "Request Pickup"}
          </button>
          <button
            className="ms-nav-item"
            onClick={() =>
              document
                .querySelector(".ms-records-card")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className="ms-nav-icon">▣</span>Waste Records
          </button>
          <button
            className="ms-nav-item"
            onClick={() =>
              document
                .querySelector(".ms-distribution-card")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span className="ms-nav-icon">▥</span>Reports &amp; Analytics
          </button>
          <button
            className="ms-nav-item"
            onClick={() =>
              showToast(
                "info",
                "Guidelines",
                "Follow your facility's biomedical waste segregation guidelines."
              )
            }
          >
            <span className="ms-nav-icon">▤</span>Guidelines
          </button>
          <button
            className="ms-nav-item"
            onClick={() =>
              showToast("info", "Hospital Profile", "AAROGYA Hospital")
            }
          >
            <span className="ms-nav-icon">♙</span>Profile
          </button>
          <button
            className="ms-nav-item"
            onClick={() =>
              showToast(
                "info",
                "Settings",
                "Settings are managed by your administrator."
              )
            }
          >
            <span className="ms-nav-icon">⚙</span>Settings
          </button>
        </nav>

        <div className="ms-sidebar-footer">
          <div className="ms-leaf">🌿</div>
          <div>
            <strong>A Cleaner</strong>
            <strong>Healthier</strong>
            <strong>Tomorrow</strong>
          </div>
          <small>MediSort v1.0</small>
        </div>
      </aside>

      <main className="ms-main">
        <header className="ms-topbar">
          <button className="ms-menu-button" aria-label="Menu">
            ☰
          </button>

          {/* React-controlled search — no window mutation */}
          <div className="ms-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search waste records, pickups, reports…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="ms-user-area">
            <button
              className="ms-notification"
              onClick={() =>
                document
                  .querySelector(".ms-alert-card")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              🔔<span>{alerts.length}</span>
            </button>
            <div className="ms-avatar">AH</div>
            <div className="ms-user-info">
              <strong>AAROGYA Hospital</strong>
              <span>Hospital User</span>
            </div>
            <span className="ms-chevron">⌄</span>
          </div>
        </header>

        <div className="ms-content">
          {dataError && <div role="alert">{dataError}</div>}

          <section className="ms-welcome">
            <div className="ms-welcome-text">
              <span className="ms-welcome-small">Welcome Back!</span>
              <h1>🏥 AAROGYA Hospital</h1>
              <p>Your actions make a cleaner, safer and healthier tomorrow.</p>
            </div>
            <div className="ms-welcome-message">
              <strong>Safe Waste</strong>
              <strong>Healthy People</strong>
              <strong>Greener Future</strong>
            </div>
            <div className="ms-welcome-leaf">🌿</div>
          </section>

          <section className="ms-stat-grid">
            <div className="ms-stat-card">
              <div className="ms-stat-icon green">🗑️</div>
              <div>
                <span>Today's Waste</span>
                <h2>{loading ? "…" : formatWeight(todayWaste)}</h2>
                <small>Logged today</small>
              </div>
            </div>
            <div className="ms-stat-card">
              <div className="ms-stat-icon orange">🚚</div>
              <div>
                <span>Pending Pickups</span>
                <h2>{loading ? "…" : pendingRequests.length}</h2>
                <small>Awaiting collection</small>
              </div>
            </div>
            <div className="ms-stat-card blue-card">
              <div className="ms-stat-icon blue">✓</div>
              <div>
                <span>Collected This Month</span>
                <h2>{loading ? "…" : formatWeight(collectedThisMonth)}</h2>
                <small>Based on collected batches</small>
              </div>
            </div>
            <div className="ms-stat-card">
              <div className="ms-stat-icon pink">🛡️</div>
              <div>
                <span>Compliance Rate</span>
                <h2>—</h2>
                <small>Not available in Firebase data</small>
              </div>
            </div>
          </section>

          <section className="ms-main-grid">
            {/* Recent Waste Records */}
            <div className="ms-card ms-records-card">
              <div className="ms-card-header">
                <div>
                  <h2>▣ Recent Waste Records</h2>
                  <p>Latest waste entries from your hospital</p>
                </div>
                <button
                  onClick={() =>
                    document
                      .querySelector(".ms-records-card tbody")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  View All →
                </button>
              </div>
              <div className="ms-table-wrapper">
                <table className="ms-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Waste Type</th>
                      <th>Category</th>
                      <th>Weight</th>
                      <th>Date &amp; Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecentWaste.length ? (
                      filteredRecentWaste.map((item) => (
                        <tr key={item.id}>
                          <td className="record-id">{item.id}</td>
                          <td>{item.wasteType || "Biomedical Waste"}</td>
                          <td>
                            <span className={categoryClass(item.category)}>
                              {item.category || "—"}
                            </span>
                          </td>
                          <td>
                            <strong>{formatWeight(item.weight)}</strong>
                          </td>
                          <td>
                            {formatDate(
                              item.createdAt || item.date || item.timestamp
                            )}
                          </td>
                          <td>
                            <span className="ms-status">
                              <i />
                              {item.status || "Logged"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6">
                          {loading
                            ? "Loading records…"
                            : searchTerm
                            ? "No records match your search."
                            : "No waste records found for this hospital."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pickup Status */}
            <div className="ms-card pickup-status-card">
              <div className="ms-card-header">
                <div>
                  <h2>🚚 Pickup Status</h2>
                  <p>Live status of your waste collection request</p>
                </div>
              </div>
              {sortedPickups.length === 0 ? (
                <div className="no-pickup-status">
                  <p>
                    {loading
                      ? "Loading pickup requests…"
                      : "No pickup request found."}
                  </p>
                </div>
              ) : (
                sortedPickups.slice(0, 3).map((request) => (
                  <div className="hospital-pickup-row" key={request.id}>
                    <div className="hospital-pickup-info">
                      <strong>
                        {request.wasteType || "Biomedical Waste Collection"}
                      </strong>
                      <span>{formatDate(request.requestedAt)}</span>
                    </div>
                    <div
                      className={`hospital-pickup-status ${String(
                        request.status || "pending"
                      )
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {request.status || "Pending"}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* QR Waste Tracking */}
            <div className="ms-card ms-qr-card">
              <div className="ms-card-header compact">
                <div>
                  <h2>🔳 QR Waste Tracking</h2>
                  <p>Track a waste batch using its unique QR code</p>
                </div>
              </div>
              <div className="qr-tracking-content">
                <div className="qr-placeholder">
                  <QRCodeCanvas
                    value={qrValue}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#111827"
                    level="H"
                  />
                </div>
                <div className="qr-info">
                  <strong>Waste Batch QR</strong>
                  <span>
                    Generate a unique QR code for your latest hospital waste
                    record.
                  </span>
                  <button
                    className="qr-generate-button"
                    onClick={handleGenerateQR}
                  >
                    Generate QR
                  </button>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="ms-right-column">
              {/* Quick Actions */}
              <div className="ms-card ms-actions-card">
                <div className="ms-card-header compact">
                  <div>
                    <h2>⚡ Quick Actions</h2>
                    <p>Common hospital actions</p>
                  </div>
                </div>
                <div className="ms-action-grid">
                  <button
                    className="ms-action green-action"
                    onClick={() => setPage("addWaste")}
                  >
                    <span>＋</span>
                    <strong>Add Waste</strong>
                    <small>Record new waste</small>
                  </button>
                  <button
                    className="ms-action blue-action"
                    onClick={handleRequestPickup}
                    disabled={requestingPickup}
                  >
                    <span>🚚</span>
                    <strong>Request Pickup</strong>
                    <small>Schedule collection</small>
                  </button>
                  <button
                    className="ms-action purple-action"
                    onClick={() =>
                      document
                        .querySelector(".ms-distribution-card")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    <span>▥</span>
                    <strong>View Reports</strong>
                    <small>Analyze waste data</small>
                  </button>
                  <button
                    className="ms-action yellow-action"
                    onClick={() =>
                      showToast(
                        "info",
                        "Guidelines",
                        "Follow your facility's biomedical waste segregation guidelines."
                      )
                    }
                  >
                    <span>📖</span>
                    <strong>Guidelines</strong>
                    <small>Segregation rules</small>
                  </button>
                </div>
              </div>

              {/* Waste Distribution */}
              <div className="ms-card ms-distribution-card">
                <div className="ms-card-header compact">
                  <div>
                    <h2>📊 Waste Distribution</h2>
                    <p>This week's waste</p>
                  </div>
                </div>
                <div className="ms-distribution">
                  <div className="ms-donut">
                    <div className="ms-donut-center">
                      <strong>{formatWeight(weeklyTotal)}</strong>
                      <span>Total</span>
                    </div>
                  </div>
                  <div className="ms-legend">
                    {distribution.map((group) => (
                      <div key={group.key}>
                        <i className={group.className} />
                        <span>{group.label}</span>
                        <strong>{group.percent}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="ms-bottom-grid">
            {/* Pickup Schedule */}
            <div className="ms-card">
              <div className="ms-card-header">
                <div>
                  <h2>🚚 Pickup Schedule</h2>
                  <p>Recent and upcoming collections</p>
                </div>
              </div>
              <div className="ms-pickup-list">
                {sortedPickups.length ? (
                  sortedPickups.slice(0, 4).map((request) => (
                    <div className="ms-pickup" key={request.id}>
                      <span
                        className={`pickup-dot ${
                          String(request.status || "pending").toLowerCase() ===
                          "collected"
                            ? "green-dot"
                            : "orange-dot"
                        }`}
                      />
                      <div>
                        <strong>
                          {formatDate(
                            request.scheduledAt || request.requestedAt
                          )}
                        </strong>
                        <small>
                          {request.wasteType || "Biomedical Waste"}
                        </small>
                      </div>
                      <span
                        className={
                          String(request.status || "pending").toLowerCase() ===
                          "pending"
                            ? "pending"
                            : "scheduled"
                        }
                      >
                        {request.status || "Pending"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="ms-pickup">
                    <div>
                      <strong>
                        {loading ? "Loading schedule…" : "No pickup scheduled"}
                      </strong>
                      <small>New pickup requests will appear here</small>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Alerts & Notifications */}
            {/* Bug fix: Rename map param from "alert" to "alertItem" to avoid
                shadowing the global window.alert function */}
            <div className="ms-card ms-alert-card">
              <div className="ms-card-header">
                <div>
                  <h2>🔔 Alerts &amp; Notifications</h2>
                  <p>Updates from hospital activity</p>
                </div>
              </div>
              <div className="ms-alert-list">
                {alerts.length ? (
                  alerts.map((alertItem) => (
                    <div
                      className={`ms-alert ${alertItem.type}`}
                      key={alertItem.title}
                    >
                      <span>{alertItem.icon}</span>
                      <div>
                        <strong>{alertItem.title}</strong>
                        <small>{alertItem.detail}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ms-alert info">
                    <span>i</span>
                    <div>
                      <strong>
                        {loading ? "Loading alerts…" : "No new alerts"}
                      </strong>
                      <small>
                        Alerts will appear when pickup or waste data needs
                        attention
                      </small>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="ms-footer-message">
            <span>🌿</span>
            <div>
              <strong>Clean Hospitals. Healthier Communities.</strong>
              <small>
                Segregate correctly • Collect efficiently • Treat safely
              </small>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HospitalDashboard;
