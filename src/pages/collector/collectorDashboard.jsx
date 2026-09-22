
import "./CollectorDashboard.css";
import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
  getDocs,
  where
} from "firebase/firestore";
import { db } from "../../firebase";

function CollectorDashboard() {

    const [pickupRequests, setPickupRequests] = useState([]);
  const [scannedWaste, setScannedWaste] = useState(null);
const [collectorLocation, setCollectorLocation] = useState(null);

const getCollectorLocation = () => {
  if (!navigator.geolocation) {
    alert("GPS is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;

      setCollectorLocation({
        latitude,
        longitude,
      });

      console.log("Collector GPS:", latitude, longitude);
      alert(
        `Location found!\nLatitude: ${latitude}\nLongitude: ${longitude}`
      );
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
};
  const updateScannedWasteStatus = async (newStatus) => {
    if (!scannedWaste?.qrId) {
      alert("No waste batch has been scanned.");
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

      await updateDoc(doc(db, "wasteBatches", wasteDoc.id), {
        status: newStatus,
      });

      setScannedWaste((previous) => ({
        ...previous,
        status: newStatus,
      }));

      alert(`Waste status updated to ${newStatus}`);
    } catch (error) {
      console.error("Status update error:", error);
      alert("Failed to update waste status.");
    }
  };

  const startQRScanner = () => {
  const scanner = new Html5QrcodeScanner(
    "qr-reader",
    {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    },
    false
  );

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

        const wasteData = snapshot.docs[0].data();

        setScannedWaste({
          qrId: decodedText,
          ...wasteData,
        });

        scanner.clear();
      } catch (error) {
        console.error("Error finding waste batch:", error);
        alert("Failed to load waste batch.");
      }
    },
    (errorMessage) => {
      console.log("QR scan error:", errorMessage);
    }
  );
};


  const updatePickupStatus = async (requestId, newStatus) => {
    try {
      const requestRef = doc(db, "pickupRequests", requestId);

      await updateDoc(requestRef, {
        status: newStatus
      });

      alert(`Pickup status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating pickup status:", error);
      alert("Failed to update pickup status.");
    }
  };

  useEffect(() => {
    // your existing code...
    const pickupQuery = query(
      collection(db, "pickupRequests"),
      orderBy("requestedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      pickupQuery,
      (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPickupRequests(requests);
      },
      (error) => {
        console.error("Error loading pickup requests:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  return (

    <div className="collector-page">

      {/* SIDEBAR */}
      <aside className="collector-sidebar">

        <div className="collector-brand">
          <div className="collector-logo">✚</div>

          <div>
            <h2>MediSort</h2>
            <span>Collector Portal</span>
          </div>
        </div>

        <nav className="collector-nav">

          <button className="collector-nav-item active">
            🏠
            <span>Dashboard</span>
          </button>

          <button className="collector-nav-item">
            🚚
            <span>Pickup Requests</span>
          </button>

          <button className="collector-nav-item">
            📋
            <span>My Pickups</span>
          </button>

          <button className="collector-nav-item">
            📍
            <span>Routes</span>
          </button>

          <button className="collector-nav-item">
            📊
            <span>Reports</span>
          </button>

        </nav>

        <div className="collector-sidebar-bottom">

          <button className="collector-nav-item">
            👤
            <span>Profile</span>
          </button>

          <button className="collector-nav-item">
            ⚙️
            <span>Settings</span>
          </button>

        </div>

      </aside>


      {/* MAIN CONTENT */}
      <main className="collector-main">

        {/* TOP BAR */}
        <header className="collector-header">

          <div>
            <h1>Collector Dashboard</h1>
            <p>Manage your medical waste pickups efficiently.</p>
          </div>

          <div className="collector-user">

            <div className="collector-notification">
              🔔
            </div>

            <div className="collector-avatar">
              C
            </div>

            <div>
              <strong>Collector</strong>
              <span>Field Operator</span>
            </div>

          </div>

        </header>


        {/* WELCOME CARD */}
        <section className="collector-welcome">

          <div>
            <span className="collector-label">
              TODAY'S OPERATIONS
            </span>

            <h2>Ready for your next pickup? 🚚</h2>

            <p>
              View assigned medical waste pickups,
              update collection status and manage your route.
            </p>
          </div>

          <div className="collector-welcome-icon">
            🚚
          </div>

        </section>


        {/* STAT CARDS */}
        <section className="collector-stats">

          <div className="collector-stat-card">

            <div className="collector-stat-icon green">
              📋
            </div>

            <div>
              <span>Pending Pickups</span>
              <strong>5</strong>
              <small>Awaiting collection</small>
            </div>

          </div>


          <div className="collector-stat-card">

            <div className="collector-stat-icon blue">
              🚚
            </div>

            <div>
              <span>Today's Pickups</span>
              <strong>3</strong>
              <small>Assigned to you</small>
            </div>

          </div>


          <div className="collector-stat-card">

            <div className="collector-stat-icon purple">
              ✓
            </div>

            <div>
              <span>Completed</span>
              <strong>18</strong>
              <small>This month</small>
            </div>

          </div>


          <div className="collector-stat-card">

            <div className="collector-stat-icon orange">
              ⚖️
            </div>

            <div>
              <span>Waste Collected</span>
              <strong>245 kg</strong>
              <small>This month</small>
            </div>

          </div>

        </section>





        {/* PICKUP SECTION */}
        <section
         className="collector-content-grid">

          <div className="pickup-panel">

            <div className="panel-header">

              <div>
                <h2>Today's Pickup Requests</h2>
                <p>Manage your assigned collections.</p>
              </div>

              <button className="view-all-button">
                View All →
              </button>

            </div>


{/* COLLECTOR GPS LOCATION */}
{collectorLocation && (
  <div className="collector-location-card">
    <div className="location-icon">
      📍
    </div>

    <div className="location-info">
      <strong>Collector Location</strong>
      <span>
        GPS location detected successfully
      </span>

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


{/* QR SCANNER */}

<div className="qr-scanner-card">

  <div className="qr-scanner-header">
    <div>
      <h2>📷 Scan Waste QR</h2>
      <p>Scan the QR code attached to a waste batch</p>
    </div>

    <button
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
        <strong>{scannedWaste.hospital}</strong>
      </div>

      <div>
        <small>Waste Type</small>
        <strong>{scannedWaste.wasteType}</strong>
      </div>

      <div>
        <small>Category</small>
        <strong>{scannedWaste.category}</strong>
      </div>

      <div>
        <small>Weight</small>
        <strong>{scannedWaste.weight} kg</strong>
      </div>

      <div>
        <small>Status</small>
        <strong>{scannedWaste.status}</strong>
      </div>

    </div>

  </div>
)}

</div>

<div className="scanned-waste-actions">

  <button
    className="scan-status-button transit"
    onClick={() => updateScannedWasteStatus("In Transit")}
  >
    🚚 Mark In Transit
  </button>

  <button
    className="scan-status-button collected"
    onClick={() => updateScannedWasteStatus("Collected")}
  >
    ✅ Mark Collected
  </button>

</div>



  {/* 👇 PASTE THE NEW CODE HERE 👇 */}

  {pickupRequests.length === 0 ? (
    <div className="no-pickups">
      <p>No pickup requests available.</p>
    </div>
  ) : (
    pickupRequests.map((request) => (
      <div className="pickup-card" key={request.id}>

        <div className="pickup-icon">
          🏥
        </div>

        <div className="pickup-info">
          <h3>{request.hospital || "Hospital"}</h3>

          <p>📍 Medical Waste Collection</p>

          <div className="pickup-details">
            <span>🟡 {request.category || "Mixed"}</span>
            <span>⚖️ {request.weight || 0} kg</span>
          </div>
        </div>
<div className="pickup-actions">
          <button
            type="button"
            className="pickup-status pending"
            onClick={() => updatePickupStatus(request.id, "Collected")}
          >
            Mark Collected
          </button>

          <button
            type="button"
            className="pickup-update-button"
            onClick={() =>
              updatePickupStatus(
                request.id,
                request.status === "Collected" ? "In Transit" : "Collected"
              )
            }
          >
            {request.status === "Collected" ? "Mark In Transit" : "Mark Collected"}
          </button>
        </div>
      </div>
    ))
  )}

  {/* 👆 NEW CODE ENDS HERE 👆 */}

</div>

          {/* QUICK ACTIONS */}
          <div className="quick-panel">

            <div className="panel-header">

              <div>
                <h2>Quick Actions</h2>
                <p>Common collector tasks.</p>
              </div>

            </div>

           <button
  className="quick-action"
  onClick={getCollectorLocation}
>
  <div className="quick-action-icon">
    📍
  </div>

  <div>
    <strong>My Location</strong>
    <span>Get current GPS position</span>
  </div>
</button>
            <button className="quick-action">
              <span>📱</span>
              <div>
                <strong>Scan QR</strong>
                <small>Verify a waste batch</small>
              </div>
              <b>→</b>
            </button>

            <button className="quick-action">
              <span>✓</span>
              <div>
                <strong>Update Pickup</strong>
                <small>Change collection status</small>
              </div>
              <b>→</b>
            </button>

          </div>

    </section>

      </main>

    </div>
  );
}

export default CollectorDashboard;