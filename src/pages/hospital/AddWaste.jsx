import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import "../../App.css";

function AddWaste({ onBack }) {
  const [wasteType, setWasteType] = useState("");
  const [weight, setWeight] = useState("");
  const [category, setCategory] = useState("");

  // Check the biomedical waste category
  function checkCategory() {
    if (!wasteType) {
      alert("⚠️ Please select a waste material.");
      return;
    }

    if (!weight || Number(weight) <= 0) {
      alert("⚠️ Please enter a valid weight.");
      return;
    }

    let recommendedCategory;

    switch (wasteType) {
      case "Blood-soaked dressing":
        recommendedCategory = "YELLOW";
        break;

      case "Used syringe":
        recommendedCategory = "WHITE";
        break;

      case "Contaminated plastic":
        recommendedCategory = "RED";
        break;

      case "Glass vial":
        recommendedCategory = "BLUE";
        break;

      default:
        recommendedCategory = "";
    }

    setCategory(recommendedCategory);
  }

  // Save waste record to Firebase
  async function saveWaste() {
    if (!wasteType) {
      alert("⚠️ Please select a waste material.");
      return;
    }

    if (!weight || Number(weight) <= 0) {
      alert("⚠️ Please enter a valid weight.");
      return;
    }

    if (!category) {
      alert("⚠️ Please check the waste category first.");
      return;
    }

    try {
      await addDoc(collection(db, "wasteRecords"), {
        hospital: "AARO­GYA Hospital",
        wasteType: wasteType,
        weight: Number(weight),
        category: category,
        createdAt: serverTimestamp(),
      });

      alert("✅ Waste Record Saved Successfully!");

      // Clear form
      setWasteType("");
      setWeight("");
      setCategory("");
    } catch (error) {
      console.error("Error saving waste:", error);

      alert(
        "❌ Firebase Error:\n" +
          error.code +
          "\n" +
          error.message
      );
    }
  }

  return (
    <div className="add-waste-page">

<button
  type="button"
  className="back-button"
  onClick={onBack}
>
  ← Back 
</button>






      {/* HEADER */}
      <div className="add-waste-header">








        <div className="waste-title-icon">
          🗑️
        </div>

        <div>
          <h1>Add Medical Waste</h1>
          <p>AAROGYA Hospital</p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="add-waste-card">

        {/* WASTE MATERIAL */}
        <div className="form-group">
          <label>Select Waste Material</label>

          <select
            value={wasteType}
            onChange={(e) => {
              setWasteType(e.target.value);
              setCategory("");
            }}
          >
            <option value="">-- Select Waste --</option>

            <option value="Blood-soaked dressing">
              Blood-soaked dressing
            </option>

            <option value="Used syringe">
              Used syringe
            </option>

            <option value="Contaminated plastic">
              Contaminated plastic
            </option>

            <option value="Glass vial">
              Glass vial
            </option>
          </select>
        </div>

        {/* WEIGHT */}
        <div className="form-group">
          <label>Enter Weight</label>

    <div className="weight-input">

  <span>⚖️</span>

  <input
    type="number"
    min="0"
    step="0.01"
    placeholder="Enter weight"
    value={weight}
    onChange={(e) => setWeight(e.target.value)}
  />

  <span className="kg-text">kg</span>

</div>
        </div>

        {/* CHECK CATEGORY */}
        <button
          type="button"
          className="check-category-btn"
          onClick={checkCategory}
        >
          🔍 Check Category
        </button>

        {/* CATEGORY RESULT */}
        {category && (
          <div className={`category-result ${category.toLowerCase()}`}>

            <div className="category-result-header">
              <span className="category-color-icon">✓</span>

              <div>
                <h2>Waste Category</h2>
                <p>Recommended biomedical waste category</p>
              </div>
            </div>

            <div className="category-info">

              <div
                className={`category-dot ${category.toLowerCase()}`}
              ></div>

              <div>
                <h3>{category}</h3>

                <p>
                  <strong>Waste:</strong> {wasteType}
                </p>

                <p>
                  <strong>Weight:</strong> {weight} kg
                </p>
              </div>

            </div>

            {/* SAVE */}
            <button
              type="button"
              className="save-waste-btn"
              onClick={saveWaste}
            >
              💾 Save Waste Record
            </button>

          </div>
        )}

      </div>
    </div>
  );
}

export default AddWaste;