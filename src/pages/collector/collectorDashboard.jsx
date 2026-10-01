import "./CollectorDashboard.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { QRCodeCanvas } from "qrcode.react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getRequestDate(request) {
  return (
    toDate(request.requestedAt) ||
    toDate(request.createdAt) ||
    toDate(request.pickupDate) ||
    toDate(request.date)
  );
}

function getCompletionDate(record) {
  return (
    toDate(record.collectedAt) ||
    toDate(record.completedAt) ||
    toDate(record.updatedAt) ||
    toDate(record.requestedAt) ||
    toDate(record.createdAt)
  );
}

function normalizeStatus(status) {
  const value = String(status || "Pending").trim().toLowerCase();

  if (value === "in transit" || value === "in_transit") return "In Transit";
  if (value === "collected" || value === "completed") return "Collected";

  return "Pending";
}

function isSameDay(dateA, dateB) {
  return (
    dateA &&
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function isSameMonth(dateA, dateB) {
  return (
    dateA &&
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth()
  );
}

function getWeight(record) {
  const value = Number(record?.weight);
  return Number.isFinite(value) ? value : 0;
}

function formatDate(value) {
  const date = toDate(value);
  return date
    ? date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";
}

function formatWeight(value) {
  const w = Number(value);
  return `${Number.isFinite(w) ? w.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0"} kg`;
}

// ─── Toast System ─────────────────────────────────────────────────────────────

let toastCounter = 0;

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const colors = {
    success: "#059669",
    error: "#dc2626",
    warning: "#d97706",
    info: "#2563eb",
  };
  return (
    <div className="cd-toast-stack">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="cd-toast-item"
          style={{ borderLeft: `4px solid ${colors[t.type] || colors.info}` }}
        >
          <span className="cd-toast-icon">{icons[t.type] || icons.info}</span>
          <div style={{ flex: 1 }}>
            <p className="cd-toast-title">{t.title}</p>
            {t.detail && <p className="cd-toast-detail">{t.detail}</p>}
          </div>
          <button
            className="cd-toast-close"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

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
    <span className="cd-anim-number">
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="cd-skeleton-card">
      <div className="cd-skeleton cd-skeleton-icon" />
      <div style={{ flex: 1 }}>
        <div className="cd-skeleton cd-skeleton-text" />
        <div className="cd-skeleton cd-skeleton-small" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function CollectorDashboard({ onBackToHome }) {
  const [activeView, setActiveView] = useState("Dashboard");
  const [pickupRequests, setPickupRequests] = useState([]);
  const [wasteBatches, setWasteBatches] = useState([]);
  const [scannedWaste, setScannedWaste] = useState(null);
  const [collectorLocation, setCollectorLocation] = useState(null);
  const [firebaseError, setFirebaseError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [toasts, setToasts] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedCollector = localStorage.getItem("ms-collector-dark");
      if (savedCollector !== null) return savedCollector === "1";
      const savedGlobal = localStorage.getItem("ms-dark");
      if (savedGlobal !== null) return savedGlobal === "1";
      return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    } catch {
      return false;
    }
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile drawer
  const [gpsAutoTrack, setGpsAutoTrack] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const scannerRef = useRef(null);

  // Category & Sorting
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Live Network connectivity
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "urgent",
      title: "Urgent Yellow Biohazard",
      desc: "Apollo Clinic has 14.5 kg infectious waste pending > 4 hours.",
      time: "10m ago",
      read: false,
    },
    {
      id: 2,
      type: "route",
      title: "Route Schedule Updated",
      desc: "AIIMS Ward 3 pickup added to Bhubaneswar Central corridor.",
      time: "30m ago",
      read: false,
    },
    {
      id: 3,
      type: "system",
      title: "Vehicle Payload Calibrated",
      desc: "Max payload limit confirmed at 500 kg for OD-02-AK-9412.",
      time: "2h ago",
      read: true,
    },
  ]);

  // Digital Handover & Signature Modal
  const [handoverModal, setHandoverModal] = useState(null);
  const [staffName, setStaffName] = useState("");
  const [staffDesignation, setStaffDesignation] = useState("Bio-Medical Waste Officer");
  const [hasSigned, setHasSigned] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef(null);

  // CPCB Manifest Modal
  const [manifestModal, setManifestModal] = useState(null);

  // Manual QR input & batch scanning
  const [manualQrInput, setManualQrInput] = useState("");
  const [batchScannedList, setBatchScannedList] = useState([]);

  // Layout view mode (detailed cards vs compact list)
  const [cardLayout, setCardLayout] = useState("detailed");

  // Emergency Incident / Spill Modal
  const [incidentModal, setIncidentModal] = useState(null);
  const [incidentType, setIncidentType] = useState("Spill / Leakage");
  const [incidentSeverity, setIncidentSeverity] = useState("High");
  const [incidentDesc, setIncidentDesc] = useState("");
  const [isSubmittingIncident, setIsSubmittingIncident] = useState(false);

  // Web Audio Synthesizer sound effects
  const playScanSound = useCallback(() => {
    if (!soundAlerts) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio context might be restricted
    }
  }, [soundAlerts]);

  const playSuccessChime = useCallback(() => {
    if (!soundAlerts) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        const startTime = ctx.currentTime + i * 0.07;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);
        osc.start(startTime);
        osc.stop(startTime + 0.32);
      });
    } catch {
      // Audio context might be restricted
    }
  }, [soundAlerts]);

  const playAlertTone = useCallback(() => {
    if (!soundAlerts) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(260, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // Audio context might be restricted
    }
  }, [soundAlerts]);

  // Toast helpers
  const addToast = useCallback((type, title, detail) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, type, title, detail }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Dark mode synchronization & persistence
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-collector-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("ms-collector-dark", darkMode ? "1" : "0");
      localStorage.setItem("ms-dark", darkMode ? "1" : "0");
    } catch {
      // ignore
    }
  }, [darkMode]);

  // Firebase subscriptions
  useEffect(() => {
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded >= 2) setLoading(false);
    };

    const pickupQuery = query(
      collection(db, "pickupRequests"),
      orderBy("requestedAt", "desc")
    );

    const unsubscribePickups = onSnapshot(
      pickupQuery,
      (snapshot) => {
        setPickupRequests(
          snapshot.docs.map((pickupDoc) => ({
            id: pickupDoc.id,
            ...pickupDoc.data(),
          }))
        );
        setFirebaseError("");
        checkLoaded();
      },
      (error) => {
        console.error("Error loading pickup requests:", error);
        setFirebaseError(
          "Could not load pickup requests. Check your Firebase connection and permissions."
        );
        checkLoaded();
      }
    );

    const unsubscribeBatches = onSnapshot(
      collection(db, "wasteBatches"),
      (snapshot) => {
        setWasteBatches(
          snapshot.docs.map((batchDoc) => ({
            id: batchDoc.id,
            ...batchDoc.data(),
          }))
        );
        checkLoaded();
      },
      (error) => {
        console.error("Error loading waste batches:", error);
        setFirebaseError(
          "Could not load waste batches. Check your Firebase connection and permissions."
        );
        checkLoaded();
      }
    );

    return () => {
      unsubscribePickups();
      unsubscribeBatches();

      if (scannerRef.current) {
        scannerRef.current.clear().catch((error) => {
          console.warn("Could not clear QR scanner:", error);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  const today = new Date();

  const pendingPickups = useMemo(
    () =>
      pickupRequests.filter(
        (request) => normalizeStatus(request.status) === "Pending"
      ).length,
    [pickupRequests]
  );

  const inTransitPickups = useMemo(
    () =>
      pickupRequests.filter(
        (request) => normalizeStatus(request.status) === "In Transit"
      ).length,
    [pickupRequests]
  );

  const todaysPickups = useMemo(
    () =>
      pickupRequests.filter((request) =>
        isSameDay(getRequestDate(request), today)
      ).length,
    [pickupRequests]
  );

  const completedThisMonth = useMemo(
    () =>
      pickupRequests.filter(
        (request) =>
          normalizeStatus(request.status) === "Collected" &&
          isSameMonth(getCompletionDate(request), today)
      ).length,
    [pickupRequests]
  );

  const wasteCollectedThisMonth = useMemo(
    () =>
      wasteBatches
        .filter(
          (batch) =>
            normalizeStatus(batch.status) === "Collected" &&
            isSameMonth(getCompletionDate(batch), today)
        )
        .reduce((total, batch) => total + getWeight(batch), 0),
    [wasteBatches]
  );

  // Online / Offline network listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast("success", "Back Online", "Connected to Firestore network.");
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast("warning", "Offline Mode", "Operating locally. Actions will sync when online.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [addToast]);

  // Vehicle payload capacity
  const currentPayload = useMemo(() => {
    return pickupRequests
      .filter((req) => normalizeStatus(req.status) === "In Transit")
      .reduce((sum, req) => sum + getWeight(req), 0);
  }, [pickupRequests]);

  const maxPayload = 500; // 500 kg max vehicle payload
  const payloadPercent = Math.min(Math.round((currentPayload / maxPayload) * 100), 100);

  // Filtered & sorted pickups
  const filteredPickups = useMemo(() => {
    const result = pickupRequests.filter((req) => {
      const status = normalizeStatus(req.status);
      if (statusFilter !== "All" && status !== statusFilter) return false;
      if (categoryFilter !== "All") {
        const cat = String(req.category || "").toLowerCase();
        if (!cat.includes(categoryFilter.toLowerCase())) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hospital = String(req.hospital || "").toLowerCase();
        const category = String(req.category || "").toLowerCase();
        if (!hospital.includes(q) && !category.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          (getRequestDate(a)?.getTime() || 0) - (getRequestDate(b)?.getTime() || 0)
      );
    } else if (sortBy === "heaviest") {
      result.sort((a, b) => getWeight(b) - getWeight(a));
    } else if (sortBy === "hospital") {
      result.sort((a, b) =>
        String(a.hospital || "").localeCompare(String(b.hospital || ""))
      );
    } else {
      // newest first
      result.sort(
        (a, b) =>
          (getRequestDate(b)?.getTime() || 0) - (getRequestDate(a)?.getTime() || 0)
      );
    }

    return result;
  }, [pickupRequests, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Category counts for quick filter buttons
  const categoryCounts = useMemo(() => {
    const counts = { All: pickupRequests.length, Yellow: 0, Red: 0, Blue: 0, White: 0 };
    pickupRequests.forEach((req) => {
      const cat = String(req.category || "").toLowerCase();
      if (cat.includes("yellow")) counts.Yellow++;
      else if (cat.includes("red")) counts.Red++;
      else if (cat.includes("blue")) counts.Blue++;
      else if (cat.includes("white")) counts.White++;
    });
    return counts;
  }, [pickupRequests]);

  // Waste Stream Analytics for Reports
  const wasteStreamBreakdown = useMemo(() => {
    const totals = {
      yellow: { label: "Yellow (Infectious)", weight: 0, method: "Incineration / Deep Burial", color: "#eab308" },
      red: { label: "Red (Plastics / Tubing)", weight: 0, method: "Autoclaving & Shredding", color: "#ef4444" },
      blue: { label: "Blue (Glassware / Vials)", weight: 0, method: "Disinfection & Autoclaving", color: "#3b82f6" },
      white: { label: "White (Sharps & Blades)", weight: 0, method: "Sharp Pit / Encapsulation", color: "#94a3b8" },
    };

    const source = wasteBatches.length > 0 ? wasteBatches : pickupRequests;
    source.forEach((item) => {
      const cat = String(item.category || item.wasteType || "").toLowerCase();
      const w = Number(item.weight) || 0;
      if (cat.includes("yellow")) totals.yellow.weight += w;
      else if (cat.includes("red")) totals.red.weight += w;
      else if (cat.includes("blue")) totals.blue.weight += w;
      else if (cat.includes("white")) totals.white.weight += w;
      else totals.yellow.weight += w;
    });

    const totalWeight = Object.values(totals).reduce((sum, s) => sum + s.weight, 0) || 1;
    return {
      totals,
      totalWeight,
      yellowPct: Math.round((totals.yellow.weight / totalWeight) * 100),
      redPct: Math.round((totals.red.weight / totalWeight) * 100),
      bluePct: Math.round((totals.blue.weight / totalWeight) * 100),
      whitePct: Math.round((totals.white.weight / totalWeight) * 100),
    };
  }, [wasteBatches, pickupRequests]);

  // Emergency Incident & Biohazard Spill Submission
  async function submitIncident() {
    if (!incidentModal) return;
    setIsSubmittingIncident(true);
    try {
      const incidentData = {
        type: incidentType,
        severity: incidentSeverity,
        description: incidentDesc.trim() || "Biohazard containment alert logged by collector driver.",
        hospital: incidentModal.hospital || "Route Corridor Transit",
        pickupId: incidentModal.id || null,
        reportedAt: new Date(),
        location: collectorLocation || null,
        collector: "Field Operator (Vehicle OD-02-AK-9412)",
        status: "Active",
      };

      await addDoc(collection(db, "incidents"), incidentData);
      playAlertTone();
      addToast(
        "warning",
        "Emergency Logged",
        `${incidentType} (${incidentSeverity}) reported to Central Dispatch.`
      );

      setNotifications((prev) => [
        {
          id: Date.now(),
          type: "urgent",
          title: `⚠️ Alert: ${incidentType}`,
          desc: `${incidentModal.hospital || "Transit"}: ${incidentDesc || "Incident logged"}`,
          time: "Just now",
          read: false,
        },
        ...prev,
      ]);

      setIncidentModal(null);
      setIncidentDesc("");
    } catch (err) {
      console.error("Error submitting incident:", err);
      addToast("error", "Submission Failed", "Could not log incident to Firebase.");
    } finally {
      setIsSubmittingIncident(false);
    }
  }

  // Turn-by-turn Navigation
  function openNavigation(hospitalName, coordinates) {
    let dest;
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      dest = `${coordinates.latitude},${coordinates.longitude}`;
    } else if (coordinates && coordinates.lat && coordinates.lng) {
      dest = `${coordinates.lat},${coordinates.lng}`;
    } else {
      const cleanName = hospitalName || "Hospital";
      const queryName = /bhubaneswar|odisha|cuttack/i.test(cleanName)
        ? cleanName
        : `${cleanName}, Bhubaneswar, Odisha`;
      dest = encodeURIComponent(queryName);
    }
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
      "_blank",
      "noopener,noreferrer"
    );
    addToast("info", "Opening Maps", `Navigating to ${hospitalName || "Hospital"} in Bhubaneswar`);
  }

  // Export collection log as CSV
  function exportPickupLog() {
    if (!pickupRequests.length) {
      addToast("warning", "No Data", "No pickup records available to export.");
      return;
    }
    const headers = [
      "Pickup ID",
      "Hospital",
      "Category",
      "Weight (kg)",
      "Status",
      "Date",
      "Time",
    ];
    const rows = pickupRequests.map((p) => {
      const d = getRequestDate(p);
      return [
        `"${p.id || ""}"`,
        `"${p.hospital || "Hospital"}"`,
        `"${p.category || "Mixed"}"`,
        getWeight(p),
        `"${normalizeStatus(p.status)}"`,
        `"${d ? d.toLocaleDateString("en-IN") : "—"}"`,
        `"${d ? d.toLocaleTimeString("en-IN") : "—"}"`,
      ];
    });
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `MediSort_Pickup_Log_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("success", "Export Complete", "Downloaded pickup log as CSV.");
  }

  // Digital Signature Canvas Drawing
  function startDrawing(e) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = darkMode ? "#34d399" : "#0f9d6e";
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasSigned(true);
  }

  function draw(e) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function startTouchDrawing(e) {
    if (!e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = darkMode ? "#34d399" : "#0f9d6e";
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
    setHasSigned(true);
  }

  function drawTouch(e) {
    if (!isDrawing || !e.touches || !e.touches[0]) return;
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
    e.preventDefault();
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  }

  async function completeHandover(request) {
    let sigData = null;
    if (canvasRef.current && hasSigned) {
      sigData = canvasRef.current.toDataURL("image/png");
    }

    try {
      const updates = {
        status: "Collected",
        collectedAt: new Date(),
        staffName: staffName.trim() || "Hospital Ward In-charge",
        staffDesignation: staffDesignation.trim() || "Bio-Medical Waste Officer",
      };
      if (sigData) updates.signature = sigData;
      if (collectorLocation) {
        updates.collectedLocation = collectorLocation;
      }

      await updateDoc(doc(db, "pickupRequests", request.id), updates);
      addToast(
        "success",
        "Handover Completed",
        `CPCB Form IV manifest issued for ${request.hospital || "Hospital"}.`
      );

      const finishedRecord = { ...request, ...updates };
      setHandoverModal(null);
      setManifestModal(finishedRecord);
      setStaffName("");
      setHasSigned(false);
    } catch (err) {
      console.error("Error completing handover:", err);
      addToast("error", "Handover Error", "Could not complete digital handover.");
    }
  }

  // Manual QR input search
  async function searchManualQr() {
    const code = manualQrInput.trim();
    if (!code) {
      addToast("warning", "Enter Code", "Please enter a valid QR or Barcode ID.");
      return;
    }

    try {
      const wasteQuery = query(
        collection(db, "wasteBatches"),
        where("qrId", "==", code)
      );
      const snapshot = await getDocs(wasteQuery);
      if (snapshot.empty) {
        addToast("error", "Batch Not Found", `No batch found for ID: ${code}`);
        return;
      }
      const batchDoc = snapshot.docs[0];
      const batchData = batchDoc.data();
      const loaded = {
        id: batchDoc.id,
        qrId: batchData.qrId || code,
        hospital: batchData.hospital || "",
        wasteType: batchData.wasteType || "",
        category: batchData.category || "Mixed",
        weight: Number(batchData.weight) || 0,
        status: batchData.status || "Pending",
        createdAt: batchData.createdAt || null,
        ...batchData,
      };
      setScannedWaste(loaded);
      setManualQrInput("");
      addToast("success", "QR Code Found", `Loaded batch ${code}`);
    } catch (err) {
      console.error("Error querying manual QR:", err);
      addToast("error", "Search Error", "Could not verify code.");
    }
  }

  // Batch multi-bag list helpers
  function addToBatchList(item) {
    if (!item) return;
    if (batchScannedList.some((b) => b.qrId === item.qrId)) {
      addToast("warning", "Already Added", "This bag is already in the batch list.");
      return;
    }
    setBatchScannedList((prev) => [...prev, item]);
    addToast(
      "info",
      "Bag Added",
      `Added ${item.qrId} (${formatWeight(item.weight)}) to batch.`
    );
  }

  function removeFromBatchList(qrId) {
    setBatchScannedList((prev) => prev.filter((b) => b.qrId !== qrId));
  }

  async function updateAllBatchStatus(newStatus) {
    if (!batchScannedList.length) return;
    try {
      for (const item of batchScannedList) {
        await updateDoc(doc(db, "wasteBatches", item.id), {
          status: newStatus,
          updatedAt: new Date(),
        });
      }
      addToast(
        "success",
        "Batch Updated",
        `Marked ${batchScannedList.length} bags as ${newStatus}.`
      );
      setBatchScannedList([]);
      setScannedWaste(null);
    } catch (err) {
      console.error("Batch update error:", err);
      addToast("error", "Batch Error", "Could not update all items in batch.");
    }
  }

  function getCollectorLocation() {
    if (!navigator.geolocation) {
      addToast("error", "GPS Not Supported", "This browser does not support GPS.");
      return;
    }

    addToast("info", "Locating...", "Fetching your GPS position.");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCollectorLocation({ latitude, longitude });
        addToast(
          "success",
          "Location Found",
          `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
        );
      },
      (error) => {
        console.error("GPS error:", error);
        if (error.code === 1) {
          addToast("error", "Permission Denied", "Location access was blocked.");
        } else if (error.code === 2) {
          addToast("error", "Unavailable", "Location could not be determined.");
        } else {
          addToast("error", "GPS Error", "Unable to get your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  async function updatePickupStatus(request, newStatus) {
    const currentStatus = normalizeStatus(request.status);
    const allowedNextStatus =
      currentStatus === "Pending"
        ? "In Transit"
        : currentStatus === "In Transit"
          ? "Collected"
          : null;

    if (!allowedNextStatus) {
      addToast("warning", "Already Collected", "This pickup has already been collected.");
      return;
    }

    if (newStatus !== allowedNextStatus) {
      addToast(
        "warning",
        "Invalid Transition",
        `Status must move from ${currentStatus} to ${allowedNextStatus}.`
      );
      return;
    }

    // If moving to "Collected", trigger Digital Handover & Signature modal!
    if (newStatus === "Collected") {
      setHandoverModal(request);
      return;
    }

    try {
      const updates = { status: newStatus };
      await updateDoc(doc(db, "pickupRequests", request.id), updates);
      addToast("success", "Status Updated", `Pickup marked as ${newStatus}.`);
    } catch (error) {
      console.error("Error updating pickup status:", error);
      addToast("error", "Update Failed", "Could not update pickup status.");
    }
  }

  async function updateScannedWasteStatus(newStatus) {
    if (!scannedWaste?.qrId) {
      addToast("warning", "No Scan", "No waste batch has been scanned.");
      return;
    }

    const currentStatus = normalizeStatus(scannedWaste.status);
    const allowedNextStatus =
      currentStatus === "Pending"
        ? "In Transit"
        : currentStatus === "In Transit"
          ? "Collected"
          : null;

    if (!allowedNextStatus) {
      addToast("warning", "Already Collected", "This waste batch has already been collected.");
      return;
    }

    if (newStatus !== allowedNextStatus) {
      addToast(
        "warning",
        "Invalid Transition",
        `Waste status must move from ${currentStatus} to ${allowedNextStatus}.`
      );
      return;
    }

    try {
      const wasteQuery = query(
        collection(db, "wasteBatches"),
        where("qrId", "==", scannedWaste.qrId)
      );
      const snapshot = await getDocs(wasteQuery);

      if (snapshot.empty) {
        addToast("error", "Not Found", "Waste batch not found in database.");
        return;
      }

      const wasteDoc = snapshot.docs[0];
      const updates = { status: newStatus };

      if (newStatus === "Collected") {
        updates.collectedAt = new Date();
      }

      await updateDoc(doc(db, "wasteBatches", wasteDoc.id), updates);
      setScannedWaste((previous) => ({ ...previous, ...updates }));
      addToast("success", "Waste Updated", `Waste batch marked as ${newStatus}.`);
    } catch (error) {
      console.error("Status update error:", error);
      addToast("error", "Update Failed", "Failed to update waste status.");
    }
  }

  function startQRScanner() {
    // Clear any existing scanner first
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        try {
          let qrId = String(decodedText || "").trim();

          try {
            if (qrId.startsWith("http://") || qrId.startsWith("https://")) {
              const url = new URL(qrId);
              const possibleQrId =
                url.searchParams.get("qrId") || url.searchParams.get("id");
              if (possibleQrId) {
                qrId = possibleQrId.trim();
              } else {
                const pathParts = url.pathname.split("/").filter(Boolean);
                if (pathParts.length > 0) {
                  qrId = pathParts[pathParts.length - 1].trim();
                }
              }
            }
          } catch {
            console.log("QR is not a URL. Using normal QR ID.");
          }

          if (!qrId) {
            addToast("error", "Invalid QR", "Please scan a valid MediSort waste QR.");
            return;
          }

          const wasteQuery = query(
            collection(db, "wasteBatches"),
            where("qrId", "==", qrId)
          );

          const snapshot = await getDocs(wasteQuery);

          if (snapshot.empty) {
            addToast(
              "error",
              "Not Found",
              `No waste batch found for QR ID: ${qrId}`
            );
            return;
          }

          const batchDoc = snapshot.docs[0];
          const batchData = batchDoc.data();

          setScannedWaste({
            id: batchDoc.id,
            qrId: batchData.qrId || qrId,
            hospital: batchData.hospital || "",
            wasteType: batchData.wasteType || "",
            category: batchData.category || "Mixed",
            weight: Number(batchData.weight) || 0,
            status: batchData.status || "Pending",
            createdAt: batchData.createdAt || null,
            ...batchData,
          });

          await scanner.clear();
          scannerRef.current = null;

          addToast("success", "QR Verified", "Waste batch found and loaded.");
        } catch (error) {
          console.error("Error finding waste batch:", error);
          addToast(
            "error",
            "Scan Failed",
            "Failed to load waste batch from Firebase."
          );
        }
      },
      (errorMessage) => {
        console.log("QR scanner:", errorMessage);
      }
    );
  }

  // ─── Status Badge Helper ──────────────────────────────────────────────────

  function StatusBadge({ status }) {
    const s = normalizeStatus(status);
    const config = {
      Pending: { cls: "pending", icon: "⏳" },
      "In Transit": { cls: "in-transit", icon: "🚚" },
      Collected: { cls: "collected", icon: "✅" },
    };
    const { cls, icon } = config[s] || config.Pending;
    return (
      <span className={`cd-status-badge ${cls}`}>
        {icon} {s}
      </span>
    );
  }

  // ─── Pickup Card ──────────────────────────────────────────────────────────

  function renderPickupList() {
    if (loading) {
      return (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      );
    }

    if (filteredPickups.length === 0) {
      return (
        <div className="cd-empty-state">
          <div className="cd-empty-icon">📭</div>
          <h3>No Pickups Found</h3>
          <p>
            {searchQuery || statusFilter !== "All"
              ? "Try adjusting your search or filter."
              : "No pickup requests available yet."}
          </p>
        </div>
      );
    }

    if (cardLayout === "compact") {
      return (
        <div className="cd-compact-table-wrap">
          <div className="cd-compact-list">
            {filteredPickups.map((request) => {
              const status = normalizeStatus(request.status);
              const nextStatus =
                status === "Pending"
                  ? "In Transit"
                  : status === "In Transit"
                    ? "Collected"
                    : null;
              const reqDate = getRequestDate(request);
              const statusCls =
                status === "Pending"
                  ? "pending"
                  : status === "In Transit"
                    ? "in-transit"
                    : "collected";
              const waitHours = reqDate
                ? Math.max(0, Math.floor((Date.now() - reqDate.getTime()) / (1000 * 60 * 60)))
                : 0;
              const isUrgent = status === "Pending" && waitHours >= 2;

              return (
                <div key={request.id} className={`cd-compact-row ${statusCls} ${isUrgent ? "urgent-row" : ""}`}>
                  <div className="cd-compact-main">
                    <div className="cd-compact-title">
                      <strong>{request.hospital || "Hospital Facility"}</strong>
                      {isUrgent && <span className="cd-urgent-badge">⚠️ &gt;2h</span>}
                    </div>
                    <div className="cd-compact-sub">
                      <span>{reqDate ? formatDate(reqDate) : "Today"}</span>
                      <span>•</span>
                      <span className="cd-cat-indicator">{request.category || "Mixed"}</span>
                      <span>•</span>
                      <strong>{formatWeight(request.weight)}</strong>
                    </div>
                  </div>

                  <div className="cd-compact-actions">
                    <button
                      type="button"
                      className="cd-compact-nav-btn"
                      onClick={() => openNavigation(request.hospital, request.location || request.coordinates)}
                      title="Navigate"
                    >
                      🗺️
                    </button>

                    <button
                      type="button"
                      className="cd-compact-incident-btn"
                      onClick={() => setIncidentModal(request)}
                      title="Report Incident"
                    >
                      ⚠️
                    </button>

                    {nextStatus && (
                      <button
                        type="button"
                        className={`cd-compact-status-btn ${nextStatus === "In Transit" ? "transit" : "collected"}`}
                        onClick={() => updatePickupStatus(request, nextStatus)}
                      >
                        {nextStatus === "In Transit" ? "🚚 Transit" : "✅ Collect"}
                      </button>
                    )}

                    {!nextStatus && (
                      <button
                        type="button"
                        className="cd-compact-manifest-btn"
                        onClick={() => setManifestModal(request)}
                        title="View Form IV Manifest"
                      >
                        📄 Form IV
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return filteredPickups.map((request) => {
      const status = normalizeStatus(request.status);
      const nextStatus =
        status === "Pending"
          ? "In Transit"
          : status === "In Transit"
            ? "Collected"
            : null;

      const reqDate = getRequestDate(request);
      const statusCls =
        status === "Pending"
          ? "pending"
          : status === "In Transit"
            ? "in-transit"
            : "collected";

      const waitHours = reqDate
        ? Math.max(0, Math.floor((Date.now() - reqDate.getTime()) / (1000 * 60 * 60)))
        : 0;
      const isUrgent = status === "Pending" && waitHours >= 2;

      const categoryName = request.category || "Mixed";
      const catLower = categoryName.toLowerCase();
      const catEmoji =
        catLower.includes("yellow") ? "🟡" :
        catLower.includes("red") ? "🔴" :
        catLower.includes("blue") ? "🔵" :
        catLower.includes("white") ? "⚪" : "📦";

      return (
        <div className={`cd-pickup-card border-${statusCls} ${isUrgent ? "urgent-card" : ""}`} key={request.id}>
          {/* Card Accent Top Light Stripe */}
          <div className={`cd-pickup-accent-bar ${statusCls}`} />

          {/* Top row: Hospital info & Status */}
          <div className="cd-pickup-header">
            <div className="cd-pickup-facility">
              <div className={`cd-pickup-icon ${statusCls}`}>
                <span>🏥</span>
              </div>
              <div className="cd-facility-meta">
                <div className="cd-facility-title-group">
                  <h3 className="cd-facility-name">{request.hospital || "Hospital Facility"}</h3>
                  {isUrgent && (
                    <span className="cd-urgent-badge">
                      <span className="cd-urgent-dot" />
                      ⚠️ Urgent ({waitHours}h wait)
                    </span>
                  )}
                </div>
                <div className="cd-facility-sub">
                  <span className="cd-facility-loc">
                    📍 {request.location || request.ward || "Main Waste Yard / Central Storage"}
                  </span>
                </div>
              </div>
            </div>

            <div className="cd-pickup-header-status">
              <span className={`cd-status-badge ${statusCls}`}>
                <span className="cd-status-dot" />
                {status}
              </span>
              {reqDate && (
                <span className="cd-pickup-time">
                  🕒 {formatDate(reqDate)}
                </span>
              )}
            </div>
          </div>

          {/* Middle row: Badges + Step Tracker */}
          <div className="cd-pickup-body">
            <div className="cd-pickup-chips">
              <span className={`cd-chip category ${catLower}`}>
                <span className="cd-chip-icon">{catEmoji}</span>
                <span className="cd-chip-label">Category:</span>
                <strong>{categoryName}</strong>
              </span>

              <span className="cd-chip weight">
                <span className="cd-chip-icon">⚖️</span>
                <span className="cd-chip-label">Weight:</span>
                <strong>{formatWeight(request.weight)}</strong>
              </span>

              {request.wasteType && request.wasteType !== "Biomedical Waste" && (
                <span className="cd-chip waste-type">
                  <span className="cd-chip-icon">🧪</span>
                  <strong>{request.wasteType}</strong>
                </span>
              )}
            </div>

            {/* Step progress tracker */}
            <div className="cd-step-progress">
              <div className={`cd-step ${status !== "Pending" ? "done" : "active"}`}>
                <div className="cd-step-dot">{status !== "Pending" ? "✓" : "1"}</div>
                <span>Pending</span>
              </div>
              <div className={`cd-step-line ${status === "In Transit" || status === "Collected" ? "done" : ""}`} />
              <div className={`cd-step ${status === "In Transit" ? "active" : status === "Collected" ? "done" : ""}`}>
                <div className="cd-step-dot">{status === "Collected" ? "✓" : "2"}</div>
                <span>In Transit</span>
              </div>
              <div className={`cd-step-line ${status === "Collected" ? "done" : ""}`} />
              <div className={`cd-step ${status === "Collected" ? "done" : ""}`}>
                <div className="cd-step-dot">{status === "Collected" ? "✓" : "3"}</div>
                <span>Collected</span>
              </div>
            </div>
          </div>

          {/* Bottom row: Action Buttons */}
          <div className="cd-pickup-footer">
            <div className="cd-card-buttons-row">
              <button
                type="button"
                className="cd-nav-action-btn"
                onClick={() => openNavigation(request.hospital, request.location || request.coordinates)}
                title="Open Google Maps Navigation"
              >
                🗺️ Navigate
              </button>

              <button
                type="button"
                className="cd-incident-btn"
                onClick={() => setIncidentModal(request)}
                title="Report Spill or Biological Hazard"
              >
                ⚠️ Incident
              </button>
            </div>

            <div className="cd-pickup-primary-action">
              {nextStatus && (
                <button
                  type="button"
                  className={`cd-action-btn ${nextStatus === "In Transit" ? "transit" : "collected"}`}
                  onClick={() => updatePickupStatus(request, nextStatus)}
                >
                  {nextStatus === "In Transit" ? (
                    <>
                      <span className="cd-btn-icon">🚚</span>
                      <span>Mark In Transit</span>
                    </>
                  ) : (
                    <>
                      <span className="cd-btn-icon">✅</span>
                      <span>Mark Collected</span>
                    </>
                  )}
                </button>
              )}

              {!nextStatus && (
                <div className="cd-completed-actions">
                  <span className="cd-completed-label">✅ Collected</span>
                  <button
                    type="button"
                    className="cd-manifest-btn"
                    onClick={() => setManifestModal(request)}
                    title="View CPCB Form IV Bio-Medical Waste Transfer Manifest"
                  >
                    📄 Form IV Manifest
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    });
  }

  // ─── Sub-views ─────────────────────────────────────────────────────────────

  function renderSettingsView() {
    return (
      <section className="cd-view-section">
        <div className="cd-settings-grid">
          {/* Theme & Display Mode */}
          <div className="cd-settings-card">
            <div className="cd-settings-header">
              <div className="cd-settings-icon">🎨</div>
              <div>
                <h3>Appearance & Theme</h3>
                <p>Select your interface theme for day or night collection shifts.</p>
              </div>
            </div>

            <div className="cd-theme-options">
              <button
                type="button"
                className={`cd-theme-card ${!darkMode ? "active" : ""}`}
                onClick={() => {
                  setDarkMode(false);
                  addToast("info", "Light Mode Enabled", "High-contrast daylight theme active");
                }}
              >
                <div className="cd-theme-preview light">
                  <div className="cd-tp-header" />
                  <div className="cd-tp-card" />
                  <div className="cd-tp-card" />
                </div>
                <div className="cd-theme-meta">
                  <div className="cd-theme-name">
                    <strong>☀️ Light Mode</strong>
                    {!darkMode && <span className="cd-active-dot" />}
                  </div>
                  <small>Crisp white & medical emerald designed for bright daylight field pickups.</small>
                </div>
              </button>

              <button
                type="button"
                className={`cd-theme-card ${darkMode ? "active" : ""}`}
                onClick={() => {
                  setDarkMode(true);
                  addToast("info", "Dark Mode Enabled", "Low-glare obsidian theme active");
                }}
              >
                <div className="cd-theme-preview dark">
                  <div className="cd-tp-header" />
                  <div className="cd-tp-card" />
                  <div className="cd-tp-card" />
                </div>
                <div className="cd-theme-meta">
                  <div className="cd-theme-name">
                    <strong>🌙 Dark Mode (Night / OLED)</strong>
                    {darkMode && <span className="cd-active-dot" />}
                  </div>
                  <small>Deep obsidian & radiant emerald that cuts screen glare and saves tablet battery during night routes.</small>
                </div>
              </button>
            </div>
          </div>

          {/* Field Operations */}
          <div className="cd-settings-card">
            <div className="cd-settings-header">
              <div className="cd-settings-icon">📡</div>
              <div>
                <h3>Field Preferences</h3>
                <p>Configure device telemetry, GPS tracking, and auditory alerts.</p>
              </div>
            </div>

            <div className="cd-pref-list">
              <div className="cd-pref-item">
                <div>
                  <strong>Live GPS Broadcasting</strong>
                  <p>Transmit collector coordinates to hospital dispatchers during transit</p>
                </div>
                <label className="cd-switch">
                  <input
                    type="checkbox"
                    checked={gpsAutoTrack}
                    onChange={(e) => {
                      setGpsAutoTrack(e.target.checked);
                      addToast("info", "GPS Updated", e.target.checked ? "Auto GPS enabled" : "Auto GPS disabled");
                    }}
                  />
                  <span className="cd-slider" />
                </label>
              </div>

              <div className="cd-pref-item">
                <div>
                  <strong>Audio Chimes & QR Alerts</strong>
                  <p>Play confirmation chime upon successful barcode/QR verification</p>
                </div>
                <label className="cd-switch">
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => {
                      setSoundAlerts(e.target.checked);
                      addToast("info", "Sound Updated", e.target.checked ? "Chimes enabled" : "Chimes muted");
                    }}
                  />
                  <span className="cd-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* System & Sync */}
          <div className="cd-settings-card">
            <div className="cd-settings-header">
              <div className="cd-settings-icon">🛡️</div>
              <div>
                <h3>System & Compliance</h3>
                <p>Standardized biomedical waste protocols & database status.</p>
              </div>
            </div>

            <div className="cd-pref-list">
              <div className="cd-pref-row">
                <span>CPCB Protocol</span>
                <strong>Bio-Medical Waste Rule 2016 (Form IV)</strong>
              </div>
              <div className="cd-pref-row">
                <span>Firestore Sync Engine</span>
                <span className="cd-badge-active">● Real-time Active</span>
              </div>
              <div className="cd-pref-row">
                <span>Local Theme Storage</span>
                <span className="cd-badge-active">● Synchronized ({darkMode ? "Dark" : "Light"})</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderProfileView() {
    return (
      <section className="cd-view-section">
        <div className="cd-profile-layout">
          <div className="cd-profile-card">
            <div className="cd-profile-avatar-wrap">
              <div className="cd-profile-avatar">C</div>
              <span className="cd-avatar-badge">✓</span>
            </div>
            <div className="cd-profile-info">
              <h2>Collector Operator</h2>
              <span className="cd-profile-role">Certified Medical Waste Field Handler</span>
              <div className="cd-profile-tags">
                <span className="cd-tag status-tag collected">● On Active Duty</span>
                <span className="cd-tag category">Zone: Bhubaneswar Smart City 02</span>
                <span className="cd-tag weight">Vehicle: OD-02-AK-9412</span>
              </div>
            </div>
          </div>

          <div className="cd-profile-grid">
            <div className="cd-profile-item">
              <small>Operator ID</small>
              <strong>COL-OD-2026-042</strong>
            </div>
            <div className="cd-profile-item">
              <small>Assigned Facility Hub</small>
              <strong>Rasulgarh Central Bio-Waste Logistics Hub, Bhubaneswar</strong>
            </div>
            <div className="cd-profile-item">
              <small>Shift Hours</small>
              <strong>Morning Shift (06:00 AM – 02:00 PM)</strong>
            </div>
            <div className="cd-profile-item">
              <small>Regulatory Certification</small>
              <strong>CPCB Bio-Medical Waste Handling (Valid Dec 2027)</strong>
            </div>
            <div className="cd-profile-item">
              <small>Monthly Pickups Completed</small>
              <strong>{completedThisMonth} Pickups</strong>
            </div>
            <div className="cd-profile-item">
              <small>Total Weight Collected</small>
              <strong>{formatWeight(wasteCollectedThisMonth)}</strong>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function renderRoutesView() {
    const totalStops = filteredPickups.length;
    const completedStops = filteredPickups.filter(
      (p) => normalizeStatus(p.status) === "Collected"
    ).length;
    const routeProgress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 100;

    return (
      <section className="cd-view-section">
        {/* Interactive Route Corridor Diagram */}
        <div className="cd-corridor-card">
          <div className="cd-corridor-header">
            <div>
              <div className="cd-corridor-badge">
                <span className="cd-pulse-dot" /> LIVE TRANSIT CORRIDOR
              </div>
              <h2>Bhubaneswar Smart City Biohazard Transit Corridor (OD-02)</h2>
              <p>Rasulgarh Hub ➔ Assigned Hospital Facilities ➔ Odisha CBWTF Plant (Chandaka/Tangi)</p>
            </div>
            <div className="cd-corridor-stats">
              <div className="cd-cstat">
                <small>Route Progress</small>
                <strong>{completedStops} / {totalStops} Stops ({routeProgress}%)</strong>
              </div>
              <div className="cd-cstat">
                <small>Est. Corridor Distance</small>
                <strong>~18.4 km</strong>
              </div>
            </div>
          </div>

          {/* Corridor Progress Bar */}
          <div className="cd-corridor-bar-wrap">
            <div className="cd-corridor-bar-fill" style={{ width: `${routeProgress}%` }} />
          </div>

          {/* Visual Corridor Line with Nodes */}
          <div className="cd-corridor-diagram">
            <div className="cd-node start">
              <div className="cd-node-icon">🏭</div>
              <span className="cd-node-title">Rasulgarh Central Hub</span>
              <small>Depot Origin (Bhubaneswar)</small>
            </div>

            <div className="cd-node-connector done">
              <span className="cd-conn-dist">~3.2 km</span>
            </div>

            {filteredPickups.slice(0, 3).map((p, idx) => {
              const status = normalizeStatus(p.status);
              const isDone = status === "Collected";
              const isTransit = status === "In Transit";
              return (
                <div key={p.id || idx} className="cd-corridor-segment">
                  <div className={`cd-node stop ${isDone ? "done" : isTransit ? "active" : "pending"}`}>
                    <div className="cd-node-icon">
                      {isDone ? "✅" : isTransit ? "🚚" : "🏥"}
                    </div>
                    <span className="cd-node-title">{p.hospital || `Stop ${idx + 1}`}</span>
                    <small>{status}</small>
                  </div>
                  {idx < 2 && (
                    <div className={`cd-node-connector ${isDone ? "done" : ""}`}>
                      <span className="cd-conn-dist">~{3 + idx * 1.5} km</span>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="cd-node-connector">
              <span className="cd-conn-dist">~6.5 km</span>
            </div>

            <div className="cd-node end">
              <div className="cd-node-icon">♻️</div>
              <span className="cd-node-title">Chandaka / Tangi CBWTF Plant</span>
              <small>Incineration / Disposal (Odisha)</small>
            </div>
          </div>

          <div className="cd-corridor-footer">
            <span>⏱️ Estimated Corridor Completion Time: <strong>~35 mins</strong></span>
            <button
              type="button"
              className="cd-corridor-nav-all"
              onClick={() => {
                if (filteredPickups[0]?.hospital) {
                  openNavigation(
                    filteredPickups[0].hospital,
                    filteredPickups[0].location || filteredPickups[0].coordinates
                  );
                } else {
                  addToast("info", "Corridor Map", "All stops in current corridor are up to date.");
                }
              }}
            >
              🗺️ Launch Next Stop Turn-by-Turn
            </button>
          </div>
        </div>

        {/* Stops List */}
        <div className="cd-panel">
          <div className="cd-panel-header">
            <div>
              <h2>Assigned Routes & Hospital Stops</h2>
              <p>Current sequence of hospital pickup locations on your schedule.</p>
            </div>
            <button type="button" className="cd-view-all-btn" onClick={getCollectorLocation}>
              📍 Update GPS
            </button>
          </div>

          {collectorLocation && (
            <div className="cd-location-card">
              <div className="cd-location-icon">📍</div>
              <div className="cd-location-info">
                <strong>Your Current GPS Location</strong>
                <span>Last updated at {formatDate(collectorLocation.updatedAt)}</span>
                <div className="cd-coordinates">
                  <span>Lat: {collectorLocation.latitude?.toFixed(5)}</span>
                  <span>Long: {collectorLocation.longitude?.toFixed(5)}</span>
                  <span>Accuracy: ~{Math.round(collectorLocation.accuracy || 10)}m</span>
                </div>
              </div>
            </div>
          )}

          <div className="cd-route-list">
            {filteredPickups.length > 0 ? (
              filteredPickups.map((p, index) => {
                const isNextStop = normalizeStatus(p.status) === "Pending" && index === 0;
                return (
                  <div key={p.id || index} className={`cd-route-stop ${normalizeStatus(p.status).toLowerCase().replace(" ", "-")} ${isNextStop ? "next-stop" : ""}`}>
                    <div className="cd-route-stop-num">
                      {isNextStop && <span className="cd-stop-beacon" />}
                      {index + 1}
                    </div>
                    <div className="cd-route-stop-info">
                      <div className="cd-route-stop-top">
                        <strong>{p.hospital || "Hospital Facility"}</strong>
                        {isNextStop && <span className="cd-next-badge">Next Stop</span>}
                        <span className="cd-stop-drive-time">⏱️ ~{(index + 1) * 7} mins</span>
                      </div>
                      <span>{p.wasteType || p.category || "Medical Waste"} · {formatWeight(p.weight)}</span>
                    </div>
                    <div className="cd-route-stop-actions">
                      <button
                        type="button"
                        className="cd-route-nav-btn"
                        onClick={() => openNavigation(p.hospital, p.location || p.coordinates)}
                        title="Start GPS Navigation"
                      >
                        🗺️ Navigate
                      </button>
                      <button
                        type="button"
                        className="cd-route-incident-btn"
                        onClick={() => setIncidentModal(p)}
                        title="Report Spill or Hazard at this Stop"
                      >
                        ⚠️
                      </button>
                      <span className={`cd-tag status-tag ${normalizeStatus(p.status).toLowerCase().replace(" ", "-")}`}>
                        {normalizeStatus(p.status)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="cd-empty-state">
                <div className="cd-empty-icon">🗺️</div>
                <h3>No Route Stops Available</h3>
                <p>All scheduled pickups for this route are complete or none are pending.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  function renderReportsView() {
    const { totals, totalWeight, yellowPct, redPct, bluePct, whitePct } = wasteStreamBreakdown;

    return (
      <section className="cd-view-section">
        <div className="cd-panel">
          <div className="cd-panel-header">
            <div>
              <h2>Collection Metrics & Monthly Reports</h2>
              <p>Summary of medical waste gathered, CPCB compliance and stream analytics.</p>
            </div>
            <button
              type="button"
              className="cd-export-btn"
              onClick={exportPickupLog}
            >
              📥 Export Full CSV
            </button>
          </div>

          <div className="cd-reports-summary-cards">
            <div className="cd-report-card">
              <small>Completed Pickups</small>
              <strong>{completedThisMonth}</strong>
              <span>Verified deliveries this month</span>
            </div>
            <div className="cd-report-card">
              <small>Total Biohazard Weight</small>
              <strong>{formatWeight(wasteCollectedThisMonth)}</strong>
              <span>Safe transport processed</span>
            </div>
            <div className="cd-report-card">
              <small>Active in Transit</small>
              <strong>{inTransitPickups}</strong>
              <span>Batches on the vehicle</span>
            </div>
            <div className="cd-report-card">
              <small>Pending Hospital Requests</small>
              <strong>{pendingPickups}</strong>
              <span>Awaiting pickup dispatch</span>
            </div>
          </div>

          {/* ═══ Waste Category Stream Volume Distribution ═══ */}
          <div className="cd-analytics-section">
            <div className="cd-analytics-header">
              <div>
                <h3>Bio-Medical Waste Stream Volume Breakdown</h3>
                <p>Segregation volume by CPCB color categories & prescribed treatment protocols.</p>
              </div>
              <span className="cd-analytics-total">Total: <strong>{totalWeight.toFixed(1)} kg</strong></span>
            </div>

            {/* Stacked Progress Bar */}
            <div className="cd-stream-stacked-bar">
              <div className="cd-stream-segment yellow" style={{ width: `${yellowPct}%` }} title={`Yellow: ${totals.yellow.weight.toFixed(1)} kg (${yellowPct}%)`} />
              <div className="cd-stream-segment red" style={{ width: `${redPct}%` }} title={`Red: ${totals.red.weight.toFixed(1)} kg (${redPct}%)`} />
              <div className="cd-stream-segment blue" style={{ width: `${bluePct}%` }} title={`Blue: ${totals.blue.weight.toFixed(1)} kg (${bluePct}%)`} />
              <div className="cd-stream-segment white" style={{ width: `${whitePct}%` }} title={`White: ${totals.white.weight.toFixed(1)} kg (${whitePct}%)`} />
            </div>

            {/* 4 Category Stream Detail Cards */}
            <div className="cd-stream-cards-grid">
              <div className="cd-stream-card yellow-stream">
                <div className="cd-sc-top">
                  <span className="cd-sc-badge">🟡 Yellow Stream</span>
                  <strong>{yellowPct}%</strong>
                </div>
                <div className="cd-sc-weight">{totals.yellow.weight.toFixed(1)} kg</div>
                <small className="cd-sc-method">Incineration / Deep Burial</small>
                <p>Infectious waste, anatomical organs, soiled dressings, expired pharmaceuticals.</p>
              </div>

              <div className="cd-stream-card red-stream">
                <div className="cd-sc-top">
                  <span className="cd-sc-badge">🔴 Red Stream</span>
                  <strong>{redPct}%</strong>
                </div>
                <div className="cd-sc-weight">{totals.red.weight.toFixed(1)} kg</div>
                <small className="cd-sc-method">Autoclaving & Shredding</small>
                <p>Contaminated plastics, IV bottles, catheters, tubing, disposable syringes.</p>
              </div>

              <div className="cd-stream-card blue-stream">
                <div className="cd-sc-top">
                  <span className="cd-sc-badge">🔵 Blue Stream</span>
                  <strong>{bluePct}%</strong>
                </div>
                <div className="cd-sc-weight">{totals.blue.weight.toFixed(1)} kg</div>
                <small className="cd-sc-method">Disinfection & Recycling</small>
                <p>Glass ampoules, broken medicine vials, cytotoxic drug bottles.</p>
              </div>

              <div className="cd-stream-card white-stream">
                <div className="cd-sc-top">
                  <span className="cd-sc-badge">⚪ White Stream</span>
                  <strong>{whitePct}%</strong>
                </div>
                <div className="cd-sc-weight">{totals.white.weight.toFixed(1)} kg</div>
                <small className="cd-sc-method">Sharp Pit Encapsulation</small>
                <p>Needles, scalpels, surgical blades, contaminated puncture sharps.</p>
              </div>
            </div>
          </div>

          {/* ═══ CPCB Compliance & Velocity Scorecard ═══ */}
          <div className="cd-compliance-grid">
            <div className="cd-comp-card">
              <div className="cd-comp-icon">🛡️</div>
              <div className="cd-comp-info">
                <strong>99.4%</strong>
                <span>CPCB Form IV Compliance</span>
                <small>Digital custody handover verified</small>
              </div>
            </div>

            <div className="cd-comp-card">
              <div className="cd-comp-icon">⚡</div>
              <div className="cd-comp-info">
                <strong>38 mins</strong>
                <span>Average Pickup Velocity</span>
                <small>From hospital dispatch to safe load</small>
              </div>
            </div>

            <div className="cd-comp-card">
              <div className="cd-comp-icon">🏷️</div>
              <div className="cd-comp-info">
                <strong>100%</strong>
                <span>Barcode Verification</span>
                <small>Zero untracked bags transported</small>
              </div>
            </div>

            <div className="cd-comp-card">
              <div className="cd-comp-icon">🌿</div>
              <div className="cd-comp-info">
                <strong>Grade A</strong>
                <span>Segregation Integrity</span>
                <small>Zero cross-color contamination</small>
              </div>
            </div>
          </div>

          {/* ═══ Weekly Volume Trend Bar Chart ═══ */}
          <div className="cd-chart-card">
            <div className="cd-chart-header">
              <div>
                <h3>Weekly Waste Load Trend (kg)</h3>
                <p>Daily biomedical collection distribution across the current operating cycle.</p>
              </div>
              <span className="cd-chart-legend">● Daily Payload Weight</span>
            </div>

            <div className="cd-bar-chart">
              {[
                { day: "Mon", weight: 68, height: "65%" },
                { day: "Tue", weight: 92, height: "88%" },
                { day: "Wed", weight: 74, height: "70%" },
                { day: "Thu", weight: 105, height: "100%" },
                { day: "Fri", weight: 88, height: "84%" },
                { day: "Sat", weight: 55, height: "52%" },
                { day: "Sun", weight: 32, height: "30%" },
              ].map((item) => (
                <div key={item.day} className="cd-chart-col">
                  <span className="cd-bar-val">{item.weight} kg</span>
                  <div className="cd-bar-track">
                    <div className="cd-bar-fill" style={{ height: item.height }} />
                  </div>
                  <strong className="cd-bar-day">{item.day}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  const navItems = [
    { label: "Dashboard", icon: "📊" },
    { label: "Pickup Requests", icon: "🚚" },
    { label: "My Pickups", icon: "📋" },
    { label: "Routes", icon: "🗺️" },
    { label: "Reports", icon: "📈" },
  ];

  const showingPickupList = [
    "Dashboard",
    "Pickup Requests",
    "My Pickups",
  ].includes(activeView);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="cd-page"
      data-theme={darkMode ? "dark" : "light"}
      data-collector-theme={darkMode ? "dark" : "light"}
    >
      {/* Toast Notifications */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* Mobile Sidebar Overlay */}
      <div
        className={`cd-sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`cd-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${sidebarOpen ? "open" : ""}`}>
        <button
          type="button"
          className="cd-collapse-btn"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? "›" : "‹"}
        </button>

        <div className="cd-brand">
          <div className="cd-logo">✚</div>
          <div className="cd-brand-text">
            <h2>MediSort</h2>
            <span>Collector Portal</span>
          </div>
        </div>

        <nav className="cd-nav">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`cd-nav-item ${
                activeView === item.label ? "active" : ""
              }`}
              onClick={() => setActiveView(item.label)}
              title={item.label}
            >
              <span className="cd-nav-icon">{item.icon}</span>
              <span className="cd-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="cd-sidebar-bottom">
          <button
            type="button"
            className={`cd-nav-item ${
              activeView === "Profile" ? "active" : ""
            }`}
            onClick={() => setActiveView("Profile")}
            title="Profile"
          >
            <span className="cd-nav-icon">👤</span>
            <span className="cd-nav-label">Profile</span>
          </button>

          <button
            type="button"
            className={`cd-nav-item ${
              activeView === "Settings" ? "active" : ""
            }`}
            onClick={() => setActiveView("Settings")}
            title="Settings"
          >
            <span className="cd-nav-icon">⚙️</span>
            <span className="cd-nav-label">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`cd-main ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* Topbar */}
        <header className="cd-topbar">
          <div>
            {/* Hamburger for mobile */}
          <button
            type="button"
            className="cd-hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar menu"
          >
            ☰
          </button>

          <div className="cd-topbar-title-row">
              <h1>
                {activeView === "Dashboard"
                  ? "Collector Dashboard"
                  : activeView}
              </h1>
              <div
                className={`cd-network-status ${isOnline ? "online" : "offline"}`}
                title={isOnline ? "Live Firestore Sync Active" : "Offline mode - changes queue locally"}
              >
                <span className="cd-net-dot" />
                <span>{isOnline ? "Online" : "Offline"}</span>
              </div>
            </div>
            <p className="cd-topbar-subtitle">
              Manage your medical waste pickups efficiently.
            </p>
          </div>

          <div className="cd-topbar-actions">
            {/* Vehicle Payload Tracker */}
            <div
              className="cd-payload-pill"
              title={`Vehicle Load: ${currentPayload} / ${maxPayload} kg (${payloadPercent}%)`}
            >
              <div className="cd-payload-info">
                <span className="cd-payload-label">🚛 Payload</span>
                <strong>{currentPayload} / {maxPayload} kg</strong>
              </div>
              <div className="cd-payload-bar">
                <div
                  className={`cd-payload-fill ${payloadPercent >= 90 ? "danger" : payloadPercent >= 60 ? "warning" : "ok"}`}
                  style={{ width: `${payloadPercent}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              className="cd-theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>

            <button
              type="button"
              className="cd-home-btn"
              onClick={() => {
                if (typeof onBackToHome === "function") {
                  onBackToHome();
                } else {
                  window.location.assign("/");
                }
              }}
            >
              🏠 Home
            </button>

            {/* Notification Drawer */}
            <div className="cd-bell-wrap">
              <button
                type="button"
                className="cd-notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Notifications"
                title="Notifications"
              >
                🔔
                {notifications.some((n) => !n.read) && (
                  <span className="cd-bell-badge" />
                )}
              </button>

              {showNotifications && (
                <div className="cd-notification-drawer">
                  <div className="cd-drawer-header">
                    <strong>Operational Alerts</strong>
                    <button
                      type="button"
                      className="cd-drawer-clear"
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        )
                      }
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="cd-drawer-list">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`cd-drawer-item ${n.read ? "read" : "unread"}`}
                      >
                        <div className={`cd-drawer-badge ${n.type}`}>
                          {n.type === "urgent"
                            ? "⚠️"
                            : n.type === "route"
                              ? "🗺️"
                              : "ℹ️"}
                        </div>
                        <div className="cd-drawer-info">
                          <strong>{n.title}</strong>
                          <p>{n.desc}</p>
                          <small>{n.time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="cd-user-area">
              <div className="cd-avatar">C</div>
              <div className="cd-user-text">
                <strong>Collector</strong>
                <span>Field Operator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Firebase Error */}
        {firebaseError && (
          <div className="cd-alert error" role="alert">
            <span className="cd-alert-icon">⚠️</span>
            <p>{firebaseError}</p>
          </div>
        )}

        {/* ═══ DASHBOARD VIEW ═══ */}
        {activeView === "Dashboard" && (
          <>
            {/* Hero Banner */}
            <section className="cd-hero">
              <div className="cd-hero-content">
                <div className="cd-hero-badge">
                  <span className="cd-pulse-dot" />
                  LIVE OPERATIONS
                </div>
                <h2>Ready for your next pickup? 🚚</h2>
                <p>
                  View assigned medical waste pickups, update collection status
                  and manage your route.
                </p>
              </div>
              <div className="cd-hero-actions">
                <button
                  type="button"
                  className="cd-hero-btn primary"
                  onClick={() => setActiveView("Pickup Requests")}
                >
                  📋 View Pickups
                </button>
                <button
                  type="button"
                  className="cd-hero-btn secondary"
                  onClick={startQRScanner}
                >
                  📷 Scan QR
                </button>
              </div>
              <div className="cd-hero-glow" />
            </section>

            {/* Stat Cards */}
            <section className="cd-stats">
              <div className="cd-stat-card accent-amber">
                <div className="cd-stat-card-top">
                  <div className="cd-stat-icon pending-bg">📋</div>
                  <span className={`cd-stat-pill ${pendingPickups > 3 ? "warning" : "info"}`}>
                    {loading ? "…" : pendingPickups > 3 ? "Urgent!" : "Normal"}
                  </span>
                </div>
                <div className="cd-stat-body">
                  <span className="cd-stat-label">Pending Pickups</span>
                  <strong className="cd-stat-value">
                    {loading ? (
                      <span className="cd-skeleton cd-skeleton-num" />
                    ) : (
                      <AnimatedNumber value={pendingPickups} />
                    )}
                  </strong>
                </div>
                {!loading && (
                  <div className="cd-stat-bar-wrap">
                    <div
                      className="cd-stat-bar amber"
                      style={{
                        width: `${Math.min(
                          (pendingPickups / Math.max(pickupRequests.length, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
                <small className="cd-stat-sub">Awaiting collection</small>
              </div>

              <div className="cd-stat-card accent-blue">
                <div className="cd-stat-card-top">
                  <div className="cd-stat-icon transit-bg">🚚</div>
                  <span className={`cd-stat-pill ${inTransitPickups > 0 ? "active" : "info"}`}>
                    {loading ? "…" : inTransitPickups > 0 ? "Moving" : "Idle"}
                  </span>
                </div>
                <div className="cd-stat-body">
                  <span className="cd-stat-label">In Transit</span>
                  <strong className="cd-stat-value">
                    {loading ? (
                      <span className="cd-skeleton cd-skeleton-num" />
                    ) : (
                      <AnimatedNumber value={inTransitPickups} />
                    )}
                  </strong>
                </div>
                {!loading && (
                  <div className="cd-stat-bar-wrap">
                    <div
                      className="cd-stat-bar blue"
                      style={{
                        width: `${Math.min(
                          (inTransitPickups / Math.max(pickupRequests.length, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
                <small className="cd-stat-sub">Currently on route</small>
              </div>

              <div className="cd-stat-card accent-cyan">
                <div className="cd-stat-card-top">
                  <div className="cd-stat-icon today-bg">📍</div>
                  <span className="cd-stat-pill info">Today</span>
                </div>
                <div className="cd-stat-body">
                  <span className="cd-stat-label">Today&apos;s Pickups</span>
                  <strong className="cd-stat-value">
                    {loading ? (
                      <span className="cd-skeleton cd-skeleton-num" />
                    ) : (
                      <AnimatedNumber value={todaysPickups} />
                    )}
                  </strong>
                </div>
                {!loading && (
                  <div className="cd-stat-bar-wrap">
                    <div
                      className="cd-stat-bar cyan"
                      style={{
                        width: `${Math.min(
                          (todaysPickups / Math.max(pickupRequests.length, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
                <small className="cd-stat-sub">Requested today</small>
              </div>

              <div className="cd-stat-card accent-green">
                <div className="cd-stat-card-top">
                  <div className="cd-stat-icon completed-bg">✓</div>
                  <span className="cd-stat-pill success">
                    {loading ? "…" : completedThisMonth > 0 ? "On Track" : "None"}
                  </span>
                </div>
                <div className="cd-stat-body">
                  <span className="cd-stat-label">Completed</span>
                  <strong className="cd-stat-value">
                    {loading ? (
                      <span className="cd-skeleton cd-skeleton-num" />
                    ) : (
                      <AnimatedNumber value={completedThisMonth} />
                    )}
                  </strong>
                </div>
                {!loading && (
                  <div className="cd-stat-bar-wrap">
                    <div
                      className="cd-stat-bar green"
                      style={{
                        width: `${Math.min(
                          (completedThisMonth / Math.max(pickupRequests.length, 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
                <small className="cd-stat-sub">This month</small>
              </div>

              <div className="cd-stat-card feature-card">
                <div className="cd-feature-glow" />
                <div className="cd-stat-card-top">
                  <div className="cd-stat-icon feature-icon">⚖️</div>
                  <span className="cd-stat-pill feature">Monthly</span>
                </div>
                <div className="cd-stat-body">
                  <span className="cd-stat-label">Waste Collected</span>
                  <strong className="cd-stat-value">
                    {loading ? (
                      <span className="cd-skeleton cd-skeleton-num" />
                    ) : (
                      <>
                        <AnimatedNumber value={Math.round(wasteCollectedThisMonth)} />
                        <span className="cd-stat-unit"> kg</span>
                      </>
                    )}
                  </strong>
                </div>
                <small className="cd-stat-sub">This month total</small>
              </div>
            </section>
          </>
        )}

        {/* ═══ PICKUP LIST VIEWS ═══ */}
        {showingPickupList ? (
          <section className="cd-content-grid">
            <div className="cd-panel">
              <div className="cd-panel-header">
                <div>
                  <h2>
                    {activeView === "My Pickups"
                      ? "My Pickups"
                      : activeView === "Pickup Requests"
                        ? "Pickup Requests"
                        : "Today's Pickup Requests"}
                  </h2>
                  <p>Live pickup requests from Firebase.</p>
                </div>

                {activeView === "Dashboard" && (
                  <button
                    type="button"
                    className="cd-view-all-btn"
                    onClick={() => setActiveView("Pickup Requests")}
                  >
                    View All →
                  </button>
                )}
              </div>

              {/* Search & Filter Bar */}
              <div className="cd-filter-bar">
                <div className="cd-search-box">
                  <span className="cd-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Search hospital or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="cd-filter-pills">
                  {["All", "Pending", "In Transit", "Collected"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`cd-filter-pill ${statusFilter === f ? "active" : ""}`}
                      onClick={() => setStatusFilter(f)}
                    >
                      {f}
                      {f !== "All" && (
                        <span className="cd-pill-count">
                          {pickupRequests.filter(
                            (r) => normalizeStatus(r.status) === f
                          ).length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Extended Category Pills & Sort Controls */}
                <div className="cd-filter-controls-row">
                  <div className="cd-cat-pills">
                    {["All", "Yellow", "Red", "Blue", "White"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`cd-cat-pill ${cat.toLowerCase()} ${categoryFilter === cat ? "active" : ""}`}
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat === "Yellow"
                          ? `🟡 Yellow (${categoryCounts.Yellow})`
                          : cat === "Red"
                            ? `🔴 Red (${categoryCounts.Red})`
                            : cat === "Blue"
                              ? `🔵 Blue (${categoryCounts.Blue})`
                              : cat === "White"
                                ? `⚪ White (${categoryCounts.White})`
                                : `All (${categoryCounts.All})`}
                      </button>
                    ))}
                  </div>

                  <div className="cd-filter-actions">
                    <div className="cd-view-toggle">
                      <button
                        type="button"
                        className={`cd-view-btn ${cardLayout === "detailed" ? "active" : ""}`}
                        onClick={() => setCardLayout("detailed")}
                        title="Detailed Card View"
                      >
                        ☷ Cards
                      </button>
                      <button
                        type="button"
                        className={`cd-view-btn ${cardLayout === "compact" ? "active" : ""}`}
                        onClick={() => setCardLayout("compact")}
                        title="Compact List View"
                      >
                        ☰ Compact
                      </button>
                    </div>

                    <select
                      className="cd-select"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      title="Sort Pickups"
                    >
                      <option value="newest">🕒 Newest First</option>
                      <option value="oldest">⚠️ Oldest / Urgent First</option>
                      <option value="heaviest">⚖️ Heaviest First</option>
                      <option value="hospital">🏥 Hospital Name (A-Z)</option>
                    </select>

                    <button
                      type="button"
                      className="cd-export-btn"
                      onClick={exportPickupLog}
                      title="Export collection log to CSV"
                    >
                      📥 Export CSV
                    </button>
                  </div>
                </div>
              </div>

              {/* QR Scanner & Location — Dashboard only */}
              {activeView === "Dashboard" && (
                <>
                  {collectorLocation && (
                    <div className="cd-location-card">
                      <div className="cd-location-icon">📍</div>
                      <div className="cd-location-info">
                        <strong>Collector Location</strong>
                        <span>GPS location detected successfully</span>
                        <div className="cd-coordinates">
                          <span>
                            Lat: {collectorLocation.latitude.toFixed(6)}
                          </span>
                          <span>
                            Lng: {collectorLocation.longitude.toFixed(6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="cd-scanner-card">
                    <div className="cd-scanner-header">
                      <div>
                        <h2>📷 Scan Waste QR</h2>
                        <p>Scan barcode / QR or enter ID manually</p>
                      </div>
                      <button
                        type="button"
                        className="cd-scan-btn"
                        onClick={startQRScanner}
                      >
                        Start Scanner
                      </button>
                    </div>

                    <div id="qr-reader"></div>

                    {/* Manual QR Search Fallback */}
                    <div className="cd-manual-qr">
                      <span className="cd-manual-icon">⌨️</span>
                      <input
                        type="text"
                        placeholder="Manual QR / Barcode ID (e.g. OD-2026-004)..."
                        value={manualQrInput}
                        onChange={(e) => setManualQrInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchManualQr()}
                      />
                      <button
                        type="button"
                        className="cd-manual-btn"
                        onClick={searchManualQr}
                      >
                        Find Code
                      </button>
                    </div>

                    {scannedWaste && (
                      <div className="cd-scanned-result">
                        <div className="cd-scanned-header">
                          <strong>✅ Waste Batch Found</strong>
                          <span>QR verified successfully</span>
                        </div>

                        <div className="cd-scanned-grid">
                          <div>
                            <small>QR ID</small>
                            <strong>{scannedWaste.qrId}</strong>
                          </div>
                          <div>
                            <small>Hospital</small>
                            <strong>{scannedWaste.hospital || "—"}</strong>
                          </div>
                          <div>
                            <small>Waste Type</small>
                            <strong>{scannedWaste.wasteType || "—"}</strong>
                          </div>
                          <div>
                            <small>Category</small>
                            <strong>{scannedWaste.category || "—"}</strong>
                          </div>
                          <div>
                            <small>Weight</small>
                            <strong>{formatWeight(scannedWaste.weight)}</strong>
                          </div>
                          <div>
                            <small>Status</small>
                            <strong>
                              {normalizeStatus(scannedWaste.status)}
                            </strong>
                          </div>
                        </div>

                        <div className="cd-scanned-actions">
                          <button
                            type="button"
                            className="cd-scan-action-btn add-batch"
                            onClick={() => addToBatchList(scannedWaste)}
                            title="Add this bag to batch accumulation"
                          >
                            ➕ Add to Batch
                          </button>

                          <button
                            type="button"
                            className="cd-scan-action-btn transit"
                            disabled={
                              normalizeStatus(scannedWaste.status) !== "Pending"
                            }
                            onClick={() =>
                              updateScannedWasteStatus("In Transit")
                            }
                          >
                            🚚 Mark In Transit
                          </button>

                          <button
                            type="button"
                            className="cd-scan-action-btn collected"
                            disabled={
                              normalizeStatus(scannedWaste.status) !==
                              "In Transit"
                            }
                            onClick={() =>
                              updateScannedWasteStatus("Collected")
                            }
                          >
                            ✅ Mark Collected
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Multi-Bag Batch Collection Container */}
                    {batchScannedList.length > 0 && (
                      <div className="cd-batch-container">
                        <div className="cd-batch-header">
                          <div>
                            <strong>📦 Multi-Bag Batch Collection ({batchScannedList.length} Bags)</strong>
                            <small>
                              Total Batch Weight: {batchScannedList.reduce((s, b) => s + (Number(b.weight) || 0), 0).toFixed(1)} kg
                            </small>
                          </div>
                          <div className="cd-batch-controls">
                            <button
                              type="button"
                              className="cd-batch-action transit"
                              onClick={() => updateAllBatchStatus("In Transit")}
                            >
                              🚚 Transit All
                            </button>
                            <button
                              type="button"
                              className="cd-batch-action collected"
                              onClick={() => updateAllBatchStatus("Collected")}
                            >
                              ✅ Collect All
                            </button>
                            <button
                              type="button"
                              className="cd-batch-clear"
                              onClick={() => setBatchScannedList([])}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                        <div className="cd-batch-items">
                          {batchScannedList.map((item) => (
                            <div key={item.qrId} className="cd-batch-item">
                              <span className="cd-batch-tag">{item.category || "Mixed"}</span>
                              <strong>{item.qrId}</strong>
                              <span>{item.hospital || "Hospital"}</span>
                              <span>{formatWeight(item.weight)}</span>
                              <button
                                type="button"
                                className="cd-batch-remove"
                                onClick={() => removeFromBatchList(item.qrId)}
                                title="Remove from batch"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Quick Panel — non-Dashboard views */}
              {activeView !== "Dashboard" && (
                <div className="cd-inline-actions">
                  <button
                    type="button"
                    className="cd-quick-btn"
                    onClick={getCollectorLocation}
                  >
                    <span className="cd-quick-icon">📍</span>
                    <div>
                      <strong>My Location</strong>
                      <small>Get current GPS position</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="cd-quick-btn"
                    onClick={() => setActiveView("Dashboard")}
                  >
                    <span className="cd-quick-icon">📷</span>
                    <div>
                      <strong>Scan QR</strong>
                      <small>Open the scanner on Dashboard</small>
                    </div>
                    <span className="cd-quick-arrow">→</span>
                  </button>
                </div>
              )}

              {renderPickupList()}
            </div>

            {/* Quick Actions Panel — Dashboard only */}
            {activeView === "Dashboard" && (
              <div className="cd-quick-panel">
                <div className="cd-panel-header">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>Common collector tasks.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="cd-quick-action"
                  onClick={getCollectorLocation}
                >
                  <div className="cd-qa-icon">📍</div>
                  <div>
                    <strong>My Location</strong>
                    <span>Get current GPS position</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="cd-quick-action"
                  onClick={startQRScanner}
                >
                  <div className="cd-qa-icon">📱</div>
                  <div>
                    <strong>Scan QR</strong>
                    <small>Verify a waste batch</small>
                  </div>
                  <span className="cd-qa-arrow">→</span>
                </button>

                <button
                  type="button"
                  className="cd-quick-action"
                  onClick={() => setActiveView("Pickup Requests")}
                >
                  <div className="cd-qa-icon">✓</div>
                  <div>
                    <strong>Update Pickup</strong>
                    <small>Open pickup requests</small>
                  </div>
                  <span className="cd-qa-arrow">→</span>
                </button>

                <button
                  type="button"
                  className="cd-quick-action incident"
                  onClick={() => setIncidentModal({ hospital: "Active Transit Corridor", id: null })}
                >
                  <div className="cd-qa-icon incident-icon">⚠️</div>
                  <div>
                    <strong>Report Spill / Incident</strong>
                    <small>Log biohazard breach protocol</small>
                  </div>
                  <span className="cd-qa-arrow">→</span>
                </button>

                {/* Mini Stats Summary */}
                <div className="cd-mini-summary">
                  <h3>Today&apos;s Summary</h3>
                  <div className="cd-mini-stat">
                    <span>Pending</span>
                    <strong>{pendingPickups}</strong>
                  </div>
                  <div className="cd-mini-stat">
                    <span>In Transit</span>
                    <strong>{inTransitPickups}</strong>
                  </div>
                  <div className="cd-mini-stat">
                    <span>Completed (Month)</span>
                    <strong>{completedThisMonth}</strong>
                  </div>
                  <div className="cd-mini-stat">
                    <span>Waste (Month)</span>
                    <strong>{formatWeight(wasteCollectedThisMonth)}</strong>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : activeView === "Settings" ? (
          renderSettingsView()
        ) : activeView === "Profile" ? (
          renderProfileView()
        ) : activeView === "Routes" ? (
          renderRoutesView()
        ) : activeView === "Reports" ? (
          renderReportsView()
        ) : (
          <section className="cd-content-grid">
            <div className="cd-panel">
              <div className="cd-panel-header">
                <div>
                  <h2>{activeView}</h2>
                  <p>
                    This section is not connected to a page in the current app.
                  </p>
                </div>
              </div>
              <div className="cd-empty-state">
                <div className="cd-empty-icon">🚧</div>
                <h3>Coming Soon</h3>
                <p>This feature is under development.</p>
              </div>
              <button
                type="button"
                className="cd-view-all-btn"
                onClick={() => setActiveView("Dashboard")}
              >
                ← Back to Dashboard
              </button>
            </div>
          </section>
        )}
      </main>

      {/* ═══ DIGITAL HANDOVER & SIGNATURE MODAL ═══ */}
      {handoverModal && (
        <div className="cd-modal-backdrop" onClick={() => setHandoverModal(null)}>
          <div
            className="cd-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="cd-modal-header">
              <div>
                <h2>✍️ Bio-Medical Waste Custody Handover</h2>
                <p>CPCB Rule 13 — Complete digital chain of custody before transit.</p>
              </div>
              <button
                type="button"
                className="cd-modal-close"
                onClick={() => setHandoverModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="cd-modal-body">
              {/* Consignment Overview */}
              <div className="cd-consignment-summary">
                <div className="cd-cs-item">
                  <small>Hospital Facility</small>
                  <strong>{handoverModal.hospital || "Hospital"}</strong>
                </div>
                <div className="cd-cs-item">
                  <small>Waste Category</small>
                  <span className="cd-tag category">
                    🟡 {handoverModal.category || "Mixed"}
                  </span>
                </div>
                <div className="cd-cs-item">
                  <small>Consignment Weight</small>
                  <strong>{formatWeight(handoverModal.weight)}</strong>
                </div>
                <div className="cd-cs-item">
                  <small>Transfer Date</small>
                  <strong>{new Date().toLocaleDateString("en-IN")}</strong>
                </div>
              </div>

              {/* Hospital Staff Information */}
              <div className="cd-form-row">
                <div className="cd-form-group">
                  <label htmlFor="staff-name">Hospital Representative Name</label>
                  <input
                    id="staff-name"
                    type="text"
                    placeholder="e.g. Sister Sunita Das"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  />
                </div>
                <div className="cd-form-group">
                  <label htmlFor="staff-desig">Designation / Role</label>
                  <input
                    id="staff-desig"
                    type="text"
                    placeholder="e.g. BMW Officer / Ward In-charge"
                    value={staffDesignation}
                    onChange={(e) => setStaffDesignation(e.target.value)}
                  />
                </div>
              </div>

              {/* Signature Canvas */}
              <div className="cd-signature-box">
                <div className="cd-sig-header">
                  <label>Digital Handover Signature (Sign on screen or canvas)</label>
                  <button
                    type="button"
                    className="cd-sig-clear-btn"
                    onClick={clearSignature}
                  >
                    Clear Signature
                  </button>
                </div>
                <div className="cd-canvas-wrapper">
                  <canvas
                    ref={canvasRef}
                    width={460}
                    height={160}
                    className="cd-sig-canvas"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startTouchDrawing}
                    onTouchMove={drawTouch}
                    onTouchEnd={stopDrawing}
                  />
                  {!hasSigned && (
                    <div className="cd-sig-prompt">
                      <span>✍️ Sign with finger or mouse here</span>
                    </div>
                  )}
                </div>
                <small className="cd-sig-disclaimer">
                  By signing, the hospital certifies that waste has been segregated into Barcode-compliant CPCB color-coded bags as per Bio-Medical Waste Management Rules 2016.
                </small>
              </div>
            </div>

            <div className="cd-modal-footer">
              <button
                type="button"
                className="cd-btn-secondary"
                onClick={() => setHandoverModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cd-btn-primary"
                onClick={() => completeHandover(handoverModal)}
              >
                ✅ Confirm Handover & Issue Manifest
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CPCB FORM IV MANIFEST MODAL ═══ */}
      {manifestModal && (
        <div className="cd-modal-backdrop" onClick={() => setManifestModal(null)}>
          <div
            className="cd-manifest-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="cd-manifest-controls no-print">
              <button
                type="button"
                className="cd-manifest-print-btn"
                onClick={() => window.print()}
              >
                🖨️ Print / Save PDF
              </button>
              <button
                type="button"
                className="cd-modal-close"
                onClick={() => setManifestModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="cd-manifest-paper">
              {/* Manifest Government Header */}
              <div className="cd-manifest-header">
                <div className="cd-manifest-emblem">🇮🇳</div>
                <div className="cd-manifest-titles">
                  <h3>CENTRAL POLLUTION CONTROL BOARD</h3>
                  <h4>FORM - IV [See Rule 13]</h4>
                  <h2>BIO-MEDICAL WASTE TRANSFER MANIFEST</h2>
                  <p>Common Bio-Medical Waste Treatment Facility (CBWTF) Custody Document</p>
                </div>
                <div className="cd-manifest-qr">
                  <QRCodeCanvas
                    value={JSON.stringify({
                      doc: "CPCB_FORM_IV",
                      id: manifestModal.id,
                      hospital: manifestModal.hospital,
                      weight: manifestModal.weight,
                      date: new Date().toISOString(),
                    })}
                    size={90}
                    level="M"
                  />
                  <small>Verifiable CPCB Barcode</small>
                </div>
              </div>

              {/* Metadata strip */}
              <div className="cd-manifest-meta-grid">
                <div>
                  <small>Manifest Tracking ID</small>
                  <strong>CPCB-MS-{String(manifestModal.id || "001").slice(-6).toUpperCase()}</strong>
                </div>
                <div>
                  <small>Transfer Timestamp</small>
                  <strong>{new Date().toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <small>Vehicle Registration</small>
                  <strong>OD-02-AK-9412 (GPS Tracked)</strong>
                </div>
                <div>
                  <small>Compliance Status</small>
                  <strong className="cd-verified-text">✅ Form IV Compliant</strong>
                </div>
              </div>

              {/* Parties Table */}
              <table className="cd-manifest-table">
                <tbody>
                  <tr>
                    <th>1. Waste Generator (HCF)</th>
                    <td><strong>{manifestModal.hospital || "Hospital Facility"}</strong> (CPCB Registered)</td>
                  </tr>
                  <tr>
                    <th>2. Authorized Transporter</th>
                    <td>MediSort Bio-Hazard Fleet Logistics Ltd. (License #OD/BMW/2024/771)</td>
                  </tr>
                  <tr>
                    <th>3. Destination Facility</th>
                    <td>Odisha State Bio-Medical Waste Treatment & Disposal Plant, Chandaka / Tangi, Bhubaneswar</td>
                  </tr>
                  <tr>
                    <th>4. Waste Category & Code</th>
                    <td>
                      <span className="cd-cat-tag">🟡 {manifestModal.category || "Infectious Waste"}</span>
                    </td>
                  </tr>
                  <tr>
                    <th>5. Certified Quantity</th>
                    <td><strong>{formatWeight(manifestModal.weight)}</strong> Net Weight (Digital Load Cell Calibrated)</td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures & Stamps */}
              <div className="cd-manifest-signatures">
                <div className="cd-manifest-sig-box">
                  <small>Authorized Generator Signatory</small>
                  {manifestModal.signature ? (
                    <img
                      src={manifestModal.signature}
                      alt="Authorized Hospital Signature"
                      className="cd-manifest-sig-img"
                    />
                  ) : (
                    <div className="cd-sig-fallback">Digitally Certified via OTP / App</div>
                  )}
                  <strong>{manifestModal.staffName || "Hospital Ward In-charge"}</strong>
                  <span>{manifestModal.staffDesignation || "BMW Officer"}</span>
                </div>

                <div className="cd-manifest-sig-box">
                  <small>Certified Collector / Driver</small>
                  <div className="cd-collector-stamp">
                    <span className="cd-stamp-badge">VERIFIED</span>
                    <strong>MediSort Logistics</strong>
                    <span>Reg #BMW-OD-4091</span>
                  </div>
                  <strong>Field Operator</strong>
                  <span>Certified Hazardous Waste Specialist</span>
                </div>
              </div>

              <div className="cd-manifest-footer-note">
                <p>
                  * This document serves as official physical and electronic proof of Bio-Medical Waste custody transfer under the Central Pollution Control Board (CPCB) Bio-Medical Waste Management Rules, 2016. Any alteration invalidates this manifest.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ EMERGENCY INCIDENT & SPILL REPORT MODAL ═══ */}
      {incidentModal && (
        <div className="cd-modal-backdrop" onClick={() => setIncidentModal(null)}>
          <div
            className="cd-modal-dialog incident-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="cd-modal-header incident-header">
              <div>
                <h2>⚠️ Emergency Spill & Hazard Report</h2>
                <p>Log a biohazard puncture, chemical spill, or transport incident to central dispatch.</p>
              </div>
              <button
                type="button"
                className="cd-modal-close"
                onClick={() => setIncidentModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="cd-modal-body">
              {/* Incident Location & Target */}
              <div className="cd-incident-meta">
                <div>
                  <small>Incident Location / Facility</small>
                  <strong>{incidentModal.hospital || "Transit Route (Bhubaneswar Corridor)"}</strong>
                </div>
                <div>
                  <small>Vehicle Fleet</small>
                  <strong>OD-02-AK-9412 (Live GPS Active)</strong>
                </div>
              </div>

              {/* Incident Type Selector */}
              <div className="cd-form-group">
                <label>Incident Type</label>
                <div className="cd-incident-types-grid">
                  {[
                    { id: "Spill / Leakage", label: "☣️ Biohazard Spill / Leak", desc: "Liquid or biological waste containment breach" },
                    { id: "Bag Puncture", label: "💉 Punctured / Torn Bag", desc: "Sharp needle puncture or split color-coded bag" },
                    { id: "Transit Breakdown", label: "🚚 Vehicle Breakdown", desc: "Cold-chain or mechanical transit delay" },
                    { id: "Misclassification", label: "🏷️ Segregation Mismatch", desc: "Hospital misclassified waste color coding" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`cd-inc-type-card ${incidentType === t.id ? "active" : ""}`}
                      onClick={() => setIncidentType(t.id)}
                    >
                      <strong>{t.label}</strong>
                      <small>{t.desc}</small>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Selector */}
              <div className="cd-form-row">
                <div className="cd-form-group">
                  <label htmlFor="inc-sev">Severity Level</label>
                  <select
                    id="inc-sev"
                    className="cd-select"
                    value={incidentSeverity}
                    onChange={(e) => setIncidentSeverity(e.target.value)}
                  >
                    <option value="Minor">🟢 Minor (Under control / contained)</option>
                    <option value="Moderate">🟡 Moderate (Requires secondary pack)</option>
                    <option value="Critical">🔴 Critical (Immediate hazmat response)</option>
                  </select>
                </div>
                <div className="cd-form-group">
                  <label>Current Status</label>
                  <input type="text" readOnly value="Awaiting Dispatch Protocol" className="cd-input-readonly" />
                </div>
              </div>

              {/* Description */}
              <div className="cd-form-group">
                <label htmlFor="inc-desc">Incident Description & Immediate Measures Taken</label>
                <textarea
                  id="inc-desc"
                  rows={3}
                  className="cd-textarea"
                  placeholder="Describe breach details, spill kit usage, affected bags, or support needed..."
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                />
              </div>

              <div className="cd-incident-alert-banner">
                <span>🛡️ CPCB Incident Protocol: In case of major spills, apply 1% sodium hypochlorite bleach, cordon off the area, and do not transport uncontained residue.</span>
              </div>
            </div>

            <div className="cd-modal-footer">
              <button
                type="button"
                className="cd-btn-secondary"
                onClick={() => setIncidentModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cd-btn-incident-submit"
                disabled={isSubmittingIncident}
                onClick={submitIncident}
              >
                {isSubmittingIncident ? "Logging to Dispatch..." : "🚨 Log Incident & Alert Dispatch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CollectorDashboard;