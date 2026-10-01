import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import AddWaste from "./AddWaste";
import "../../App.css";
import "./HospitalDashboard.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const HOSPITAL_NAME = "AAROGYA Hospital";
const QR_BASE_URL = "https://medisort.app/batch";
const RECORDS_PER_PAGE = 10;

const CATEGORY_META = {
  YELLOW: { label: "Infectious", color: "#eab308", emoji: "🟡" },
  RED: { label: "Contaminated", color: "#ef4444", emoji: "🔴" },
  WHITE: { label: "Sharps", color: "#64748b", emoji: "⚪" },
  BLUE: { label: "Glassware", color: "#3b82f6", emoji: "🔵" },
  OTHER: { label: "Other", color: "#8b5cf6", emoji: "🟣" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeHospital(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "").replace(/hospital$/, "");
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
  return asDate(record.createdAt || record.requestedAt || record.date || record.timestamp);
}
function formatDate(value) {
  const date = asDate(value);
  return date ? date.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
}
function formatWeight(value) {
  const w = Number(value);
  return `${Number.isFinite(w) ? w.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"} kg`;
}
function getCategoryClass(category) {
  const c = String(category || "other").toUpperCase();
  return { YELLOW: "yellow", RED: "red", WHITE: "white", BLUE: "blue" }[c] || "other";
}

// ─── Stacked Toast System ────────────────────────────────────────────────────

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  const borderColors = { success: "#166534", error: "#991b1b", warning: "#92400e", info: "#1e40af" };
  return (
    <div className="ms-toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className="ms-toast-item" style={{ borderLeft: `5px solid ${borderColors[t.type] || borderColors.info}` }}>
          <div style={{ flex: 1 }}>
            <p className="ms-toast-title">{t.title}</p>
            {t.detail && <p className="ms-toast-detail">{t.detail}</p>}
          </div>
          <button className="ms-toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({ icon, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger }) {
  return (
    <div className="ms-confirm-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ms-confirm-box">
        <div className="ms-confirm-icon">{icon}</div>
        <h3 className="ms-confirm-title">{title}</h3>
        <p className="ms-confirm-msg">{message}</p>
        <div className="ms-confirm-actions">
          <button className="ms-btn-secondary" onClick={onCancel}>{cancelLabel || "Cancel"}</button>
          <button className={danger ? "ms-btn-danger" : "ms-btn-primary"} onClick={onConfirm}>{confirmLabel || "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Animated Counter ────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const from = prevRef.current;
    const to = Number(value) || 0;
    prevRef.current = to;
    if (from === to) { setDisplay(to); return; }
    const duration = 500;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  const formatted = Number.isInteger(Number(value)) ? Math.round(display) : display.toFixed(1);
  return <span className="ms-anim-number">{formatted}{suffix}</span>;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton({ width = 80, height = 28 }) {
  return <span className="ms-skeleton" style={{ width, height }} />;
}

// ─── Mini Sparkline ──────────────────────────────────────────────────────────

function Sparkline({ data }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="ms-sparkline">
      {data.map((v, i) => (
        <div key={i} className="ms-sparkline-bar" style={{ height: `${Math.max((v / max) * 100, 6)}%` }} title={`${v.toFixed(1)} kg`} />
      ))}
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────

function HospitalDashboard({ onBackToHome }) {
  const [page, setPage] = useState("dashboard");
  const [wasteRecords, setWasteRecords] = useState([]);
  const [pickupRequests, setPickupRequests] = useState([]);
  const [wasteBatches, setWasteBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [qrValue, setQrValue] = useState(`${QR_BASE_URL}/AAROGYA-001`);
  const [requestingPickup, setRequestingPickup] = useState(false);

  // Search, Filter, Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [activeModal, setActiveModal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [qrSelectedRecordId, setQrSelectedRecordId] = useState("");

  // Edit state
  const [editForm, setEditForm] = useState({});

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("ms-dark") === "1"; } catch { return false; }
  });

  // Sidebar collapse & mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Confirm dialog
  const [confirmState, setConfirmState] = useState(null);

  // Toast stack
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  // Export date range
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    try { localStorage.setItem("ms-dark", darkMode ? "1" : "0"); } catch { }
  }, [darkMode]);

  // ─── Toast helpers (stacking) ──────────────────────────────────────────

  const showToast = useCallback((type, title, detail = "") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev.slice(-4), { id, type, title, detail }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Firestore listeners ──────────────────────────────────────────────

  const settledRef = useRef(0);

  useEffect(() => {
    settledRef.current = 0;
    const markSettled = () => { settledRef.current += 1; if (settledRef.current >= 3) setLoading(false); };
    const handleError = (error) => {
      console.error("Hospital dashboard data error:", error);
      setDataError("Some dashboard data could not be loaded. Check your Firebase access and try again.");
      markSettled();
    };
    const unsubs = [
      onSnapshot(query(collection(db, "wasteRecords"), orderBy("createdAt", "desc")),
        (snap) => { setWasteRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(isThisHospital)); markSettled(); }, handleError),
      onSnapshot(query(collection(db, "pickupRequests"), orderBy("requestedAt", "desc")),
        (snap) => { setPickupRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(isThisHospital)); markSettled(); }, handleError),
      onSnapshot(query(collection(db, "wasteBatches"), orderBy("createdAt", "desc")),
        (snap) => { setWasteBatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter(isThisHospital)); markSettled(); }, handleError),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  // ─── Date boundaries ──────────────────────────────────────────────────

  const todayStart = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }, []);
  const monthStart = useMemo(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); }, []);
  const weekStart = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return d; }, []);

  // ─── Derived Statistics ───────────────────────────────────────────────

  const todayWaste = useMemo(() => wasteRecords.filter((r) => getRecordDate(r) >= todayStart).reduce((s, r) => s + (Number(r.weight) || 0), 0), [wasteRecords, todayStart]);
  const todayWasteCount = useMemo(() => wasteRecords.filter((r) => getRecordDate(r) >= todayStart).length, [wasteRecords, todayStart]);
  const pendingRequests = useMemo(() => pickupRequests.filter((r) => ["pending", "in transit"].includes(String(r.status || "").toLowerCase())), [pickupRequests]);
  const collectedThisMonth = useMemo(() => wasteBatches.filter((b) => String(b.status || "").toLowerCase() === "collected" && getRecordDate(b) >= monthStart).reduce((s, b) => s + (Number(b.weight) || 0), 0), [wasteBatches, monthStart]);

  // Real compliance: % of waste records that have both a valid category AND an associated batch with a QR
  const complianceRate = useMemo(() => {
    if (!wasteRecords.length) return 0;
    const validCats = ["YELLOW", "RED", "WHITE", "BLUE"];
    const batchedIds = new Set(wasteBatches.map((b) => b.wasteRecordId).filter(Boolean));
    const compliant = wasteRecords.filter((r) => {
      const hasCat = validCats.includes(String(r.category || "").toUpperCase());
      const hasBatch = batchedIds.has(r.id);
      const hasWeight = Number(r.weight) > 0;
      return hasCat && hasWeight && hasBatch;
    }).length;
    return Math.round((compliant / wasteRecords.length) * 100);
  }, [wasteRecords, wasteBatches]);

  // 7-day sparkline data
  const sparklineData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      const total = wasteRecords.filter((r) => { const rd = getRecordDate(r); return rd && rd >= d && rd < next; }).reduce((s, r) => s + (Number(r.weight) || 0), 0);
      days.push(total);
    }
    return days;
  }, [wasteRecords]);

  const weeklyWaste = useMemo(() => wasteRecords.filter((r) => getRecordDate(r) >= weekStart), [wasteRecords, weekStart]);
  const weeklyTotal = useMemo(() => weeklyWaste.reduce((s, r) => s + (Number(r.weight) || 0), 0), [weeklyWaste]);

  const distribution = useMemo(() => {
    const groups = [
      { key: "YELLOW", label: "Infectious", color: "#eab308", className: "yellow-dot" },
      { key: "RED", label: "Contaminated", color: "#ef4444", className: "red-dot" },
      { key: "WHITE", label: "Sharps", color: "#64748b", className: "white-dot" },
      { key: "BLUE", label: "Glassware", color: "#3b82f6", className: "blue-dot" },
      { key: "OTHER", label: "Other", color: "#8b5cf6", className: "black-dot" },
    ];
    const totals = Object.fromEntries(groups.map((g) => [g.key, 0]));
    weeklyWaste.forEach((r) => { const c = String(r.category || "").toUpperCase(); totals[Object.hasOwn(totals, c) ? c : "OTHER"] += Number(r.weight) || 0; });
    return groups.map((g) => ({ ...g, weight: totals[g.key], percent: weeklyTotal ? Math.round((totals[g.key] / weeklyTotal) * 100) : 0 }));
  }, [weeklyWaste, weeklyTotal]);

  const donutGradient = useMemo(() => {
    if (!weeklyTotal) return "conic-gradient(#e2e8f0 0deg 360deg)";
    let deg = 0;
    return `conic-gradient(${distribution.map((d) => { const s = deg; deg += (d.weight / weeklyTotal) * 360; return `${d.color} ${s}deg ${deg}deg`; }).join(", ")})`;
  }, [distribution, weeklyTotal]);

  const sortedPickups = useMemo(() => [...pickupRequests].sort((a, b) => (getRecordDate(b)?.getTime() || 0) - (getRecordDate(a)?.getTime() || 0)), [pickupRequests]);

  const alerts = useMemo(() => {
    const rows = [];
    sortedPickups.filter((r) => String(r.status || "").toLowerCase() === "pending").slice(0, 2).forEach((r) => rows.push({ type: "warning", icon: "⚠", title: "Pickup awaiting collection", detail: formatDate(r.requestedAt) }));
    const yk = distribution.find((g) => g.key === "YELLOW")?.weight || 0;
    if (weeklyTotal > 0 && yk / weeklyTotal >= 0.5) rows.push({ type: "overdue", icon: "!", title: "High infectious waste", detail: `${formatWeight(yk)} this week (≥ 50%)` });
    const lb = wasteBatches.length > 0 ? wasteBatches.reduce((n, b) => ((getRecordDate(b)?.getTime() || 0) > (getRecordDate(n)?.getTime() || 0) ? b : n)) : null;
    if (lb) rows.push({ type: "info", icon: "ℹ️", title: "Waste batch updated", detail: formatDate(lb.createdAt) });
    if (complianceRate < 80 && wasteRecords.length > 0) rows.push({ type: "overdue", icon: "⚠", title: "Low compliance rate", detail: `${complianceRate}% — add QR batches to improve` });
    return rows.slice(0, 4);
  }, [sortedPickups, distribution, weeklyTotal, wasteBatches, complianceRate, wasteRecords.length]);

  // ─── Filtered & Paginated Records ─────────────────────────────────────

  const filteredWasteRecords = useMemo(() => {
    return wasteRecords.filter((r) => {
      if (categoryFilter !== "ALL") { const c = String(r.category || "").toUpperCase(); if (categoryFilter === "OTHER" ? ["YELLOW", "RED", "WHITE", "BLUE"].includes(c) : c !== categoryFilter) return false; }
      const rd = getRecordDate(r);
      if (dateFilter === "TODAY" && rd && rd < todayStart) return false;
      if (dateFilter === "WEEK" && rd && rd < weekStart) return false;
      if (dateFilter === "MONTH" && rd && rd < monthStart) return false;
      if (searchTerm.trim()) { const t = searchTerm.toLowerCase(); if (![r.id, r.wasteType, r.category, r.status, r.weight].map((v) => String(v || "").toLowerCase()).some((v) => v.includes(t))) return false; }
      return true;
    });
  }, [wasteRecords, categoryFilter, dateFilter, searchTerm, todayStart, weekStart, monthStart]);

  const totalPages = Math.max(1, Math.ceil(filteredWasteRecords.length / RECORDS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedRecords = filteredWasteRecords.slice((safePage - 1) * RECORDS_PER_PAGE, safePage * RECORDS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => setCurrentPage(1), [categoryFilter, dateFilter, searchTerm]);

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleGenerateQR = async () => {
    try {
      let target = qrSelectedRecordId ? wasteRecords.find((r) => r.id === qrSelectedRecordId) : null;
      if (!target) target = [...wasteRecords].sort((a, b) => (getRecordDate(b)?.getTime() || 0) - (getRecordDate(a)?.getTime() || 0))[0];
      if (!target) { showToast("warning", "No waste record found", "Please add a waste record first."); return; }
      const newId = `MEDISORT-WASTE-${Date.now()}`;
      await addDoc(collection(db, "wasteBatches"), { qrId: newId, hospital: HOSPITAL_NAME, wasteType: target.wasteType || "Biomedical Waste", category: target.category || "Mixed", weight: Number(target.weight) || 0, wasteRecordId: target.id, status: "Pending", createdAt: serverTimestamp() });
      setQrValue(`${QR_BASE_URL}/${newId}`);
      showToast("success", "QR code generated!", `${target.wasteType || "Biomedical Waste"} · ${target.category || "Mixed"} · ${formatWeight(target.weight)}`);
    } catch (err) { console.error("QR error:", err); showToast("error", "QR generation failed", err.message); }
  };

  const handleRequestPickup = () => {
    const active = pickupRequests.find((r) => ["pending", "in transit"].includes(String(r.status || "").toLowerCase()));
    if (active) { showToast("warning", "Active request exists", `Already ${String(active.status).toLowerCase()}.`); return; }
    const totalWeight = wasteRecords.filter((r) => !["collected", "completed"].includes(String(r.status || "").toLowerCase())).reduce((s, r) => s + (Number(r.weight) || 0), 0);
    setConfirmState({
      icon: "🚚", title: "Confirm Pickup Request",
      message: `Schedule a biomedical waste collection for ${formatWeight(totalWeight)} of pending waste?`,
      confirmLabel: "Yes, Request Pickup",
      onConfirm: async () => {
        setConfirmState(null); setRequestingPickup(true);
        try {
          await addDoc(collection(db, "pickupRequests"), { hospital: HOSPITAL_NAME, wasteType: "Biomedical Waste", weight: totalWeight, category: "Mixed", status: "Pending", requestedAt: serverTimestamp() });
          showToast("success", "Pickup request sent!", "Collection team will be dispatched.");
        } catch (err) { console.error(err); showToast("error", "Request failed", err.message); }
        finally { setRequestingPickup(false); }
      },
    });
  };

  const handleDeleteRecord = (record) => {
    setConfirmState({
      icon: "🗑️", title: "Delete Waste Record?",
      message: `Permanently remove "${record.wasteType || "Biomedical Waste"}" (${formatWeight(record.weight)}) from records? This cannot be undone.`,
      confirmLabel: "Delete Record", danger: true,
      onConfirm: async () => {
        setConfirmState(null);
        try {
          await deleteDoc(doc(db, "wasteRecords", record.id));
          showToast("success", "Record deleted", `${record.id.slice(0, 8)}… removed.`);
          if (selectedRecord?.id === record.id) setActiveModal(null);
        } catch (err) { console.error(err); showToast("error", "Delete failed", err.message); }
      },
    });
  };

  const handleEditRecord = (record) => {
    setEditForm({ wasteType: record.wasteType || "Biomedical Waste", category: record.category || "Mixed", weight: record.weight || 0 });
    setSelectedRecord(record);
    setActiveModal("editRecord");
  };

  const handleSaveEdit = async () => {
    if (!selectedRecord) return;
    try {
      await updateDoc(doc(db, "wasteRecords", selectedRecord.id), { wasteType: editForm.wasteType, category: editForm.category, weight: Number(editForm.weight) || 0 });
      showToast("success", "Record updated", `${selectedRecord.id.slice(0, 8)}… saved.`);
      setActiveModal(null);
    } catch (err) { console.error(err); showToast("error", "Update failed", err.message); }
  };

  const handleExportCSV = () => {
    try {
      let records = filteredWasteRecords.length ? filteredWasteRecords : wasteRecords;
      if (exportFrom || exportTo) {
        const from = exportFrom ? new Date(exportFrom) : null;
        const to = exportTo ? new Date(exportTo + "T23:59:59") : null;
        records = records.filter((r) => { const d = getRecordDate(r); if (!d) return false; if (from && d < from) return false; if (to && d > to) return false; return true; });
      }
      if (!records.length) { showToast("warning", "No data to export"); return; }
      const headers = ["Record ID", "Hospital", "Waste Type", "Category", "Weight (kg)", "Status", "Date", "Time"];
      const rows = records.map((r) => { const d = getRecordDate(r); return [`"${r.id}"`, `"${r.hospital || HOSPITAL_NAME}"`, `"${r.wasteType || "Biomedical Waste"}"`, `"${r.category || "Mixed"}"`, Number(r.weight || 0).toFixed(2), `"${r.status || "Logged"}"`, `"${d ? d.toLocaleDateString("en-IN") : "—"}"`, `"${d ? d.toLocaleTimeString("en-IN") : "—"}"`]; });
      const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const a = document.createElement("a"); a.href = encodeURI(csv); a.download = `medisort_waste_${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast("success", "CSV Exported", `${records.length} records downloaded.`);
    } catch (err) { showToast("error", "Export failed", err.message); }
  };

  const handleDownloadQR = () => {
    try {
      const canvas = document.querySelector(".qr-placeholder canvas");
      if (!canvas) { showToast("error", "QR not ready"); return; }
      const a = document.createElement("a"); a.href = canvas.toDataURL("image/png"); a.download = `medisort_qr_${Date.now()}.png`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast("success", "QR Downloaded");
    } catch (err) { showToast("error", "Download failed", err.message); }
  };

  // ─── Render ───────────────────────────────────────────────────────────

  if (page === "addWaste") return <AddWaste onBack={() => setPage("dashboard")} />;

  return (
    <div className="ms-dashboard">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      {confirmState && (
        <ConfirmDialog {...confirmState} onCancel={() => setConfirmState(null)} />
      )}

      {/* Mobile sidebar overlay */}
      <div className={`ms-sidebar-overlay ${sidebarOpen ? "show" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* ─── SIDEBAR ─── */}
      <aside className={`ms-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${sidebarOpen ? "open" : ""}`}>
        <button className="ms-collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Expand" : "Collapse"}>
          {sidebarCollapsed ? "»" : "«"}
        </button>

        <div className="ms-brand">
          <div className="ms-brand-icon">+</div>
          <div><h2>MediSort</h2><span>Smart Medical Waste</span></div>
        </div>

        <nav className="ms-navigation" role="navigation" aria-label="Dashboard navigation">
          {[
            { icon: "⌂", label: "Dashboard", onClick: () => { setPage("dashboard"); setSidebarOpen(false); }, active: page === "dashboard", current: true },
            { icon: "🏠", label: "Hospital Front Page", onClick: () => { onBackToHome(); setSidebarOpen(false); } },
            { icon: "＋", label: "Add Waste", onClick: () => { setPage("addWaste"); setSidebarOpen(false); } },
            { icon: "🚚", label: requestingPickup ? "Requesting…" : "Request Pickup", onClick: handleRequestPickup, disabled: requestingPickup },
            { icon: "▣", label: "Waste Records", onClick: () => { setActiveModal("allRecords"); setSidebarOpen(false); } },
            { icon: "🚛", label: "Pickup Status", onClick: () => { setActiveModal("allPickups"); setSidebarOpen(false); } },
            { icon: "▥", label: "Reports", onClick: () => { document.querySelector(".ms-distribution-card")?.scrollIntoView({ behavior: "smooth" }); setSidebarOpen(false); } },
            { icon: "📖", label: "BMW Guidelines", onClick: () => { setActiveModal("guidelines"); setSidebarOpen(false); } },
            { icon: "♙", label: "Profile", onClick: () => { setActiveModal("profile"); setSidebarOpen(false); } },
            { icon: "⚙", label: "Settings", onClick: () => { setActiveModal("settings"); setSidebarOpen(false); } },
          ].map((item) => (
            <button key={item.label} className={`ms-nav-item ${item.active ? "active" : ""}`} onClick={item.onClick} disabled={item.disabled} aria-current={item.current ? "page" : undefined}>
              <span className="ms-nav-icon">{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="ms-sidebar-footer">
          <div className="ms-leaf">🌿</div>
          <div><strong>A Cleaner</strong><strong>Healthier</strong><strong>Tomorrow</strong></div>
          <small>MediSort Pro v2.4</small>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <main className="ms-main">
        <header className="ms-topbar">
          <button className="ms-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu">☰</button>

          <div className="ms-search">
            <span>🔍</span>
            <input type="text" placeholder="Search records, wards, batches…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            {searchTerm && <button type="button" onClick={() => setSearchTerm("")} className="ms-toast-close" style={{ fontSize: 16 }}>✕</button>}
          </div>

          <div className="ms-user-area">
            <button className="ms-theme-toggle" onClick={() => setDarkMode(!darkMode)} title={darkMode ? "Light mode" : "Dark mode"}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button className="ms-notification" onClick={() => document.querySelector(".ms-alert-card")?.scrollIntoView({ behavior: "smooth" })} title="View Alerts">
              🔔<span>{alerts.length}</span>
            </button>
            <div className="ms-avatar" onClick={() => setActiveModal("profile")} style={{ cursor: "pointer" }} title="Profile">AH</div>
            <div className="ms-user-info" onClick={() => setActiveModal("profile")} style={{ cursor: "pointer" }}>
              <strong>AAROGYA Hospital</strong><span>Ward Admin</span>
            </div>
          </div>
        </header>

        <div className="ms-content">
          {dataError && <div role="alert" className="ms-detail-field" style={{ background: "#fee2e2", color: "#991b1b", borderColor: "#f87171", marginBottom: 20 }}>{dataError}</div>}

          {/* Hero Banner */}
          <section className="ms-welcome-modern">
            <div className="ms-welcome-content">
              <div className="ms-welcome-badge"><span className="pulse-dot" /><span>NABH Certified • Live Segregation Tracking</span></div>
              <h1>🏥 AAROGYA Hospital</h1>
              <p>Real-time biomedical waste tracking, QR manifests, and pollution control compliance.</p>
            </div>
            <div className="ms-welcome-actions">
              <button className="ms-hero-btn primary" onClick={() => setPage("addWaste")}>＋ Add Waste</button>
              <button className="ms-hero-btn secondary" onClick={() => setActiveModal("allPickups")}>🚚 Live Pickups ({pendingRequests.length})</button>
              <button className="ms-hero-btn secondary" onClick={handleExportCSV}>📥 Export CSV</button>
            </div>
          </section>

          {/* Stat Cards with Skeletons, Animated Numbers & Sparklines */}
          <section className="ms-stat-grid">
            <div className="ms-stat-card">
              <div className="ms-stat-icon green">🗑️</div>
              <div>
                <span>Today's Waste</span>
                <h2>{loading ? <Skeleton /> : <><AnimatedNumber value={todayWaste} suffix=" kg" /></>}</h2>
                {!loading && <span className="ms-stat-pill success">{todayWasteCount} {todayWasteCount === 1 ? "entry" : "entries"}</span>}
                {!loading && <Sparkline data={sparklineData} />}
              </div>
            </div>
            <div className="ms-stat-card">
              <div className="ms-stat-icon orange">🚚</div>
              <div>
                <span>Pending Pickups</span>
                <h2>{loading ? <Skeleton /> : <AnimatedNumber value={pendingRequests.length} />}</h2>
                {!loading && <span className={`ms-stat-pill ${pendingRequests.length > 0 ? "warning" : "info"}`}>{pendingRequests.length > 0 ? "Awaiting" : "All Clear"}</span>}
              </div>
            </div>
            <div className="ms-stat-card blue-card">
              <div className="ms-stat-icon blue">✓</div>
              <div>
                <span>Collected This Month</span>
                <h2>{loading ? <Skeleton /> : <AnimatedNumber value={collectedThisMonth} suffix=" kg" />}</h2>
                {!loading && <span className="ms-stat-pill info">Verified Batches</span>}
              </div>
            </div>
            <div className="ms-stat-card">
              <div className="ms-stat-icon pink">🛡️</div>
              <div>
                <span>Compliance Rate</span>
                <h2>{loading ? <Skeleton /> : <AnimatedNumber value={complianceRate} suffix="%" />}</h2>
                {!loading && <span className={`ms-stat-pill ${complianceRate >= 80 ? "success" : "warning"}`}>{complianceRate >= 80 ? "CPCB Compliant" : "Needs Improvement"}</span>}
              </div>
            </div>
          </section>

          {/* Main Grid */}
          <section className="ms-main-grid">
            {/* Recent Waste Records with Filters & Pagination */}
            <div className="ms-card ms-records-card">
              <div className="ms-card-header">
                <div><h2>▣ Recent Waste Records</h2><p>Filter, inspect, edit and export</p></div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="ms-filter-btn" onClick={handleExportCSV}><span>📥</span> CSV</button>
                  <button className="ms-btn-primary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setActiveModal("allRecords")}>View All ({wasteRecords.length}) →</button>
                </div>
              </div>

              <div className="ms-filter-bar">
                <div className="ms-filter-pills">
                  {[{ key: "ALL", label: "All" }, { key: "YELLOW", label: "🟡 Yellow" }, { key: "RED", label: "🔴 Red" }, { key: "WHITE", label: "⚪ White" }, { key: "BLUE", label: "🔵 Blue" }].map((f) => (
                    <button key={f.key} type="button" className={`ms-filter-pill ${categoryFilter === f.key ? `active ${f.key.toLowerCase()}` : ""}`} onClick={() => setCategoryFilter(f.key)}>{f.label}</button>
                  ))}
                </div>
                <div className="ms-filter-actions">
                  <select className="ms-qr-select" style={{ width: "auto", padding: "4px 8px", fontSize: 12 }} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
                    <option value="ALL">All Time</option><option value="TODAY">Today</option><option value="WEEK">Past 7 Days</option><option value="MONTH">This Month</option>
                  </select>
                </div>
              </div>

              <div className="ms-table-wrapper">
                {loading ? (
                  <div style={{ padding: 20 }}>{[1, 2, 3].map((i) => <div key={i} className="ms-skeleton ms-skeleton-row" />)}</div>
                ) : (
                  <table className="ms-table">
                    <thead><tr><th>ID</th><th>Waste Type</th><th>Category</th><th>Weight</th><th>Logged At</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {paginatedRecords.length ? paginatedRecords.map((item) => {
                        const catMeta = CATEGORY_META[String(item.category || "").toUpperCase()] || CATEGORY_META.OTHER;
                        return (
                          <tr key={item.id} className="clickable-row" onClick={() => { setSelectedRecord(item); setActiveModal("recordDetail"); }}>
                            <td style={{ fontFamily: "monospace", fontSize: 11 }}>{item.id.slice(0, 10)}…</td>
                            <td><strong>{item.wasteType || "Biomedical Waste"}</strong></td>
                            <td><span className={`ms-cat-tag ${getCategoryClass(item.category)}`}>{catMeta.emoji} {item.category || "—"}</span></td>
                            <td><strong>{formatWeight(item.weight)}</strong></td>
                            <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatDate(item.createdAt || item.date || item.timestamp)}</td>
                            <td><span className="ms-status"><i />{item.status || "Logged"}</span></td>
                            <td>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button type="button" className="ms-row-action-btn" onClick={(e) => { e.stopPropagation(); handleEditRecord(item); }}>✏️</button>
                                <button type="button" className="ms-row-action-btn danger" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(item); }}>🗑️</button>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan="7" style={{ textAlign: "center", padding: "32px 16px" }}>
                          {searchTerm || categoryFilter !== "ALL" || dateFilter !== "ALL" ? (
                            <div><p style={{ margin: "0 0 8px", color: "var(--text-secondary)" }}>No records match filters.</p>
                              <button type="button" className="ms-filter-btn" onClick={() => { setSearchTerm(""); setCategoryFilter("ALL"); setDateFilter("ALL"); }}>Reset Filters</button>
                            </div>
                          ) : "No waste records found."}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="ms-pagination">
                  <button className="ms-page-btn" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), safePage + 2).map((p) => (
                    <button key={p} className={`ms-page-btn ${p === safePage ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                  ))}
                  <button className="ms-page-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>›</button>
                </div>
              )}
            </div>

            {/* Pickup Status Card */}
            <div className="ms-card ms-modern-status-card">
              <div className="ms-status-header">
                <div className="ms-status-heading"><div className="ms-status-icon">🚚</div><div><h2>Pickup Status</h2><p>Live dispatch tracking</p></div></div>
                <div className="ms-live-indicator"><span />Live</div>
              </div>
              {pickupRequests.length === 0 ? (
                <div className="ms-status-empty"><div className="ms-status-empty-icon">📦</div><strong>No active pickups</strong><span>Schedule a collection request.</span></div>
              ) : (
                <div className="ms-status-list">
                  {pickupRequests.slice(0, 3).map((r, i) => {
                    const raw = r.status || "Pending"; const cls = String(raw).toLowerCase().replace(/\s+/g, "-"); const rd = asDate(r.requestedAt); const w = Number(r.weight) || 0;
                    return (
                      <div className="ms-status-item" key={r.id || i} style={{ cursor: "pointer" }} onClick={() => setActiveModal("allPickups")}>
                        <div className={`ms-status-item-icon ${cls}`}>🚚</div>
                        <div className="ms-status-main">
                          <div className="ms-status-main-top"><div><h3>{r.hospital || "AAROGYA Hospital"}</h3><p>Biomedical Waste Collection</p></div><span className={`ms-status-pill ${cls}`}><span className="ms-status-pill-dot" />{raw}</span></div>
                          <div className="ms-status-details"><span>🗓️ {rd ? rd.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}</span><span>⚖️ {w.toFixed(1)} kg</span><span>🏷️ {r.category || "Mixed"}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {pickupRequests.length > 0 && <div className="ms-status-footer"><span>Latest {Math.min(pickupRequests.length, 3)} of {pickupRequests.length}</span><button type="button" onClick={() => setActiveModal("allPickups")}>View All →</button></div>}
            </div>

            {/* QR Tracking */}
            <div className="ms-card ms-qr-card">
              <div className="ms-card-header compact"><div><h2>🔳 QR Batch Tracking</h2><p>Generate and download QR tags</p></div></div>
              <div className="qr-tracking-content">
                <div className="qr-placeholder" style={{ padding: 12, background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <QRCodeCanvas value={qrValue} size={140} bgColor={darkMode ? "#1a2332" : "#ffffff"} fgColor={darkMode ? "#e2e8f0" : "#0f172a"} level="H" />
                </div>
                <div className="qr-info" style={{ flex: 1 }}>
                  <strong>Batch QR Code</strong><span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Select a record or generate for latest.</span>
                  <div className="ms-qr-controls">
                    <select className="ms-qr-select" value={qrSelectedRecordId} onChange={(e) => setQrSelectedRecordId(e.target.value)}>
                      <option value="">Latest Record</option>
                      {wasteRecords.slice(0, 10).map((r) => <option key={r.id} value={r.id}>{r.wasteType || "Waste"} · {r.category} ({formatWeight(r.weight)})</option>)}
                    </select>
                    <div className="ms-qr-btn-group">
                      <button className="ms-qr-action-btn" onClick={handleGenerateQR}>⚡ Generate</button>
                      <button className="ms-qr-action-btn" onClick={handleDownloadQR}>📥 Download</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="ms-right-column">
              <div className="ms-card ms-actions-card">
                <div className="ms-card-header compact"><div><h2>⚡ Quick Actions</h2><p>Frequent tasks</p></div></div>
                <div className="ms-action-grid">
                  <button className="ms-action green-action" onClick={() => setPage("addWaste")}><span>＋</span><strong>Add Waste</strong><small>Record new waste</small></button>
                  <button className="ms-action blue-action" onClick={handleRequestPickup} disabled={requestingPickup}><span>🚚</span><strong>Request Pickup</strong><small>Dispatch collector</small></button>
                  <button className="ms-action purple-action" onClick={handleExportCSV}><span>📥</span><strong>Export Log</strong><small>CSV report</small></button>
                  <button className="ms-action yellow-action" onClick={() => setActiveModal("guidelines")}><span>📖</span><strong>BMW Rules</strong><small>Segregation guide</small></button>
                </div>
              </div>

              <div className="ms-card ms-distribution-card">
                <div className="ms-card-header compact">
                  <div>
                    <h2>📊 Waste Distribution</h2>
                    <p>7-day category breakdown — hover for details</p>
                  </div>
                  <span className="ms-dist-badge">{weeklyWaste.length} entries</span>
                </div>

                <div className="ms-dist-body">
                  {/* Donut Chart */}
                  <div className="ms-dist-chart-area">
                    <div className="ms-donut-wrapper">
                      <div className="ms-donut-dynamic" style={{ background: donutGradient }} title="Category breakdown">
                        <div className="ms-donut-hole">
                          <strong>{formatWeight(weeklyTotal)}</strong>
                          <span>7-Day Total</span>
                        </div>
                      </div>
                      <div className="ms-donut-ring-glow" />
                    </div>
                    <div className="ms-dist-summary-row">
                      <div className="ms-dist-summary-item">
                        <span className="ms-dist-summary-num">{weeklyWaste.length}</span>
                        <span className="ms-dist-summary-label">Records</span>
                      </div>
                      <div className="ms-dist-summary-divider" />
                      <div className="ms-dist-summary-item">
                        <span className="ms-dist-summary-num">{distribution.filter((d) => d.weight > 0).length}</span>
                        <span className="ms-dist-summary-label">Categories</span>
                      </div>
                      <div className="ms-dist-summary-divider" />
                      <div className="ms-dist-summary-item">
                        <span className="ms-dist-summary-num">{distribution.reduce((max, d) => d.weight > max.weight ? d : max, distribution[0])?.label || "—"}</span>
                        <span className="ms-dist-summary-label">Top Category</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Bars */}
                  <div className="ms-dist-bars">
                    {distribution.map((g) => {
                      const catInfo = CATEGORY_META[g.key] || {};
                      return (
                        <div key={g.key} className="ms-dist-bar-row">
                          <div className="ms-dist-bar-header">
                            <div className="ms-dist-bar-label">
                              <span className="ms-dist-emoji">{catInfo.emoji || "🟣"}</span>
                              <span className="ms-dist-cat-name">{g.label}</span>
                            </div>
                            <div className="ms-dist-bar-values">
                              <span className="ms-dist-weight">{formatWeight(g.weight)}</span>
                              <span className="ms-dist-pct" style={{ color: g.color }}>{g.percent}%</span>
                            </div>
                          </div>
                          <div className="ms-dist-bar-track">
                            <div
                              className="ms-dist-bar-fill"
                              style={{
                                width: `${Math.max(g.percent, 2)}%`,
                                background: `linear-gradient(90deg, ${g.color}cc, ${g.color})`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="ms-dist-footer">
                  <span>🌿 Proper segregation reduces treatment cost by up to 60%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Grid */}
          <section className="ms-bottom-grid">
            <div className="ms-card ms-modern-schedule-card">
              <div className="ms-modern-schedule-header">
                <div className="ms-modern-schedule-title"><span className="ms-modern-schedule-icon">🚚</span><div><h2>Pickup History</h2><p>Recent collections</p></div></div>
                <button type="button" className="ms-modern-view-all" onClick={() => setActiveModal("allPickups")}>View All ({pickupRequests.length}) →</button>
              </div>
              <div className="ms-modern-schedule-list">
                {pickupRequests.length === 0 ? (
                  <div className="ms-modern-empty"><div className="ms-modern-empty-icon">📦</div><strong>No requests yet</strong></div>
                ) : pickupRequests.slice(0, 4).map((r, i) => {
                  const rd = asDate(r.requestedAt); const st = r.status || "Pending"; const ns = String(st).toLowerCase().replace(/\s+/g, "-"); const w = Number(r.weight) || 0;
                  return (
                    <div className="ms-modern-pickup-item" key={r.id || i} style={{ cursor: "pointer" }} onClick={() => setActiveModal("allPickups")}>
                      <div className="ms-modern-timeline"><span className={`ms-modern-status-dot ${ns}`} />{i < Math.min(pickupRequests.length, 4) - 1 && <span className="ms-modern-timeline-line" />}</div>
                      <div className="ms-modern-pickup-content">
                        <div className="ms-modern-pickup-top"><div><strong>{rd ? rd.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"} · {rd ? rd.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</strong><span>{r.wasteType || "Biomedical Waste"}</span></div><span className={`ms-modern-status ${ns}`}>{st}</span></div>
                        <div className="ms-modern-pickup-meta"><span>🏥 {r.hospital || "AAROGYA Hospital"}</span><span>⚖️ {w.toFixed(1)} kg</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ms-card ms-alert-card">
              <div className="ms-card-header"><div><h2>🔔 Alerts &amp; Notifications</h2><p>Automated compliance checks</p></div></div>
              <div className="ms-alert-list">
                {alerts.length ? alerts.map((a) => (
                  <div className={`ms-alert ${a.type}`} key={a.title}><span>{a.icon}</span><div><strong>{a.title}</strong><small>{a.detail}</small></div></div>
                )) : (
                  <div className="ms-alert info"><span>ℹ️</span><div><strong>{loading ? "Loading…" : "Facility Status Normal"}</strong><small>No warnings or delayed pickups.</small></div></div>
                )}
              </div>
            </div>
          </section>

          <div className="ms-footer-message"><span>🌿</span><div><strong>Clean Hospitals. Healthier Communities.</strong><small>Segregate correctly • Collect efficiently • Treat safely • BMW Rules 2016</small></div></div>
        </div>
      </main>

      {/* ─── MODALS ─── */}

      {/* All Pickups */}
      {activeModal === "allPickups" && (
        <div className="ms-modal-backdrop" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true" aria-label="All Pickup Requests">
          <div className="ms-modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header">
              <div className="ms-modal-header-left"><div className="ms-modal-header-icon">🚚</div><div><h3>All Pickup Requests</h3><p>{pickupRequests.length} total requests</p></div></div>
              <button className="ms-modal-close" onClick={() => setActiveModal(null)} aria-label="Close">✕</button>
            </div>
            <div className="ms-modal-body">
              {pickupRequests.length === 0 ? <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>No requests yet.</p> : (
                <table className="ms-table"><thead><tr><th>ID</th><th>Type</th><th>Category</th><th>Weight</th><th>Requested</th><th>Status</th></tr></thead>
                  <tbody>{sortedPickups.map((p) => {
                    const d = asDate(p.requestedAt); const s = p.status || "Pending"; const sc = String(s).toLowerCase().replace(/\s+/g, "-"); return (
                      <tr key={p.id}><td style={{ fontFamily: "monospace", fontSize: 11 }}>{p.id.slice(0, 10)}…</td><td><strong>{p.wasteType || "Biomedical Waste"}</strong></td><td><span className={`ms-cat-tag ${getCategoryClass(p.category)}`}>{p.category || "Mixed"}</span></td><td><strong>{Number(p.weight || 0).toFixed(1)} kg</strong></td><td>{d ? formatDate(d) : "—"}</td><td><span className={`ms-status-pill ${sc}`}><span className="ms-status-pill-dot" />{s}</span></td></tr>
                    );
                  })}</tbody></table>
              )}
            </div>
            <div className="ms-modal-footer">
              <button className="ms-btn-secondary" onClick={() => setActiveModal(null)}>Close</button>
              <button className="ms-btn-primary" onClick={() => { setActiveModal(null); handleRequestPickup(); }} disabled={requestingPickup}>＋ New Pickup</button>
            </div>
          </div>
        </div>
      )}

      {/* All Records with Pagination */}
      {activeModal === "allRecords" && (
        <div className="ms-modal-backdrop" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true" aria-label="All Waste Records">
          <div className="ms-modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header">
              <div className="ms-modal-header-left"><div className="ms-modal-header-icon">▣</div><div><h3>All Waste Records</h3><p>{filteredWasteRecords.length} records</p></div></div>
              <button className="ms-modal-close" onClick={() => setActiveModal(null)} aria-label="Close">✕</button>
            </div>
            <div className="ms-modal-body">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <input type="text" placeholder="Filter records…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ms-qr-select" style={{ width: 260 }} />
                <div className="ms-export-dates">
                  <label>From:</label><input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
                  <label>To:</label><input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
                  <button className="ms-btn-secondary" onClick={handleExportCSV}>📥 Export</button>
                </div>
              </div>
              <table className="ms-table"><thead><tr><th>ID</th><th>Type</th><th>Category</th><th>Weight</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>{paginatedRecords.map((item) => (
                  <tr key={item.id} className="clickable-row" onClick={() => { setSelectedRecord(item); setActiveModal("recordDetail"); }}>
                    <td style={{ fontFamily: "monospace", fontSize: 11 }}>{item.id.slice(0, 10)}…</td>
                    <td><strong>{item.wasteType || "Biomedical Waste"}</strong></td>
                    <td><span className={`ms-cat-tag ${getCategoryClass(item.category)}`}>{item.category || "—"}</span></td>
                    <td><strong>{formatWeight(item.weight)}</strong></td>
                    <td>{formatDate(item.createdAt || item.date || item.timestamp)}</td>
                    <td><span className="ms-status"><i />{item.status || "Logged"}</span></td>
                    <td><div style={{ display: "flex", gap: 4 }}>
                      <button type="button" className="ms-row-action-btn" onClick={(e) => { e.stopPropagation(); handleEditRecord(item); }}>✏️</button>
                      <button type="button" className="ms-row-action-btn danger" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(item); }}>🗑️</button>
                    </div></td>
                  </tr>
                ))}</tbody>
              </table>
              {totalPages > 1 && (
                <div className="ms-pagination">
                  <button className="ms-page-btn" disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>‹</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), safePage + 2).map((p) => (
                    <button key={p} className={`ms-page-btn ${p === safePage ? "active" : ""}`} onClick={() => setCurrentPage(p)}>{p}</button>
                  ))}
                  <button className="ms-page-btn" disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>›</button>
                </div>
              )}
            </div>
            <div className="ms-modal-footer">
              <button className="ms-btn-secondary" onClick={() => setActiveModal(null)}>Close</button>
              <button className="ms-btn-primary" onClick={() => { setActiveModal(null); setPage("addWaste"); }}>＋ Log Waste</button>
            </div>
          </div>
        </div>
      )}

      {/* Record Detail */}
      {activeModal === "recordDetail" && selectedRecord && (
        <div className="ms-modal-backdrop" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true" aria-label="Record Details">
          <div className="ms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header">
              <div className="ms-modal-header-left"><div className="ms-modal-header-icon">📋</div><div><h3>Waste Record Details</h3><p>ID: {selectedRecord.id}</p></div></div>
              <button className="ms-modal-close" onClick={() => setActiveModal(null)} aria-label="Close">✕</button>
            </div>
            <div className="ms-modal-body">
              <div className="ms-detail-layout">
                <div className="ms-detail-info-grid">
                  {[["Facility", selectedRecord.hospital || HOSPITAL_NAME], ["Waste Type", selectedRecord.wasteType || "Biomedical Waste"], ["Category", selectedRecord.category || "Mixed"], ["Net Weight", formatWeight(selectedRecord.weight)], ["Date Logged", formatDate(selectedRecord.createdAt || selectedRecord.date || selectedRecord.timestamp)], ["Status", selectedRecord.status || "Logged"]].map(([l, v]) => (
                    <div className="ms-detail-field" key={l}><label>{l}</label><span>{v}</span></div>
                  ))}
                </div>
                <div className="ms-detail-qr-box">
                  <QRCodeCanvas value={`${QR_BASE_URL}/${selectedRecord.id}`} size={110} bgColor={darkMode ? "#1a2332" : "#ffffff"} fgColor={darkMode ? "#e2e8f0" : "#0f172a"} level="H" />
                  <small style={{ color: "var(--text-muted)", fontSize: 10 }}>Scannable ID</small>
                </div>
              </div>
            </div>
            <div className="ms-modal-footer">
              <button className="ms-btn-secondary" onClick={() => handleEditRecord(selectedRecord)}>✏️ Edit</button>
              <button className="ms-btn-secondary" onClick={() => { setSelectedRecord(selectedRecord); setActiveModal("qrSlip"); setTimeout(() => window.print(), 300); }}>🖨️ Print Slip</button>
              <button className="ms-btn-primary" onClick={() => setActiveModal(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record */}
      {activeModal === "editRecord" && selectedRecord && (
        <div className="ms-modal-backdrop" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true" aria-label="Edit Record">
          <div className="ms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header">
              <div className="ms-modal-header-left"><div className="ms-modal-header-icon">✏️</div><div><h3>Edit Waste Record</h3><p>ID: {selectedRecord.id.slice(0, 12)}…</p></div></div>
              <button className="ms-modal-close" onClick={() => setActiveModal(null)} aria-label="Close">✕</button>
            </div>
            <div className="ms-modal-body">
              <div className="ms-edit-field"><label>Waste Type</label><input type="text" value={editForm.wasteType || ""} onChange={(e) => setEditForm({ ...editForm, wasteType: e.target.value })} /></div>
              <div className="ms-edit-field"><label>Category</label>
                <select value={editForm.category || "Mixed"} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                  <option value="Yellow">Yellow (Infectious)</option><option value="Red">Red (Contaminated)</option><option value="White">White (Sharps)</option><option value="Blue">Blue (Glassware)</option><option value="Mixed">Mixed</option>
                </select>
              </div>
              <div className="ms-edit-field"><label>Weight (kg)</label><input type="number" min="0" step="0.1" value={editForm.weight || ""} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} /></div>
            </div>
            <div className="ms-modal-footer">
              <button className="ms-btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="ms-btn-danger" onClick={() => handleDeleteRecord(selectedRecord)}>🗑️ Delete</button>
              <button className="ms-btn-primary" onClick={handleSaveEdit}>💾 Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* BMW Guidelines */}
      {activeModal === "guidelines" && (
        <div className="ms-modal-backdrop" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true" aria-label="BMW Guidelines">
          <div className="ms-modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header">
              <div className="ms-modal-header-left"><div className="ms-modal-header-icon">📖</div><div><h3>BMW Segregation Guidelines</h3><p>Ministry of Environment, Forest &amp; Climate Change (BMW Rules 2016)</p></div></div>
              <button className="ms-modal-close" onClick={() => setActiveModal(null)} aria-label="Close">✕</button>
            </div>
            <div className="ms-modal-body">
              <div className="ms-guidelines-grid">
                {[
                  { cls: "yellow", badge: "YELLOW BAG", title: "Infectious & Anatomical", items: ["Human anatomical tissues, organs, body parts", "Items soiled with blood, cotton, dressings", "Expired/contaminated medicines", "Treatment: Incineration / Plasma Pyrolysis"] },
                  { cls: "red", badge: "RED BAG", title: "Contaminated Plastic", items: ["Tubing, IV sets, bottles", "Catheters, urine bags, syringes (no needle)", "Gloves, speculums, aprons", "Treatment: Autoclaving + Shredding"] },
                  { cls: "white", badge: "WHITE CONTAINER", title: "Sharps & Needles", items: ["Needles, syringes with fixed needle", "Scalpels, surgical blades", "Puncture-proof container required", "Treatment: Autoclave + Shredding"] },
                  { cls: "blue", badge: "BLUE BOX", title: "Glassware & Implants", items: ["Glass ampoules, vials, test tubes", "Metallic implants, orthopedic pins", "Cardboard box with blue marking", "Treatment: Disinfection / Autoclaving"] },
                ].map((g) => (
                  <div className={`ms-guide-card ${g.cls}`} key={g.cls}>
                    <div className="ms-guide-card-head"><span className="ms-guide-badge">{g.badge}</span><strong>{g.title}</strong></div>
                    <ul className="ms-guide-list">{g.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="ms-modal-footer"><button className="ms-btn-primary" onClick={() => setActiveModal(null)}>Understood</button></div>
          </div>
        </div>
      )}

      {/* Hospital Profile */}
      {activeModal === "profile" && (
        <div className="ms-modal-backdrop" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true" aria-label="Hospital Profile">
          <div className="ms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header"><div className="ms-modal-header-left"><div className="ms-modal-header-icon">🏥</div><div><h3>Hospital Profile</h3><p>AAROGYA Multispecialty Healthcare, Bhubaneswar</p></div></div><button className="ms-modal-close" onClick={() => setActiveModal(null)} aria-label="Close">✕</button></div>
            <div className="ms-modal-body">
              <div className="ms-detail-info-grid">
                {[["Facility", HOSPITAL_NAME], ["Location", "Bhubaneswar, Odisha"], ["Accreditation", "NABH Level 3 / ISO 14001"], ["BMW Auth No.", "BMW-OD-2024-8841A"], ["Nodal Officer", "Dr. S. K. Roy"], ["Month's Waste", formatWeight(collectedThisMonth)], ["Compliance", `${complianceRate}%`]].map(([l, v]) => (
                  <div className="ms-detail-field" key={l}><label>{l}</label><span>{v}</span></div>
                ))}
              </div>
            </div>
            <div className="ms-modal-footer"><button className="ms-btn-primary" onClick={() => setActiveModal(null)}>Close</button></div>
          </div>
        </div>
      )}

      {/* Settings */}
      {activeModal === "settings" && (
        <div className="ms-modal-backdrop" onClick={() => setActiveModal(null)} role="dialog" aria-modal="true" aria-label="Settings">
          <div className="ms-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ms-modal-header"><div className="ms-modal-header-left"><div className="ms-modal-header-icon">⚙</div><div><h3>Dashboard Settings</h3><p>Preferences for AAROGYA Hospital</p></div></div><button className="ms-modal-close" onClick={() => setActiveModal(null)} aria-label="Close">✕</button></div>
            <div className="ms-modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="ms-detail-field">
                  <label>Theme</label>
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button className={`ms-filter-pill ${!darkMode ? "active" : ""}`} onClick={() => setDarkMode(false)}>☀️ Light</button>
                    <button className={`ms-filter-pill ${darkMode ? "active" : ""}`} onClick={() => setDarkMode(true)}>🌙 Dark</button>
                  </div>
                </div>
                <div className="ms-detail-field"><label>High Infectious Waste Threshold</label><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Alert when Yellow ≥ <strong>50%</strong> of weekly total.</span></div>
                <div className="ms-detail-field"><label>Real-time Sync</label><span style={{ fontSize: 13, color: "#16a34a" }}>✓ Active (Firestore OnSnapshot)</span></div>
                <div className="ms-detail-field"><label>Disposal Slip Template</label><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Standard CPCB Form IV</span></div>
              </div>
            </div>
            <div className="ms-modal-footer"><button className="ms-btn-primary" onClick={() => { showToast("success", "Settings Saved"); setActiveModal(null); }}>Save</button></div>
          </div>
        </div>
      )}

      {/* Print Slip */}
      <div className="ms-print-slip">
        <div className="ms-print-slip-box">
          <div className="ms-print-header"><h2>🏥 {HOSPITAL_NAME}</h2><p style={{ margin: 0, fontSize: 12 }}>Biomedical Waste Disposal Manifest</p></div>
          <table className="ms-print-table"><tbody>
            {[["Record ID", selectedRecord?.id || "N/A"], ["Waste Type", selectedRecord?.wasteType || "Biomedical Waste"], ["Category", selectedRecord?.category || "Mixed"], ["Weight", `${selectedRecord?.weight || 0} kg`], ["Date", new Date().toLocaleDateString("en-IN")], ["Time", new Date().toLocaleTimeString("en-IN")], ["Compliance", "BMW Rules 2016"]].map(([k, v]) => (
              <tr key={k}><td><strong>{k}:</strong></td><td>{v}</td></tr>
            ))}
          </tbody></table>
          <div className="ms-print-qr"><QRCodeCanvas value={`${QR_BASE_URL}/${selectedRecord?.id || "AAROGYA-001"}`} size={120} bgColor="#ffffff" fgColor="#000000" level="H" /></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, fontSize: 11 }}>
            <div><p style={{ margin: "0 0 24px" }}>Staff Signature</p><div style={{ borderBottom: "1px solid #000", width: 140 }} /></div>
            <div><p style={{ margin: "0 0 24px" }}>Driver Signature</p><div style={{ borderBottom: "1px solid #000", width: 140 }} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HospitalDashboard;
