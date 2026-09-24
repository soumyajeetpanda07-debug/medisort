import "./CollectorDashboard.css";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
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

function CollectorDashboard() {
  const [activeView, setActiveView] = useState("Dashboard");
  const [pickupRequests, setPickupRequests] = useState([]);
  const [wasteBatches, setWasteBatches] = useState([]);
  const [scannedWaste, setScannedWaste] = useState(null);
  const [collectorLocation, setCollectorLocation] = useState(null);
  const [firebaseError, setFirebaseError] = useState("");
  const scannerRef = useRef(null);

  useEffect(() => {
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
      },
      (error) => {
        console.error("Error loading pickup requests:", error);
        setFirebaseError(
          "Could not load pickup requests. Check your Firebase connection and permissions."
        );
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
      },
      (error) => {
        console.error("Error loading waste batches:", error);
        setFirebaseError(
          "Could not load waste batches. Check your Firebase connection and permissions."
        );
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

  function getCollectorLocation() {
    if (!navigator.geolocation) {
      alert("GPS is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setCollectorLocation({ latitude, longitude });
        console.log("Collector GPS:", latitude, longitude);
        alert(`Location found!\nLatitude: ${latitude}\nLongitude: ${longitude}`);
      },
      (error) => {
        console.error("GPS error:", error);

        if (error.code === 1) {
          alert("Location permission was denied.");
        } else if (error.code === 2) {
          alert("Location could not be determined.");
        } else {
          alert("Unable to get your location.");
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
      alert("This pickup has already been collected.");
      return;
    }

    if (newStatus !== allowedNextStatus) {
      alert(
        `Pickup status must move from ${currentStatus} to ${allowedNextStatus}.`
      );
      return;
    }

    try {
      const updates = { status: newStatus };

      if (newStatus === "Collected") {
        updates.collectedAt = new Date();
      }

      await updateDoc(doc(db, "pickupRequests", request.id), updates);
      alert(`Pickup status updated to ${newStatus}.`);
    } catch (error) {
      console.error("Error updating pickup status:", error);
      alert("Failed to update pickup status.");
    }
  }

  async function updateScannedWasteStatus(newStatus) {
    if (!scannedWaste?.qrId) {
      alert("No waste batch has been scanned.");
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
      alert("This waste batch has already been collected.");
      return;
    }

    if (newStatus !== allowedNextStatus) {
      alert(
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
        alert("Waste batch not found.");
        return;
      }

      const wasteDoc = snapshot.docs[0];
      const updates = { status: newStatus };

      if (newStatus === "Collected") {
        updates.collectedAt = new Date();
      }

      await updateDoc(doc(db, "wasteBatches", wasteDoc.id), updates);
      setScannedWaste((previous) => ({ ...previous, ...updates }));
      alert(`Waste status updated to ${newStatus}.`);
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update waste status.");
    }
  }

  function startQRScanner() {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(
      async (decodedText) => {
        console.log("QR Scanned:", decodedText);

        try {
          const wasteQuery = query(
            collection(db, "wasteBatches"),
            where("qrId", "==", decodedText)
          );
          const snapshot = await getDocs(wasteQuery);

          if (snapshot.empty) {
            alert("Waste batch not found in Firebase.");
            return;
          }

          const batchDoc = snapshot.docs[0];
          setScannedWaste({
            id: batchDoc.id,
            qrId: decodedText,
            ...batchDoc.data(),
          });

          await scanner.clear();
          scannerRef.current = null;
        } catch (error) {
          console.error("Error finding waste batch:", error);
          alert("Failed to load waste batch.");
        }
      },
      (errorMessage) => {
        console.log("QR scan message:", errorMessage);
      }
    );
  }

  function renderPickupList() {
    if (pickupRequests.length === 0) {
      return (
        <div className="no-pickups">
          <p>No pickup requests available.</p>
        </div>
      );
    }

    return pickupRequests.map((request) => {
      const status = normalizeStatus(request.status);
      const nextStatus =
        status === "Pending"
          ? "In Transit"
          : status === "In Transit"
            ? "Collected"
            : null;

      return (
        <div className="pickup-card" key={request.id}>
          <div className="pickup-icon">🏥</div>

          <div className="pickup-info">
            <h3>{request.hospital || "Hospital"}</h3>
            <p>📍 Medical Waste Collection</p>
            <div className="pickup-details">
              <span>🟡 {request.category || "Mixed"}</span>
              <span>⚖️ {getWeight(request)} kg</span>
              <span>Status: {status}</span>
            </div>
          </div>

          <div className="pickup-actions">
            <span
              className={`pickup-status ${status
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {status}
            </span>

            {nextStatus && (
              <button
                type="button"
                className="pickup-update-button"
                onClick={() => updatePickupStatus(request, nextStatus)}
              >
                {nextStatus === "In Transit"
                  ? "Mark In Transit"
                  : "Mark Collected"}
              </button>
            )}
          </div>
        </div>
      );
    });
  }

  const navItems = [
    { label: "Dashboard", icon: "🏠" },
    { label: "Pickup Requests", icon: "🚚" },
    { label: "My Pickups", icon: "📋" },
    { label: "Routes", icon: "📍" },
    { label: "Reports", icon: "📊" },
  ];

  const showingPickupList = [
    "Dashboard",
    "Pickup Requests",
    "My Pickups",
  ].includes(activeView);

  return (
    <div className="collector-page">
      <aside className="collector-sidebar">
        <div className="collector-brand">
          <div className="collector-logo">✚</div>
          <div>
            <h2>MediSort</h2>
            <span>Collector Portal</span>
          </div>
        </div>

        <nav className="collector-nav">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.label}
              className={`collector-nav-item ${
                activeView === item.label ? "active" : ""
              }`}
              onClick={() => setActiveView(item.label)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="collector-sidebar-bottom">
          <button
            type="button"
            className={`collector-nav-item ${
              activeView === "Profile" ? "active" : ""
            }`}
            onClick={() => setActiveView("Profile")}
          >
            👤
            <span>Profile</span>
          </button>

          <button
            type="button"
            className={`collector-nav-item ${
              activeView === "Settings" ? "active" : ""
            }`}
            onClick={() => setActiveView("Settings")}
          >
            ⚙️
            <span>Settings</span>
          </button>
        </div>
      </aside>

      <main className="collector-main">
        <header className="collector-header">
          <div>
            <h1>
              {activeView === "Dashboard"
                ? "Collector Dashboard"
                : activeView}
            </h1>
            <p>Manage your medical waste pickups efficiently.</p>
          </div>

          <button
            type="button"
            onClick={() => window.location.assign("/")}
            style={{
              padding: "10px 16px",
              border: "none",
              borderRadius: "8px",
              backgroundColor: "#0f766e",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🏠 Hospital Home / Front Page
          </button>

          <div className="collector-user">
            <div className="collector-notification">🔔</div>
            <div className="collector-avatar">C</div>
            <div>
              <strong>Collector</strong>
              <span>Field Operator</span>
            </div>
          </div>
        </header>

        {firebaseError && (
          <div className="no-pickups" role="alert">
            <p>{firebaseError}</p>
          </div>
        )}

        {activeView === "Dashboard" && (
          <>
            <section className="collector-welcome">
              <div>
                <span className="collector-label">TODAY&apos;S OPERATIONS</span>
                <h2>Ready for your next pickup? 🚚</h2>
                <p>
                  View assigned medical waste pickups, update collection
                  status and manage your route.
                </p>
              </div>
              <div className="collector-welcome-icon">🚚</div>
            </section>

            <section className="collector-stats">
              <div className="collector-stat-card">
                <div className="collector-stat-icon green">📋</div>
                <div>
                  <span>Pending Pickups</span>
                  <strong>{pendingPickups}</strong>
                  <small>Awaiting collection</small>
                </div>
              </div>

              <div className="collector-stat-card">
                <div className="collector-stat-icon blue">🚚</div>
                <div>
                  <span>Today&apos;s Pickups</span>
                  <strong>{todaysPickups}</strong>
                  <small>Requested today</small>
                </div>
              </div>

              <div className="collector-stat-card">
                <div className="collector-stat-icon purple">✓</div>
                <div>
                  <span>Completed This Month</span>
                  <strong>{completedThisMonth}</strong>
                  <small>Collected pickups</small>
                </div>
              </div>

              <div className="collector-stat-card">
                <div className="collector-stat-icon orange">⚖️</div>
                <div>
                  <span>Waste Collected</span>
                  <strong>
                    {wasteCollectedThisMonth.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    kg
                  </strong>
                  <small>This month</small>
                </div>
              </div>
            </section>
          </>
        )}

        {showingPickupList ? (
          <section className="collector-content-grid">
            <div className="pickup-panel">
              <div className="panel-header">
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
                    className="view-all-button"
                    onClick={() => setActiveView("Pickup Requests")}
                  >
                    View All →
                  </button>
                )}
              </div>

              {activeView === "Dashboard" && (
                <>
                  {collectorLocation && (
                    <div className="collector-location-card">
                      <div className="location-icon">📍</div>
                      <div className="location-info">
                        <strong>Collector Location</strong>
                        <span>GPS location detected successfully</span>
                        <div className="coordinates">
                          <span>
                            Latitude: {collectorLocation.latitude.toFixed(6)}
                          </span>
                          <span>
                            Longitude: {collectorLocation.longitude.toFixed(6)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="qr-scanner-card">
                    <div className="qr-scanner-header">
                      <div>
                        <h2>📷 Scan Waste QR</h2>
                        <p>Scan the QR code attached to a waste batch</p>
                      </div>
                      <button
                        type="button"
                        className="qr-scan-button"
                        onClick={startQRScanner}
                      >
                        Start Scanner
                      </button>
                    </div>

                    <div id="qr-reader"></div>

                    {scannedWaste && (
                      <div className="scanned-result">
                        <div className="scanned-result-header">
                          <strong>✅ Waste Batch Found</strong>
                          <span>QR verified successfully</span>
                        </div>

                        <div className="scanned-waste-details">
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
                            <strong>{getWeight(scannedWaste)} kg</strong>
                          </div>
                          <div>
                            <small>Status</small>
                            <strong>
                              {normalizeStatus(scannedWaste.status)}
                            </strong>
                          </div>
                        </div>

                        <div className="scanned-waste-actions">
                          <button
                            type="button"
                            className="scan-status-button transit"
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
                            className="scan-status-button collected"
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
                  </div>
                </>
              )}

              {activeView !== "Dashboard" && (
                <div className="quick-panel">
                  <button
                    type="button"
                    className="quick-action"
                    onClick={getCollectorLocation}
                  >
                    <div className="quick-action-icon">📍</div>
                    <div>
                      <strong>My Location</strong>
                      <span>Get current GPS position</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="quick-action"
                    onClick={() => setActiveView("Dashboard")}
                  >
                    <span>📷</span>
                    <div>
                      <strong>Scan QR</strong>
                      <small>Open the scanner on Dashboard</small>
                    </div>
                    <b>→</b>
                  </button>
                </div>
              )}

              {renderPickupList()}
            </div>

            {activeView === "Dashboard" && (
              <div className="quick-panel">
                <div className="panel-header">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>Common collector tasks.</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="quick-action"
                  onClick={getCollectorLocation}
                >
                  <div className="quick-action-icon">📍</div>
                  <div>
                    <strong>My Location</strong>
                    <span>Get current GPS position</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={startQRScanner}
                >
                  <span>📱</span>
                  <div>
                    <strong>Scan QR</strong>
                    <small>Verify a waste batch</small>
                  </div>
                  <b>→</b>
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() => setActiveView("Pickup Requests")}
                >
                  <span>✓</span>
                  <div>
                    <strong>Update Pickup</strong>
                    <small>Open pickup requests</small>
                  </div>
                  <b>→</b>
                </button>
              </div>
            )}
          </section>
        ) : (
          <section className="collector-content-grid">
            <div className="pickup-panel">
              <div className="panel-header">
                <div>
                  <h2>{activeView}</h2>
                  <p>This section is not connected to a page in the current app.</p>
                </div>
              </div>
              <button
                type="button"
                className="view-all-button"
                onClick={() => setActiveView("Dashboard")}
              >
                Back to Dashboard
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default CollectorDashboard;