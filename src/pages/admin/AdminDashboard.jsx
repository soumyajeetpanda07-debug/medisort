
import "./AdminDashboard.css";
import { useEffect, useState } from "react";

import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../firebase";

function AdminDashboard() {
  // =========================================================
  // DASHBOARD DATA
  // =========================================================

  const [pickupCount, setPickupCount] = useState(0);
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

  // =========================================================
  // HOSPITAL DATA
  // =========================================================

  const [hospitals, setHospitals] = useState([]);

  // Search
  const [hospitalSearch, setHospitalSearch] = useState("");

  // Add hospital form
  const [showHospitalForm, setShowHospitalForm] = useState(false);
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalLocation, setHospitalLocation] = useState("");
  const [hospitalContact, setHospitalContact] = useState("");
  const [hospitalStatus, setHospitalStatus] = useState("Active");

  // =========================================================
  // PICKUP REQUESTS
  // =========================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "pickupRequests"),
      (snapshot) => {
        setPickupCount(snapshot.size);
      },
      (error) => {
        console.error("Error loading pickup requests:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================================
  // WASTE COLLECTED
  // =========================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "wasteBatches"),
      (snapshot) => {
        let total = 0;

        snapshot.forEach((document) => {
          const waste = document.data();

          if (waste.status === "Collected") {
            total += Number(waste.weight) || 0;
          }
        });

        setWasteCollected(total);
      },
      (error) => {
        console.error("Error loading collected waste:", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================================================
  // ACTIVE COLLECTIONS
  // =========================================================

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "wasteBatches"),
      (snapshot) => {
        let activeCount = 0;

        snapshot.forEach((document) => {
          const waste = document.data();

          if (waste.status === "In Transit") {
            activeCount++;
          }
        });

        setActiveCollections(activeCount);
      },
      (error) => {
        console.error("Error loading active collections:", error);
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
  // ADD HOSPITAL
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

      // Clear form
      setHospitalName("");
      setHospitalLocation("");
      setHospitalContact("");
      setHospitalStatus("Active");

      // Close form
      setShowHospitalForm(false);
    } catch (error) {
      console.error("Error adding hospital:", error);
      alert("❌ Failed to add hospital.");
    }
  };

  // =========================================================
  // DELETE HOSPITAL
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






  const handleDeleteHospital = async (hospitalId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this hospital?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await deleteDoc(doc(db, "hospitals", hospitalId));

      alert("Hospital deleted successfully.");
    } catch (error) {
      console.error("Error deleting hospital:", error);
      alert("Failed to delete hospital.");
    }
  };

  // =========================================================
  // FILTER HOSPITALS
  // =========================================================
const filteredHospitals = hospitals.filter((hospital) =>
  hospital.name?.toLowerCase().includes(hospitalSearch.toLowerCase())
);

const filteredCollectors = collectors.filter((collector) =>
  collector.name
    ?.toLowerCase()
    .includes(collectorSearch.toLowerCase())
);

 const filteredWasteRecords = wasteRecords.filter((record) => {
  const search = wasteSearch.toLowerCase();

  return (
    record.wasteType?.toLowerCase().includes(search) ||
    record.category?.toLowerCase().includes(search) ||
    record.hospital?.toLowerCase().includes(search)
  );
});
  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="admin-dashboard">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="admin-sidebar">

        {/* LOGO */}

        <div className="admin-logo">
          <div className="admin-logo-icon">
            ♻
          </div>

          <div>
            <h2>MediSort</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="admin-nav">

          {/* DASHBOARD */}

          <button
            className={`admin-nav-item ${
              adminPage === "dashboard" ? "active" : ""
            }`}
            onClick={() => setAdminPage("dashboard")}
          >
            📊
            <span>Dashboard</span>
          </button>

          {/* HOSPITALS */}

          <button
            className={`admin-nav-item ${
              adminPage === "hospitals" ? "active" : ""
            }`}
            onClick={() => setAdminPage("hospitals")}
          >
            🏥
            <span>Hospitals</span>
          </button>

          {/* COLLECTORS */}
<button
  className={`admin-nav-item ${
    adminPage === "collectors" ? "active" : ""
  }`}
  onClick={() => setAdminPage("collectors")}
>
  🚚
  <span>Collectors</span>
</button>
         
<button
  className={`admin-nav-item ${
    adminPage === "wasteRecords" ? "active" : ""
  }`}
  onClick={() => setAdminPage("wasteRecords")}
>
  ♻️
  <span>Waste Records</span>
</button>






          {/* REPORTS */}

          <button className="admin-nav-item">
            📈
            <span>Reports</span>
          </button>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="admin-sidebar-bottom">

          <button className="admin-nav-item">
            ⚙️
            <span>Settings</span>
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

            {/* HEADER */}

            <header className="hospital-page-header">

              <div>
                <p className="admin-eyebrow">
                  MediSort Administration
                </p>

                <h1>Hospitals</h1>

                <p>
                  Manage registered hospitals and their information.
                </p>
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
                placeholder="Search hospitals..."
                value={hospitalSearch}
                onChange={(e) =>
                  setHospitalSearch(e.target.value)
                }
              />

            </div>


            {/* HOSPITAL LIST */}

            <div className="hospital-list-card">

              <div className="hospital-list-header">

                <div>
                  <h2>Registered Hospitals</h2>

                  <p>
                    Hospitals connected to MediSort
                  </p>
                </div>
<span>
  {filteredHospitals.length}{" "}
  {filteredHospitals.length === 1 ? "Hospital" : "Hospitals"}
</span>
               
              </div>np


              {/* EMPTY STATE */}

              {filteredHospitals.length === 0 ? (

                <div className="empty-hospitals">

                  <div className="empty-hospital-icon">
                    🏥
                  </div>

                  <h3>
                    No hospitals found
                  </h3>

                  <p>
                    Add a hospital to get started.
                  </p>

                </div>

              ) : (

                <div className="hospital-table">

                  {/* TABLE HEADER */}

                  <div className="hospital-table-row hospital-table-heading">

                    <span>
                      Hospital Name
                    </span>

                    <span>
                      Location
                    </span>

                    <span>
                      Contact
                    </span>

                    <span>
                      Status
                    </span>

                    <span>
                      Action
                    </span>

                  </div>


                  {/* HOSPITALS */}

                  {filteredHospitals.map((hospital) => (

                    <div
                      className="hospital-table-row"
                      key={hospital.id}
                    >

                      <span>
                        <strong>
                          {hospital.name}
                        </strong>
                      </span>

                      <span>
                        {hospital.location}
                      </span>

                      <span>
                        {hospital.contact || "—"}
                      </span>

                      <span>

                        <span
                          className={`hospital-status ${
                            hospital.status === "Inactive"
                              ? "inactive"
                              : ""
                          }`}
                        >
                          {hospital.status || "Active"}
                        </span>

                      </span>

                      <span>

                        <button
                          className="delete-hospital-btn"
                          onClick={() =>
                            handleDeleteHospital(
                              hospital.id
                            )
                          }
                        >
                          Delete
                        </button>

                      </span>

                    </div>

                  ))}

                </div>

              )}

            </div>


            {/* =================================================
                ADD HOSPITAL MODAL
            ================================================== */}

            {showHospitalForm && (

              <div className="hospital-modal-overlay">

                <div className="hospital-modal">

                  {/* MODAL HEADER */}

                  <div className="hospital-modal-header">

                    <div>
                      <h2>
                        Add Hospital
                      </h2>

                      <p>
                        Register a new hospital
                        in MediSort.
                      </p>
                    </div>

                    <button
                      className="hospital-modal-close"
                      onClick={() =>
                        setShowHospitalForm(false)
                      }
                    >
                      ×
                    </button>

                  </div>


                  {/* FORM */}

                  <form
                    onSubmit={handleAddHospital}
                    className="hospital-form"
                  >

                    {/* NAME */}

                    <div className="hospital-form-group">

                      <label>
                        Hospital Name
                      </label>

                      <input
                        type="text"
                        placeholder="Enter hospital name"
                        value={hospitalName}
                        onChange={(e) =>
                          setHospitalName(e.target.value)
                        }
                      />

                    </div>


                    {/* LOCATION */}

                    <div className="hospital-form-group">

                      <label>
                        Location
                      </label>

                      <input
                        type="text"
                        placeholder="Enter hospital location"
                        value={hospitalLocation}
                        onChange={(e) =>
                          setHospitalLocation(
                            e.target.value
                          )
                        }
                      />

                    </div>


                    {/* CONTACT */}

                    <div className="hospital-form-group">

                      <label>
                        Contact
                      </label>

                      <input
                        type="text"
                        placeholder="Enter contact number"
                        value={hospitalContact}
                        onChange={(e) =>
                          setHospitalContact(
                            e.target.value
                          )
                        }
                      />

                    </div>


                    {/* STATUS */}

                    <div className="hospital-form-group">

                      <label>
                        Status
                      </label>

                      <select
                        value={hospitalStatus}
                        onChange={(e) =>
                          setHospitalStatus(
                            e.target.value
                          )
                        }
                      >

                        <option value="Active">
                          Active
                        </option>

                        <option value="Inactive">
                          Inactive
                        </option>

                      </select>

                    </div>


                    {/* BUTTONS */}

                    <div className="hospital-form-actions">

                      <button
                        type="button"
                        className="hospital-cancel-btn"
                        onClick={() =>
                          setShowHospitalForm(false)
                        }
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="hospital-save-btn"
                      >
                        Add Hospital
                      </button>

                    </div>

                  </form>

                </div>

              </div>

            )}

          </div>







          ) : adminPage === "collectors" ? (
          <div className="collector-management-page">
            <header className="collector-page-header">
              <div>
                <p className="admin-eyebrow">
                  MediSort Administration
                </p>

                <h1>Collectors</h1>

                <p>
                  Manage medical waste collectors and their activities.
                </p>
              </div>

            <button
  className="add-collector-btn"
  onClick={() => setShowCollectorForm(true)}
>
  + Add Collector
</button>




            </header>



{showCollectorForm && (
  <div className="collector-form-card">

    <div className="collector-form-header">
      <div>
        <h2>Add Collector</h2>
        <p>Register a new medical waste collector.</p>
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
            placeholder="Enter collector name"
          />
        </div>

        <div className="collector-form-group">
          <label>Contact Number</label>
        
<input
  type="text"
  name="contactNumber"
  placeholder="Enter contact number"
/>



        </div>

        <div className="collector-form-group">
          <label>Assigned Area</label>
       
<input
  type="text"
  name="assignedArea"
  placeholder="Enter assigned area"
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

        <button
          type="submit"
          className="save-collector-btn"
        >
          Save Collector
        </button>

      </div>

    </form>

  </div>
)}s










            <div className="collector-search-box">
              <input
                type="text"
                placeholder="Search collectors..."
                value={collectorSearch}
                onChange={(e) =>
                  setCollectorSearch(e.target.value)
                }
              />
            </div>

            <div className="collector-list-card">
              <div className="collector-list-header">
                <div>
                  <h2>Registered Collectors</h2>
                  <p>
                    Waste collectors connected to MediSort
                  </p>
                </div>

                <span>
  {filteredCollectors.length}{" "}
  {filteredCollectors.length === 1
    ? "Collector"
    : "Collectors"}
</span>




              </div>

              {filteredCollectors.length === 0 ? (
  <div className="empty-collectors">

    <div className="empty-collector-icon">
      🚚
    </div>

    <h3>No collectors found</h3>

    <p>
      Add a collector to start managing collection staff.
    </p>

  </div>
) : (
  <div className="collector-table">

    {filteredCollectors.map((collector) => (
    <div
      className="collector-row"
      key={collector.id}
    >

      <div className="collector-info">

        <div className="collector-avatar">
          {collector.name?.charAt(0).toUpperCase()}
        </div>

        <div>
          <h3>{collector.name}</h3>

          <p>
            {collector.contact}
          </p>
        </div>

      </div>

      <div className="collector-area">
        <span>Assigned Area</span>

        <strong>
          {collector.assignedArea}
        </strong>
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
        onClick={() =>
          handleDeleteCollector(collector.id)
        }
      >
        Delete
      </button>

    </div>
  ))}

  </div>
)}








            </div>
          </div>
        ) :  adminPage === "wasteRecords" ? (    
          <><div className="waste-records-page">

  <header className="waste-records-header">

    <div>
      <p className="admin-eyebrow">
        MediSort Administration
      </p>

      <h1>Waste Records</h1>

      <p>
        Monitor and manage medical waste records.
      </p>
    </div>

  </header>

  <div className="waste-records-search">

    <input
      type="text"
      placeholder="Search waste records..."
      value={wasteSearch}
      onChange={(e) =>
        setWasteSearch(e.target.value)
      }
    />

  </div>

  <div className="waste-records-card">

    <div className="waste-records-card-header">

      <div>
        <h2>Recorded Waste</h2>

        <p>
          Waste entries recorded by hospitals
        </p>
      </div>

      <span>
        {wasteRecords.length}{" "}
        {wasteRecords.length === 1
          ? "Record"
          : "Records"}
      </span>

    </div>
{filteredWasteRecords.length === 0 ? (
  <div className="waste-records-empty">

    <div className="waste-records-icon">
      ♻️
    </div>

    <h3>No waste records found</h3>

    <p>
      Recorded medical waste will appear here
      automatically.
    </p>

  </div>
) : (
  <div className="waste-records-list">

    {filteredWasteRecords.map((record) => (
      <div
        className="waste-record-row"
        key={record.id}
      >

        <div className="waste-record-main">

          <div className="waste-record-icon">
            ♻️
          </div>

          <div>
            <h3>
              {record.wasteType || "Unknown Waste"}
            </h3>

            <p>
              {record.hospital || "Unknown Hospital"}
            </p>
          </div>

        </div>

        <div className="waste-record-category">
          <span>Category</span>

          <strong>
            {record.category || "N/A"}
          </strong>
        </div>

        <div className="waste-record-weight">
          <span>Weight</span>

          <strong>
            {record.weight || 0} kg
          </strong>
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

            <header className="admin-header">















              <div>

                <p className="admin-eyebrow">
                  MediSort Administration
                </p>

                <h1>
                  Admin Dashboard
                </h1>

                <p className="admin-subtitle">
                  Monitor medical waste operations
                  across the system.
                </p>

              </div>


              <div className="admin-user">

                <div className="admin-user-avatar">
                  A
                </div>

                <div>
                  <strong>
                    System Admin
                  </strong>

                  <span>
                    Administrator
                  </span>
                </div>

              </div>

            </header>


            {/* =================================================
                KPI CARDS
            ================================================== */}

            <section className="admin-stats">


              {/* ACTIVE COLLECTIONS */}

              <div className="admin-stat-card">

                <div className="admin-stat-icon blue">
                  🏥
                </div>

                <div>

                  <span>
                    Active Collections
                  </span>

                  <h2>
                    {activeCollections}
                  </h2>

                  <small>
                    Waste batches in transit
                  </small>

                </div>

              </div>


              {/* ACTIVE COLLECTORS */}

              <div className="admin-stat-card">

                <div className="admin-stat-icon green">
                  🚚
                </div>

                <div>

                  <span>
                    Active Collectors
                  </span>

                  <strong>
                    {collectors.filter(
  (collector) => collector.status === "Active"
).length}



                  </strong>

                  <small>
                    Currently registered
                  </small>

                </div>

              </div>


              {/* WASTE COLLECTED */}

              <div className="admin-stat-card">

                <div className="admin-stat-icon orange">
                  ♻️
                </div>

                <div>

                  <span>
                    Waste Collected
                  </span>

                  <strong>
                    {wasteCollected.toFixed(1)} kg
                  </strong>

                  <small>
                    Total collected
                  </small>

                </div>

              </div>


              {/* PICKUP REQUESTS */}

              <div className="admin-stat-card">

                <div className="admin-stat-icon purple">
                  📦
                </div>

                <div>

                  <span>
                    Pickup Requests
                  </span>

                  <strong>
                    {pickupCount}
                  </strong>

                  <small>
                    Total requests
                  </small>

                </div>

              </div>

            </section>


            {/* =================================================
                OVERVIEW
            ================================================== */}

            <section className="admin-grid">


              {/* SYSTEM OVERVIEW */}

              <div className="admin-card">

                <div className="admin-card-header">

                  <div>

                    <h2>
                      System Overview
                    </h2>

                    <p>
                      Current MediSort activity
                    </p>

                  </div>

                  <span className="admin-live">
                    ● Live
                  </span>

                </div>


                <div className="overview-list">


                  <div className="overview-row">

                    <div className="overview-label">

                      <span className="overview-dot blue-dot"></span>

                      Pending Pickups

                    </div>

                    <strong>
                      {pickupCount}
                    </strong>

                  </div>


                  <div className="overview-row">

                    <div className="overview-label">

                      <span className="overview-dot orange-dot"></span>

                      In Transit

                    </div>

                    <strong>
                      {activeCollections}
                    </strong>

                  </div>


                  <div className="overview-row">

                    <div className="overview-label">

                      <span className="overview-dot green-dot"></span>

                      Collected

                    </div>

                    <strong>
                      {wasteCollected.toFixed(1)} kg
                    </strong>

                  </div>


                  <div className="overview-row">

                    <div className="overview-label">

                      <span className="overview-dot red-dot"></span>

                      Hospitals

                    </div>

                    <strong>
                      {hospitals.length}
                    </strong>

                  </div>


                </div>

              </div>


              {/* QUICK ACTIONS */}

              <div className="admin-card">

                <div className="admin-card-header">

                  <div>

                    <h2>
                      Quick Actions
                    </h2>

                    <p>
                      Common administrative tasks
                    </p>

                  </div>

                </div>


                <div className="admin-actions">


                  {/* MANAGE HOSPITALS */}

                  <button
                    className="admin-action"
                    onClick={() =>
                      setAdminPage("hospitals")
                    }
                  >

                    <span>
                      🏥
                    </span>

                    <div>

                      <strong>
                        Manage Hospitals
                      </strong>

                      <small>
                        View registered hospitals
                      </small>

                    </div>

                  </button>


                  {/* MANAGE COLLECTORS */}

                  <button className="admin-action">

                    <span>
                      🚚
                    </span>

                    <div>

                      <strong>
                        Manage Collectors
                      </strong>

                      <small>
                        View collector accounts
                      </small>

                    </div>

                  </button>


                  {/* REPORT */}

                  <button className="admin-action">

                    <span>
                      📊
                    </span>

                    <div>

                      <strong>
                        Generate Report
                      </strong>

                      <small>
                        View waste analytics
                      </small>

                    </div>

                  </button>


                </div>

              </div>

            </section>


            {/* =================================================
                RECENT ACTIVITY
            ================================================== */}

            <section className="admin-card recent-activity">

              <div className="admin-card-header">

                <div>

                  <h2>
                    Recent Activity
                  </h2>

                  <p>
                    Latest system events
                  </p>

                </div>

                <button className="admin-view-button">
                  View All →
                </button>

              </div>


              <div className="activity-list">


                {/* ACTIVITY 1 */}

                <div className="activity-item">

                  <div className="activity-icon blue">
                    🏥
                  </div>

                  <div>

                    <strong>
                      Hospital management
                    </strong>

                    <span>
                      Hospital records are synchronized
                      with the system.
                    </span>

                  </div>

                  <small>
                    Live
                  </small>

                </div>


                {/* ACTIVITY 2 */}

                <div className="activity-item">

                  <div className="activity-icon green">
                    🚚
                  </div>

                  <div>

                    <strong>
                      Waste collection
                    </strong>

                    <span>
                      Collection status is updated
                      automatically.
                    </span>

                  </div>

                  <small>
                    Live
                  </small>

                </div>


                {/* ACTIVITY 3 */}

                <div className="activity-item">

                  <div className="activity-icon purple">
                    🔳
                  </div>

                  <div>

                    <strong>
                      QR waste tracking
                    </strong>

                    <span>
                      Waste batches can be tracked
                      through QR verification.
                    </span>

                  </div>

                  <small>
                    Live
                  </small>

                </div>


              </div>

       </section>

</>

) : null}

</main>

    </div>
  );
}

export default AdminDashboard;