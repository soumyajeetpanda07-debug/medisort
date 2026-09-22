import { useState } from "react";
import FrontPage from "./FrontPage";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import CollectorDashboard from "./pages/collector/collectorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
function App() {
  const [page, setPage] = useState("home");

  // Hospital Dashboard
  if (page === "hospital") {
    return <HospitalDashboard />;
  }

  // Collector Dashboard
  if (page === "collector") {
    return <CollectorDashboard />;
  }

  // Admin Dashboard
  if (page === "admin") {
    return <AdminDashboard />;
  }

  // Front Page
 return (
  <FrontPage
    onHospitalClick={() => setPage("hospital")}
    onCollectorClick={() => setPage("collector")}
    onAdminClick={() => setPage("admin")}
  />
);
}

export default App;