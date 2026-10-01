import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection, addDoc, serverTimestamp,
  query, orderBy, limit, getDocs,
  deleteDoc, doc, writeBatch,
} from "firebase/firestore";
import { db } from "../../firebase";
import "../../App.css";
import "./AddWaste.css";

/* ── Configuration ── */
const WASTE_TYPES = [
  { id: "blood",      label: "Blood-soaked dressing",   icon: "🩸", category: "YELLOW", desc: "Human anatomical / soaked items" },
  { id: "anatomical", label: "Anatomical & tissue waste",icon: "🫀", category: "YELLOW", desc: "Organs, tissues, body parts" },
  { id: "medicine",   label: "Expired / discarded drugs",icon: "💊", category: "YELLOW", desc: "Cytotoxic & expired medicines" },
  { id: "plastic",    label: "Contaminated plastic",     icon: "♻️", category: "RED",    desc: "IV bottles, tubing, catheters" },
  { id: "gloves",     label: "Infected gloves & aprons", icon: "🧤", category: "RED",    desc: "Rubber & plastic wearables" },
  { id: "syringe",    label: "Used syringe & needle",   icon: "💉", category: "WHITE",  desc: "Sharps — needles, scalpels" },
  { id: "blade",      label: "Scalpels & sharp blades", icon: "🔪", category: "WHITE",  desc: "Surgical blades, lancets" },
  { id: "glass",      label: "Glass vials & ampoules",  icon: "🧪", category: "BLUE",   desc: "Medicine vials, lab glassware" },
  { id: "implant",    label: "Orthopedic implants",     icon: "🔩", category: "BLUE",   desc: "Metal pins, plates, implants" },
  { id: "other",      label: "Other (Custom)",          icon: "➕", category: null,     desc: "Enter a custom waste type" },
];

const CATEGORIES = [
  { name: "YELLOW", emoji: "🟡", color: "#eab308", tagLine: "Incineration / deep burial" },
  { name: "WHITE",  emoji: "⚪", color: "#64748b", tagLine: "Autoclaving / shredding" },
  { name: "RED",    emoji: "🔴", color: "#ef4444", tagLine: "Autoclaving / microwaving" },
  { name: "BLUE",   emoji: "🔵", color: "#3b82f6", tagLine: "Autoclaving & washing" },
];

const HOSPITAL = "AAROGYA Hospital";
const WEIGHT_BAR_MAX = 50;

/* ── Helpers ── */
function fmtTime(ts) {
  if (!ts) return "Just now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function createEmptyRow(defaultType = "blood") {
  const found = WASTE_TYPES.find(t => t.id === defaultType) || WASTE_TYPES[0];
  return {
    id: "row-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8),
    wasteTypeId: found.id,
    customLabel: "",
    weight: "",
    category: found.category || "YELLOW",
  };
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════════════ */
function AddWaste({ onBack }) {

  /* ── Mode state: "single" or "bulk" ── */
  const [entryMode, setEntryMode]           = useState("single");

  /* ── Single Form state ── */
  const [selectedId, setSelectedId]         = useState("");
  const [customType, setCustomType]         = useState("");
  const [weight, setWeight]                 = useState("");
  const [category, setCategory]             = useState("");
  const [manualCat, setManualCat]           = useState("");
  const [classified, setClassified]         = useState(false);
  const [saving, setSaving]                 = useState(false);

  /* ── Bulk Table state ── */
  const [bulkRows, setBulkRows]             = useState([
    createEmptyRow("blood"),
    createEmptyRow("plastic"),
    createEmptyRow("syringe"),
  ]);

  /* ── UI state ── */
  const [toasts, setToasts]                 = useState([]);
  const [showSuccess, setSuccess]           = useState(false);
  const [successTitle, setSuccessTitle]     = useState("Record Saved!");
  const [successMsg, setSuccessMsg]         = useState("Waste record saved to the database.");
  const [errors, setErrors]                 = useState({});
  const [records, setRecords]               = useState([]);
  const [lastSaved, setLastSaved]           = useState(null);

  /* ── Derived for Single Mode ── */
  const sel           = WASTE_TYPES.find(t => t.id === selectedId);
  const isOther       = selectedId === "other";
  const wasteLabel    = isOther ? customType.trim() : (sel?.label ?? "");
  const effectiveCat  = isOther ? manualCat : category;
  const catMeta       = CATEGORIES.find(c => c.name === effectiveCat);

  const currentStep = (() => {
    if (!selectedId || (isOther && !customType.trim())) return 1;
    if (!classified) return 2;
    return 3;
  })();

  /* ── Derived for Bulk Mode ── */
  const bulkSummary = useMemo(() => {
    let totalWeight = 0;
    let validCount = 0;
    const byCategory = { YELLOW: 0, RED: 0, WHITE: 0, BLUE: 0 };

    bulkRows.forEach(r => {
      const w = parseFloat(r.weight);
      const isValidWeight = !isNaN(w) && w > 0 && w <= 1000;
      const hasLabel = r.wasteTypeId === "other" ? Boolean(r.customLabel.trim()) : Boolean(r.wasteTypeId);
      if (isValidWeight && hasLabel) {
        totalWeight += w;
        validCount += 1;
        if (byCategory[r.category] !== undefined) {
          byCategory[r.category] += w;
        }
      }
    });

    return {
      totalWeight: Number(totalWeight.toFixed(2)),
      validCount,
      totalRows: bulkRows.length,
      byCategory,
    };
  }, [bulkRows]);

  /* ─────────── Toasts ─────────── */
  const toast = useCallback((msg, type = "info", ms = 4000, onUndo = null) => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type, onUndo }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), ms);
  }, []);

  const killToast = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), []);

  /* ─────────── Fetch recent records ─────────── */
  const fetchRecords = useCallback(async () => {
    try {
      const q = query(collection(db, "wasteRecords"), orderBy("createdAt", "desc"), limit(8));
      const snap = await getDocs(q);
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Fetch error:", e); }
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  /* ─────────── Single Mode Validation & Save ─────────── */
  function validate() {
    const e = {};
    if (!selectedId) e.waste = "Select a waste type";
    if (isOther && !customType.trim()) e.custom = "Enter a waste description";
    const w = Number(weight);
    if (!weight || w <= 0 || w > 1000) e.weight = "Weight must be 0.1 – 1000 kg";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function classify() {
    if (!validate()) return;
    if (isOther && !manualCat) {
      toast("Pick a category for your custom waste type.", "warning");
      return;
    }
    if (!isOther) setCategory(sel?.category ?? "");
    setClassified(true);
    toast(`Classified as ${isOther ? manualCat : sel?.category} category`, "success", 3000);
  }

  async function saveWaste() {
    if (!validate()) return;
    if (!effectiveCat) { toast("Classify the waste first.", "warning"); return; }

    setSaving(true);
    try {
      const ref = await addDoc(collection(db, "wasteRecords"), {
        hospital: HOSPITAL, wasteType: wasteLabel,
        weight: Number(weight), category: effectiveCat,
        createdAt: serverTimestamp(),
      });

      const snap = { docId: ref.id, wasteType: wasteLabel, weight, category: effectiveCat };
      setLastSaved(snap);
      resetForm();
      fetchRecords();

      setSuccessTitle("Record Saved!");
      setSuccessMsg(`Saved ${weight} kg of ${wasteLabel} to database.`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2800);
      toast("Record saved!", "success", 6000, () => undoSave(snap));
    } catch (err) {
      console.error("Save error:", err);
      toast(`Firebase error: ${err.message}`, "error", 6000);
    } finally { setSaving(false); }
  }

  function resetForm() {
    setSelectedId(""); setCustomType(""); setWeight("");
    setCategory(""); setManualCat(""); setClassified(false); setErrors({});
  }

  async function undoSave(data) {
    const t = data || lastSaved;
    if (!t) return;
    try {
      await deleteDoc(doc(db, "wasteRecords", t.docId));
      toast("Record undone!", "info", 3000);
      setLastSaved(null);
      fetchRecords();
    } catch (err) { toast("Undo failed: " + err.message, "error"); }
  }

  /* ─────────── Bulk Mode Handlers ─────────── */
  const updateBulkRow = (id, field, value) => {
    setBulkRows(prev => prev.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      if (field === "wasteTypeId") {
        const found = WASTE_TYPES.find(t => t.id === value);
        if (found && found.category) {
          updated.category = found.category;
        }
      }
      return updated;
    }));
  };

  const addBulkRow = () => {
    setBulkRows(prev => [...prev, createEmptyRow("")]);
  };

  const removeBulkRow = (id) => {
    if (bulkRows.length <= 1) {
      toast("You must have at least one row in bulk mode.", "warning");
      return;
    }
    setBulkRows(prev => prev.filter(r => r.id !== id));
  };

  const duplicateBulkRow = (row) => {
    const copy = {
      ...row,
      id: "row-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8),
    };
    setBulkRows(prev => [...prev, copy]);
    toast("Row duplicated", "info", 1500);
  };

  const quickFillCategories = () => {
    setBulkRows([
      { id: "row-y-" + Date.now(), wasteTypeId: "blood", customLabel: "", weight: "", category: "YELLOW" },
      { id: "row-r-" + Date.now(), wasteTypeId: "plastic", customLabel: "", weight: "", category: "RED" },
      { id: "row-w-" + Date.now(), wasteTypeId: "syringe", customLabel: "", weight: "", category: "WHITE" },
      { id: "row-b-" + Date.now(), wasteTypeId: "glass", customLabel: "", weight: "", category: "BLUE" },
    ]);
    toast("Populated 4 category rows (Yellow, Red, White, Blue). Enter weights and save.", "info", 3000);
  };

  const clearBulkRows = () => {
    setBulkRows([createEmptyRow("blood"), createEmptyRow("plastic")]);
    toast("Reset bulk table.", "info", 2000);
  };

  async function saveBulkWaste() {
    if (bulkRows.length === 0) {
      toast("Please add at least one waste item.", "warning");
      return;
    }

    const invalid = [];
    bulkRows.forEach((r, idx) => {
      const w = parseFloat(r.weight);
      const isOtherRow = r.wasteTypeId === "other";
      const label = isOtherRow ? r.customLabel.trim() : (WASTE_TYPES.find(t => t.id === r.wasteTypeId)?.label);

      if (!label) {
        invalid.push(`Row #${idx + 1}: Waste type missing`);
      } else if (isNaN(w) || w <= 0 || w > 1000) {
        invalid.push(`Row #${idx + 1}: Weight must be 0.1 - 1000 kg`);
      } else if (!r.category) {
        invalid.push(`Row #${idx + 1}: Category missing`);
      }
    });

    if (invalid.length > 0) {
      toast(`Validation error: ${invalid[0]}`, "error", 4000);
      return;
    }

    setSaving(true);
    try {
      const batch = writeBatch(db);

      bulkRows.forEach(r => {
        const isOtherRow = r.wasteTypeId === "other";
        const label = isOtherRow ? r.customLabel.trim() : (WASTE_TYPES.find(t => t.id === r.wasteTypeId)?.label || "Medical Waste");
        const docRef = doc(collection(db, "wasteRecords"));
        const data = {
          hospital: HOSPITAL,
          wasteType: label,
          weight: Number(parseFloat(r.weight).toFixed(2)),
          category: r.category,
          createdAt: serverTimestamp(),
        };
        batch.set(docRef, data);
      });

      await batch.commit();

      setSuccessTitle("Batch Saved!");
      setSuccessMsg(`Successfully saved ${bulkRows.length} waste records (${bulkSummary.totalWeight} kg).`);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      toast(`✅ Saved all ${bulkRows.length} waste records (${bulkSummary.totalWeight} kg) to database!`, "success", 5000);
      setBulkRows([createEmptyRow("blood"), createEmptyRow("plastic")]);
      fetchRecords();
    } catch (err) {
      console.error("Bulk save error:", err);
      toast(`Failed to save batch: ${err.message}`, "error", 5000);
    } finally {
      setSaving(false);
    }
  }

  /* ═══════════════════ RENDER ═══════════════════ */
  return (
    <div className="aw-page">

      {/* ── TOASTS ── */}
      <div className="aw-toast-box">
        {toasts.map(t => (
          <div key={t.id} className={`aw-toast aw-toast-${t.type}`}>
            <span className="aw-toast-ico">
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : t.type === "warning" ? "⚠️" : "ℹ️"}
            </span>
            <span className="aw-toast-msg">{t.msg}</span>
            {t.onUndo && (
              <button className="aw-toast-undo" onClick={() => { t.onUndo(); killToast(t.id); }}>Undo</button>
            )}
            <button className="aw-toast-x" onClick={() => killToast(t.id)}>×</button>
          </div>
        ))}
      </div>

      {/* ── SUCCESS OVERLAY ── */}
      {showSuccess && (
        <div className="aw-overlay" onClick={() => setSuccess(false)}>
          <div className="aw-overlay-modal">
            <div className="aw-overlay-circle">
              <svg className="aw-overlay-svg" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="24" fill="none" stroke="#22c55e" strokeWidth="3"/>
                <path d="M14 27l7 7 16-16" fill="none" stroke="#22c55e" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>{successTitle}</h2>
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="aw-topbar">
        <button type="button" className="aw-back-btn" onClick={onBack}>
          <span className="aw-back-arrow">←</span>
          <span>Back to Dashboard</span>
        </button>

        {/* Mode Switcher Pill */}
        <div className="aw-mode-switch">
          <button
            type="button"
            className={`aw-mode-pill ${entryMode === "single" ? "active" : ""}`}
            onClick={() => setEntryMode("single")}
          >
            <span>📝</span> Single Item
          </button>
          <button
            type="button"
            className={`aw-mode-pill ${entryMode === "bulk" ? "active" : ""}`}
            onClick={() => setEntryMode("bulk")}
          >
            <span>📦</span> Bulk Table Mode
            <span className="aw-mode-badge">{bulkRows.length}</span>
          </button>
        </div>

        <div className="aw-topbar-right">
          <div className="aw-live-pill"><span className="aw-live-dot"/>Active</div>
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="aw-hero">
        <div className="aw-hero-content">
          <div className="aw-hero-icon">🏥</div>
          <div>
            <h1 className="aw-hero-title">
              {entryMode === "bulk" ? "Bulk Waste Batch Entry" : "Add Medical Waste"}
            </h1>
            <p className="aw-hero-sub">
              {HOSPITAL} · {entryMode === "bulk" ? "Multi-Record Bulk Disposal Mode" : "Biomedical Waste Categorization"}
            </p>
          </div>
        </div>
        <div className="aw-hero-badge"><span>📋</span> BMW Rules 2016</div>
      </div>

      {/* ── MODE 1: SINGLE ITEM ENTRY ── */}
      {entryMode === "single" && (
        <>
          {/* Steps Indicator */}
          <div className="aw-steps">
            {["Select Waste", "Classify", "Save Record"].map((label, i) => {
              const s = i + 1, done = currentStep > s, active = currentStep === s;
              return (
                <div key={s} className="aw-step-wrap">
                  {i > 0 && <div className={`aw-step-line ${done ? "done" : ""}`}/>}
                  <div className={`aw-step ${done ? "done" : ""} ${active ? "active" : ""}`}>
                    <div className="aw-step-num">{done ? "✓" : s}</div>
                    <span>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid: Form (Left) & Result Preview (Right) */}
          <div className="aw-grid">

            {/* Form */}
            <div className="aw-form-card">
              <div className="aw-form-header">
                <div className="aw-form-header-icon">📝</div>
                <div><h2>Waste Details</h2><p>Select waste type and enter weight.</p></div>
              </div>

              {/* Type Cards */}
              <div className="aw-field">
                <label className="aw-label">Waste Material <span className="aw-req">*</span></label>
                <div className="aw-type-grid">
                  {WASTE_TYPES.map(t => (
                    <button key={t.id} type="button"
                      className={`aw-type-card ${selectedId === t.id ? "selected" : ""} ${t.id === "other" ? "is-other" : ""}`}
                      onClick={() => { setSelectedId(t.id); setCategory(""); setManualCat(""); setClassified(false); setErrors(p => ({...p, waste: undefined})); }}
                    >
                      <span className="aw-tc-icon">{t.icon}</span>
                      <strong>{t.label}</strong>
                      <small>{t.desc}</small>
                    </button>
                  ))}
                </div>
                {errors.waste && <p className="aw-err">{errors.waste}</p>}
              </div>

              {/* Custom type */}
              {isOther && (
                <div className="aw-field aw-anim-fade">
                  <label className="aw-label">Describe Waste <span className="aw-req">*</span></label>
                  <input className={`aw-text-input ${errors.custom ? "aw-input-err" : ""}`}
                    type="text" placeholder="e.g. Expired chemical reagents"
                    value={customType} onChange={e => { setCustomType(e.target.value); setClassified(false); setErrors(p => ({...p, custom: undefined})); }}
                  />
                  {errors.custom && <p className="aw-err">{errors.custom}</p>}

                  <label className="aw-label" style={{marginTop:16}}>Assign Category <span className="aw-req">*</span></label>
                  <div className="aw-cat-picker">
                    {CATEGORIES.map(c => (
                      <button key={c.name} type="button"
                        className={`aw-cat-pick ${manualCat === c.name ? "sel" : ""}`}
                        onClick={() => { setManualCat(c.name); setClassified(false); }}
                      >
                        <span className="aw-cpd" style={{background: c.color}}/> {c.emoji} {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Weight */}
              <div className="aw-field">
                <label className="aw-label">Weight <span className="aw-req">*</span></label>
                <div className="aw-weight-wrap">
                  <span className="aw-weight-icon">⚖️</span>
                  <input className={`aw-input ${errors.weight ? "aw-input-err" : ""}`}
                    type="number" placeholder="e.g. 2.5" min="0.1" max="1000" step="0.1"
                    value={weight} onChange={e => { setWeight(e.target.value); setErrors(p => ({...p, weight: undefined})); }}
                  />
                  <span className="aw-weight-unit">kg</span>
                </div>

                {weight && Number(weight) > 0 && (
                  <div className="aw-wbar-wrap aw-anim-fade">
                    <div className="aw-wbar"><div className="aw-wbar-fill" style={{ width: `${Math.min((Number(weight)/WEIGHT_BAR_MAX)*100,100)}%` }}/></div>
                    <div className="aw-wbar-labels"><span>0 kg</span><span>{Number(weight) > WEIGHT_BAR_MAX ? `${WEIGHT_BAR_MAX}+` : WEIGHT_BAR_MAX} kg</span></div>
                  </div>
                )}
                {errors.weight && <p className="aw-err">{errors.weight}</p>}
              </div>

              {/* Classify Button */}
              <button type="button" className="aw-check-btn" onClick={classify}>
                <span>🔍</span> Classify Category
              </button>
            </div>

            {/* Result Preview */}
            <div className="aw-result-card">
              {classified && effectiveCat && catMeta ? (
                <div className={`aw-result-panel aw-cat-${effectiveCat.toLowerCase()}`}>
                  <div className="aw-result-badge-row">
                    <span className="aw-cat-emoji">{catMeta.emoji}</span>
                    <div>
                      <h2 className="aw-result-title">{effectiveCat} Category</h2>
                      <p className="aw-result-sub">{catMeta.tagLine}</p>
                    </div>
                  </div>

                  <div className="aw-color-strip" style={{background: catMeta.color}}/>

                  <div className="aw-result-summary">
                    {[
                      { ico: sel?.icon ?? "🗑️", lbl: "Waste Material", val: wasteLabel },
                      { ico: "⚖️", lbl: "Weight", val: `${weight} kg` },
                      { ico: "🏷️", lbl: "Category", val: effectiveCat },
                      { ico: "🏥", lbl: "Hospital", val: HOSPITAL },
                    ].map(s => (
                      <div key={s.lbl} className="aw-summary-item">
                        <span className="aw-summary-icon">{s.ico}</span>
                        <div><small>{s.lbl}</small><strong>{s.val}</strong></div>
                      </div>
                    ))}
                  </div>

                  <div className="aw-result-btns">
                    <button type="button" className="aw-save-btn" onClick={saveWaste} disabled={saving}>
                      {saving ? "⏳ Saving…" : "💾 Save Record"}
                    </button>
                    <button type="button" className="aw-print-btn" onClick={() => window.print()} title="Print Slip">
                      🖨️
                    </button>
                  </div>
                </div>
              ) : (
                <div className="aw-empty-result">
                  <div className="aw-empty-circle"><span>📋</span></div>
                  <h3>Awaiting Classification</h3>
                  <p>Fill in waste details and click <strong>"Classify Category"</strong></p>
                  <div className="aw-guide">
                    {CATEGORIES.map(c => (
                      <div key={c.name} className="aw-guide-item">
                        <span className="aw-guide-dot" style={{background: c.color}}/> {c.name} — {c.tagLine}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── MODE 2: BULK TABLE MODE ── */}
      {entryMode === "bulk" && (
        <div className="aw-bulk-container">

          {/* Header & Quick Presets */}
          <div className="aw-bulk-header">
            <div>
              <h2 className="aw-bulk-title">📦 Multi-Item Waste Batch</h2>
              <p className="aw-bulk-sub">Enter multiple biomedical waste items and save the entire batch simultaneously.</p>
            </div>
            <div className="aw-bulk-top-actions">
              <button
                type="button"
                className="aw-bulk-quick-btn"
                onClick={quickFillCategories}
                title="Populate 4 rows for Yellow, Red, White, and Blue categories"
              >
                <span>⚡</span> Quick 4-Color Preset
              </button>
              <button
                type="button"
                className="aw-bulk-add-btn"
                onClick={addBulkRow}
              >
                <span>➕</span> Add Row
              </button>
              <button
                type="button"
                className="aw-bulk-clear-btn"
                onClick={clearBulkRows}
                title="Reset table"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Live Summary Metrics Bar */}
          <div className="aw-bulk-summary-bar">
            <div className="aw-bss-card">
              <span className="aw-bss-lbl">Valid Items</span>
              <strong className="aw-bss-val">{bulkSummary.validCount} <small>/ {bulkRows.length}</small></strong>
            </div>
            <div className="aw-bss-card">
              <span className="aw-bss-lbl">Total Batch Weight</span>
              <strong className="aw-bss-val">{bulkSummary.totalWeight} <small>kg</small></strong>
            </div>
            <div className="aw-bss-categories">
              <div className="aw-bss-cat">
                <span className="aw-bsc-dot" style={{background: "#eab308"}}/>
                <span>Yellow: <strong>{bulkSummary.byCategory.YELLOW.toFixed(1)} kg</strong></span>
              </div>
              <div className="aw-bss-cat">
                <span className="aw-bsc-dot" style={{background: "#ef4444"}}/>
                <span>Red: <strong>{bulkSummary.byCategory.RED.toFixed(1)} kg</strong></span>
              </div>
              <div className="aw-bss-cat">
                <span className="aw-bsc-dot" style={{background: "#64748b"}}/>
                <span>White: <strong>{bulkSummary.byCategory.WHITE.toFixed(1)} kg</strong></span>
              </div>
              <div className="aw-bss-cat">
                <span className="aw-bsc-dot" style={{background: "#3b82f6"}}/>
                <span>Blue: <strong>{bulkSummary.byCategory.BLUE.toFixed(1)} kg</strong></span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="aw-bulk-table-wrap">
            <table className="aw-bulk-table">
              <thead>
                <tr>
                  <th style={{width: 44}}>#</th>
                  <th>Waste Material</th>
                  <th style={{width: 170}}>Category (BMW Rules)</th>
                  <th style={{width: 170}}>Weight (kg)</th>
                  <th style={{width: 90, textAlign: "center"}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((row, idx) => {
                  const isRowOther = row.wasteTypeId === "other";
                  const rowCatMeta = CATEGORIES.find(c => c.name === row.category);

                  return (
                    <tr key={row.id} className="aw-bulk-tr">
                      <td className="aw-bulk-td-num">{idx + 1}</td>
                      <td>
                        <div className="aw-bulk-waste-cell">
                          <select
                            className="aw-bulk-select"
                            value={row.wasteTypeId}
                            onChange={e => updateBulkRow(row.id, "wasteTypeId", e.target.value)}
                          >
                            {WASTE_TYPES.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.icon} {t.label} {t.category ? `(${t.category})` : ""}
                              </option>
                            ))}
                          </select>

                          {isRowOther && (
                            <input
                              type="text"
                              className="aw-bulk-custom-input"
                              placeholder="Describe custom waste..."
                              value={row.customLabel}
                              onChange={e => updateBulkRow(row.id, "customLabel", e.target.value)}
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        {isRowOther ? (
                          <div className="aw-bulk-mini-cat-picker">
                            {CATEGORIES.map(c => (
                              <button
                                key={c.name}
                                type="button"
                                className={`aw-mini-cat-btn ${row.category === c.name ? "selected" : ""}`}
                                onClick={() => updateBulkRow(row.id, "category", c.name)}
                                title={c.tagLine}
                              >
                                {c.emoji}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className={`aw-bulk-cat-badge aw-cat-badge-${(row.category || "").toLowerCase()}`}>
                            <span>{rowCatMeta?.emoji}</span>
                            <strong>{row.category}</strong>
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="aw-bulk-weight-cell">
                          <input
                            type="number"
                            className="aw-bulk-weight-input"
                            min="0.1"
                            max="1000"
                            step="0.1"
                            placeholder="0.0"
                            value={row.weight}
                            onChange={e => updateBulkRow(row.id, "weight", e.target.value)}
                          />
                          <span className="aw-bulk-unit">kg</span>
                        </div>
                      </td>
                      <td>
                        <div className="aw-bulk-row-actions">
                          <button
                            type="button"
                            className="aw-bulk-icon-btn duplicate"
                            onClick={() => duplicateBulkRow(row)}
                            title="Duplicate Row"
                          >
                            📋
                          </button>
                          <button
                            type="button"
                            className="aw-bulk-icon-btn delete"
                            onClick={() => removeBulkRow(row.id)}
                            disabled={bulkRows.length <= 1}
                            title="Remove Row"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Add row footer button */}
          <div className="aw-bulk-add-bar">
            <button
              type="button"
              className="aw-bulk-add-row-btn"
              onClick={addBulkRow}
            >
              <span>➕</span> Add Another Waste Item
            </button>
          </div>

          {/* Bulk Action Footer */}
          <div className="aw-bulk-footer">
            <div className="aw-bulk-footer-summary">
              <strong>Batch Summary:</strong>
              <span>
                {bulkSummary.validCount} of {bulkRows.length} items ready · Total <strong>{bulkSummary.totalWeight} kg</strong>
              </span>
            </div>
            <div className="aw-bulk-footer-btns">
              <button
                type="button"
                className="aw-print-btn"
                onClick={() => window.print()}
                title="Print Batch Disposal Slip"
              >
                🖨️
              </button>
              <button
                type="button"
                className="aw-bulk-save-btn"
                onClick={saveBulkWaste}
                disabled={saving || bulkSummary.validCount === 0}
              >
                {saving ? "⏳ Saving Batch..." : `💾 Save Batch (${bulkSummary.validCount} Items · ${bulkSummary.totalWeight} kg)`}
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── RECENT RECORDS ── */}
      {records.length > 0 && (
        <div className="aw-records">
          <div className="aw-records-top">
            <h2>📊 Recent Records</h2>
            <small>Last {records.length} entries</small>
          </div>
          <div className="aw-records-scroll">
            <table className="aw-rtable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Waste Type</th>
                  <th>Weight</th>
                  <th>Category</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td className="aw-rn">{i + 1}</td>
                    <td>{r.wasteType}</td>
                    <td>{r.weight} kg</td>
                    <td>
                      <span className={`aw-rbadge aw-rb-${(r.category || "").toLowerCase()}`}>
                        {r.category}
                      </span>
                    </td>
                    <td className="aw-rt">{fmtTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SAFETY FOOTER ── */}
      <div className="aw-safety-footer">
        <span className="aw-safety-icon">🛡️</span>
        <div>
          <strong>Safety Reminder</strong>
          <p>Ensure proper PPE when handling biomedical waste. Follow BMW Rules 2016.</p>
        </div>
      </div>

      {/* ── PRINT SLIP (hidden, visible only in @media print) ── */}
      <div className="aw-slip">
        <div className="aw-slip-head">
          <h1>🏥 {HOSPITAL}</h1>
          <p>Biomedical Waste Disposal Slip</p>
        </div>
        <hr/>
        <div className="aw-slip-body">
          {entryMode === "bulk" ? (
            <div>
              <div style={{marginBottom: 12, fontWeight: 700}}>
                Bulk Batch Summary ({bulkRows.length} items · {bulkSummary.totalWeight} kg)
              </div>
              {bulkRows.map((r, i) => {
                const label = r.wasteTypeId === "other" ? r.customLabel : (WASTE_TYPES.find(t=>t.id===r.wasteTypeId)?.label);
                return (
                  <div key={i} className="aw-slip-row">
                    <strong>#{i + 1} {label || "Waste"}:</strong>
                    <span>{r.weight || 0} kg · {r.category}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            [
              ["Waste Type", wasteLabel || "—"],
              ["Weight", `${weight || "—"} kg`],
              ["Category", effectiveCat || "—"],
              ["Date", new Date().toLocaleDateString("en-IN")],
              ["Time", new Date().toLocaleTimeString("en-IN")]
            ].map(([k, v]) => (
              <div key={k} className="aw-slip-row">
                <strong>{k}:</strong>
                <span>{v}</span>
              </div>
            ))
          )}
        </div>
        <hr/>
        <div className="aw-slip-sigs">
          <div className="aw-slip-sig"><p>Authorized Signature</p><div className="aw-slip-line"/></div>
          <div className="aw-slip-sig"><p>Hospital Stamp</p><div className="aw-slip-line"/></div>
        </div>
        <p className="aw-slip-gen">Generated by MediSort — Biomedical Waste Management System</p>
      </div>

    </div>
  );
}

export default AddWaste;