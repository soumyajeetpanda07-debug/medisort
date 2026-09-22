 import { useEffect, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import AddWaste from "./AddWaste";
import "../../App.css"
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  limit
} from "firebase/firestore";
import { db } from "../../firebase";
 
function HospitalDashboard() {

  const [pickupRequests, setPickupRequests] = useState([]);
const [qrValue, setQrValue] = useState("MEDISORT-WASTE-AAROGYA-001");
  useEffect(() => {
    const pickupQuery = query(
      collection(db, "pickupRequests"),
      orderBy("requestedAt", "desc")
    );

    const unsubscribe = onSnapshot(pickupQuery, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPickupRequests(requests);
    });

    return () => unsubscribe();
  }, []);

  const handleGenerateQR = async () => {
  try {
    // Get the latest waste record saved from Add Waste
    const wasteQuery = query(
      collection(db, "wasteRecords"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const wasteSnapshot = await getDocs(wasteQuery);

    if (wasteSnapshot.empty) {
      alert("⚠️ Please add and save a waste record before generating QR.");
      return;
    }

    // Get latest waste record
    const latestWaste = wasteSnapshot.docs[0].data();

    const newId = `MEDISORT-WASTE-${Date.now()}`;

    // Create QR waste batch with actual waste details
    await addDoc(collection(db, "wasteBatches"), {
      qrId: newId,
      hospital: latestWaste.hospital || "Aarogya Hospital",
      wasteType: latestWaste.wasteType || "Biomedical Waste",
      category: latestWaste.category || "Mixed",
      weight: Number(latestWaste.weight) || 0,
      status: "Pending",
      createdAt: serverTimestamp(),
    });

    setQrValue(newId);

    alert(
      `✅ QR code generated!\n\n` +
      `Waste: ${latestWaste.wasteType}\n` +
      `Category: ${latestWaste.category}\n` +
      `Weight: ${latestWaste.weight} kg`
    );

  } catch (error) {
    console.error("QR generation error:", error);
    alert("❌ Failed to generate QR code.");
  }
};



 const handleRequestPickup = async () => {
  try {
    // Check if this hospital already has an active pickup request
    const activeRequest = pickupRequests.find(
      (request) =>
        request.hospital === "Aarogya Hospital" &&
        (request.status === "Pending" ||
          request.status === "In Transit")
    );

    if (activeRequest) {
      alert(
        `A pickup request is already ${activeRequest.status.toLowerCase()}.`
      );
      return;
    }

    // Create a new pickup request
    await addDoc(collection(db, "pickupRequests"), {
      hospital: "Aarogya Hospital",
      wasteType: "Biomedical Waste",
      weight: 0,
      category: "Mixed",
      status: "Pending",
      requestedAt: serverTimestamp(),
    });

    alert("Pickup request sent successfully!");
  } catch (error) {
    console.error("Pickup request error:", error);
    alert("Failed to send pickup request.");
  }
};

  const [page, setPage] = useState("dashboard");

  // your existing code continues...


  // Open Add Waste page
  if (page === "addWaste") {
    return <AddWaste />;
  }

  const wasteData = [
    {
      id: "MED-004",
      type: "Used Syringe",
      category: "WHITE",
      weight: "5.7 kg",
      date: "14 Sep, 09:14 AM",
      status: "Logged",
    },
    {
      id: "MED-003",
      type: "Gloves & Masks",
      category: "RED",
      weight: "3.2 kg",
      date: "14 Sep, 08:45 AM",
      status: "Logged",
    },
    {
      id: "MED-002",
      type: "Bandages & Cotton",
      category: "YELLOW",
      weight: "5.5 kg",
      date: "14 Sep, 08:12 AM",
      status: "Logged",
    },
    {
      id: "MED-001",
      type: "IV Bottle",
      category: "BLUE",
      weight: "2.8 kg",
      date: "13 Sep, 05:20 PM",
      status: "Logged",
    },
  ];

  const categoryClass = (category) => {
    return `ms-category ms-${category.toLowerCase()}`;
  };

  return (
    <div className="ms-dashboard">

      {/* ================= SIDEBAR ================= */}
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
            className={`ms-nav-item ${
              page === "dashboard" ? "active" : ""
            }`}
            onClick={() => setPage("dashboard")}
          >
            <span className="ms-nav-icon">⌂</span>
            Dashboard
          </button>

          <button
            className="ms-nav-item"
            onClick={() => setPage("addWaste")}
          >
            <span className="ms-nav-icon">＋</span>
            Add Waste
          </button>

<button
  className="ms-nav-item"
  onClick={handleRequestPickup}
>
  <span className="ms-nav-icon">🚚</span>
  Request Pickup
</button>


          <button
            className="ms-nav-item"
            onClick={() => alert("Waste Records page will be connected soon.")}
          >
            <span className="ms-nav-icon">▣</span>
            Waste Records
          </button>

          <button
            className="ms-nav-item"
            onClick={() => alert("Reports & Analytics will be added later.")}
          >
            <span className="ms-nav-icon">▥</span>
            Reports & Analytics
          </button>

          <button
            className="ms-nav-item"
            onClick={() => alert("Guidelines section will be added later.")}
          >
            <span className="ms-nav-icon">▤</span>
            Guidelines
          </button>

          <button
            className="ms-nav-item"
            onClick={() => alert("Profile section will be added later.")}
          >
            <span className="ms-nav-icon">♙</span>
            Profile
          </button>

          <button
            className="ms-nav-item"
            onClick={() => alert("Settings section will be added later.")}
          >
            <span className="ms-nav-icon">⚙</span>
            Settings
          </button>

        </nav>

        <div className="ms-sidebar-footer">
          <div className="ms-leaf"> 🌿</div>
          <div>
            <strong>A Cleaner</strong>
            <strong>Healthier</strong>
            <strong>Tomorrow</strong>
          </div>

          <small>MediSort v1.0</small>
        </div>

      </aside>


      {/* ================= MAIN AREA ================= */}
      <main className="ms-main">

        {/* TOP BAR */}
        <header className="ms-topbar">

          <button className="ms-menu-button">
            ☰
          </button>

          <div className="ms-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search waste records, pickups, reports..."
            />
          </div>

          <div className="ms-user-area">

            <button className="ms-notification">
              🔔
              <span>3</span>
            </button>

            <div className="ms-avatar">
              AH
            </div>

            <div className="ms-user-info">
              <strong>AAROGYA Hospital</strong>
              <span>Hospital User</span>
            </div>

            <span className="ms-chevron">⌄</span>

          </div>

        </header>


        {/* CONTENT */}
        <div className="ms-content">

          {/* ================= WELCOME ================= */}
          <section className="ms-welcome">

            <div className="ms-welcome-text">

              <span className="ms-welcome-small">
                Welcome Back!
              </span>

              <h1>
                🏥 AAROGYA Hospital
              </h1>

              <p>
                Your actions make a cleaner, safer and healthier
                tomorrow.
              </p>

            </div>

            <div className="ms-welcome-message">
              <strong>Safe Waste</strong>
              <strong>Healthy People</strong>
              <strong>Greener Future</strong>
            </div>

            <div className="ms-welcome-leaf">
              🌿
            </div>

          </section>


          {/* ================= KPI CARDS ================= */}
          <section className="ms-stat-grid">

            <div className="ms-stat-card">

              <div className="ms-stat-icon green">
                🗑️
              </div>

              <div>
                <span>Today's Waste</span>
                <h2>57 kg</h2>
                <small className="positive">
                  ↑ 12% from yesterday
                </small>
              </div>

            </div>


            <div className="ms-stat-card">

              <div className="ms-stat-icon orange">
                🚚
              </div>

              <div>
                <span>Pending Pickups</span>
                <h2>
                  {pickupRequests.filter(
                    (request) => request.status === "Pending"
                  ).length}
                </h2>
                <small>Awaiting collection</small>
              </div>

            </div>


            <div className="ms-stat-card blue-card">

              <div className="ms-stat-icon blue">
                ✓
              </div>

              <div>
                <span>Collected This Month</span>
                <h2>245 kg</h2>
                <small className="positive">
                  ↑ 18% from last month
                </small>
              </div>

            </div>


            <div className="ms-stat-card">

              <div className="ms-stat-icon pink">
                🛡️
              </div>

              <div>
                <span>Compliance Rate</span>
                <h2>98.4%</h2>
                <small className="positive">
                  ● Excellent
                </small>
              </div>

            </div>

          </section>


          {/* ================= MAIN GRID ================= */}
          <section className="ms-main-grid">


            {/* RECENT RECORDS */}
            <div className="ms-card ms-records-card">

              <div className="ms-card-header">
+
                <div>
                  <h2>▣ Recent Waste Records</h2>
                  <p>Latest waste entries from your hospital</p>
                </div>

                <button
                  onClick={() =>
                    alert("Full Waste Records will be connected later.")
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
                      <th>Date & Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    {wasteData.map((item) => (

                      <tr key={item.id}>

                        <td className="record-id">
                          {item.id}
                        </td>

                        <td>
                          {item.type}
                        </td>

                        <td>
                          <span className={categoryClass(item.category)}>
                            {item.category}
                          </span>
                        </td>

                        <td>
                          <strong>{item.weight}</strong>
                        </td>

                        <td>
                          {item.date}
                        </td>

                        <td>
                          <span className="ms-status">
                            <i></i>
                            {item.status}
                          </span>
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>
{/* LIVE PICKUP STATUS */}
<div className="ms-card pickup-status-card">

  <div className="ms-card-header">
    <div>
      <h2>🚚 Pickup Status</h2>
      <p>Live status of your waste collection request</p>
    </div>
  </div>

  {pickupRequests.length === 0 ? (
    <div className="no-pickup-status">
      <p>No pickup request found.</p>
    </div>
  ) : (
    pickupRequests.slice(0, 3).map((request) => (
      <div className="hospital-pickup-row" key={request.id}>

        <div className="hospital-pickup-info">
          <strong>
            {request.hospital || "Hospital"}
          </strong>

          <span>
            Biomedical Waste Collection
          </span>
        </div>

        <div
          className={`hospital-pickup-status ${
            request.status?.toLowerCase().replace(/\s+/g, "-") ||
            "pending"
          }`}
        >
          {request.status || "Pending"}
        </div>

      </div>
    ))
  )}

</div>
{/* QR WASTE TRACKING */}
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
        Generate a unique QR code for a waste collection batch.
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
            {/* RIGHT COLUMN */}
            <div className="ms-right-column">


              {/* QUICK ACTIONS */}
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
>
  <span>🚚</span>
  <strong>Request Pickup</strong>
  <small>Schedule collection</small>
</button>

                  <button
                    className="ms-action purple-action"
                    onClick={() =>
                      alert("Reports module will be added later.")
                    }
                  >
                    <span>▥</span>
                    <strong>View Reports</strong>
                    <small>Analyze waste data</small>
                  </button>


                  <button
                    className="ms-action yellow-action"
                    onClick={() =>
                      alert("Segregation guidelines will be added later.")
                    }
                  >
                    <span>📖</span>
                    <strong>Guidelines</strong>
                    <small>Segregation rules</small>
                  </button>

                </div>

              </div>


              {/* WASTE DISTRIBUTION */}
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
                      <strong>57 kg</strong>
                      <span>Total</span>
                    </div>

                  </div>


                  <div className="ms-legend">

                    <div>
                      <i className="yellow-dot"></i>
                      <span>Infectious</span>
                      <strong>42%</strong>
                    </div>

                    <div>
                      <i className="red-dot"></i>
                      <span>Contaminated</span>
                      <strong>30%</strong>
                    </div>

                    <div>
                      <i className="white-dot"></i>
                      <span>Sharps</span>
                      <strong>11%</strong>
                    </div>

                    <div>
                      <i className="blue-dot"></i>
                      <span>Glass</span>
                      <strong>9%</strong>
                    </div>

                    <div>
                      <i className="black-dot"></i>
                      <span>General</span>
                      <strong>8%</strong>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* ================= BOTTOM SECTION ================= */}
          <section className="ms-bottom-grid">


            {/* PICKUP SCHEDULE */}
            <div className="ms-card">

              <div className="ms-card-header">

                <div>
                  <h2>🚚 Pickup Schedule</h2>
                  <p>Upcoming waste collections</p>
                </div>

                <button>
                  View All →
                </button>

              </div>


              <div className="ms-pickup-list">

                <div className="ms-pickup">
                  <span className="pickup-dot green-dot"></span>

                  <div>
                    <strong>Today, 10:00 AM</strong>
                    <small>Ward 4B</small>
                  </div>

                  <span className="scheduled">
                    Scheduled
                  </span>
                </div>


                <div className="ms-pickup">
                  <span className="pickup-dot blue-dot"></span>

                  <div>
                    <strong>Today, 12:00 PM</strong>
                    <small>Ward 2B</small>
                  </div>

                  <span className="scheduled">
                    Scheduled
                  </span>
                </div>


                <div className="ms-pickup">
                  <span className="pickup-dot orange-dot"></span>

                  <div>
                    <strong>Tomorrow, 09:00 AM</strong>
                    <small>Ward 1A</small>
                  </div>

                  <span className="pending">
                    Pending
                  </span>
                </div>


                <div className="ms-pickup">
                  <span className="pickup-dot pink-dot"></span>

                  <div>
                    <strong>Tomorrow, 03:00 PM</strong>
                    <small>Ward 3A</small>
                  </div>

                  <span className="pending">
                    Pending
                  </span>
                </div>

              </div>

            </div>


            {/* ALERTS */}
            <div className="ms-card ms-alert-card">

              <div className="ms-card-header">

                <div>
                  <h2>🔔 Alerts & Notifications</h2>
                  <p>Important updates</p>
                </div>

                <button>
                  View All →
                </button>

              </div>


              <div className="ms-alert-list">

                <div className="ms-alert overdue">
                  <span>!</span>

                  <div>
                    <strong>Pickup Overdue</strong>
                    <small>Ward 3A • 2h ago</small>
                  </div>
                </div>


                <div className="ms-alert warning">
                  <span>⚠</span>

                  <div>
                    <strong>High Infectious Waste</strong>
                    <small>Ward 2B • 4h ago</small>
                  </div>
                </div>


                <div className="ms-alert info">
                  <span>i</span>

                  <div>
                    <strong>New Guidelines Updated</strong>
                    <small>8h ago</small>
                  </div>
                </div>

              </div>

            </div>

          </section>


          {/* ================= FOOTER MESSAGE ================= */}
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