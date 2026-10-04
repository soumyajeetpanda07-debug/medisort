import { useState } from "react";
import FrontPage from "./FrontPage";
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import CollectorDashboard from "./pages/collector/collectorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AiSegregationAssistant from "./components/AiSegregationAssistant";

function App() {
  const [page, setPage] = useState("home");
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const handleApplyWaste = (wasteData) => {
    sessionStorage.setItem("medisort_prefill_waste", JSON.stringify(wasteData));
    setPage("hospital");
    setAiModalOpen(false);
  };

  return (
    <>
      {/* ── Main Router ── */}
      {page === "hospital" && (
        <HospitalDashboard
          onBackToHome={() => setPage("home")}
          onOpenAiAssistant={() => setAiModalOpen(true)}
        />
      )}

      {page === "collector" && (
        <CollectorDashboard
          onBackToHome={() => setPage("home")}
        />
      )}

      {page === "admin" && (
        <AdminDashboard
          onBackToHome={() => setPage("home")}
        />
      )}

      {page === "home" && (
        <FrontPage
          onHospitalClick={() => setPage("hospital")}
          onCollectorClick={() => setPage("collector")}
          onAdminClick={() => setPage("admin")}
          onOpenAiAssistant={() => setAiModalOpen(true)}
        />
      )}

      {/* ── Global Floating AI Segregation Button ── */}
      <button
        className="ai-floating-trigger"
        onClick={() => setAiModalOpen(true)}
        title="Open AI Waste Segregation Assistant (Camera & Text)"
        aria-label="Open AI Waste Segregation Assistant"
      >
        <span className="ai-floating-icon">✨</span>
        <span>AI Segregation</span>
        <span className="ai-floating-badge">Vision & NLP</span>
      </button>

      {/* ── Global AI Segregation Assistant Modal ── */}
      <AiSegregationAssistant
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onApplyWaste={handleApplyWaste}
      />
    </>
  );
}

export default App;