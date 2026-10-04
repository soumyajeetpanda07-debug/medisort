import { useState, useEffect } from "react";
import "./FrontPage.css";

// ─── 3-Language Dictionary for Landing Page ─────────────────────────
const LANDING_STRINGS = {
  en: {
    navHome: "Home",
    navStats: "Live Stats",
    navStreams: "Color Streams",
    navRoles: "Portals",
    navFeatures: "How It Works",
    navAbout: "About",
    navAiBtn: "✨ AI Assistant",
    navGetStarted: "Get Started",
    heroTagline: "Safe Hospitals | Clean Communities | Greener Tomorrow",
    heroH1Pre: "Manage Medical",
    heroH1Post: "Waste",
    heroH1Highlight: "Smarter",
    heroSub: "Real-time GPS tracking, CPCB Form VI digital compliance, AI segregation vision, and end-to-end chain of custody for sustainable healthcare.",
    getStartedBtn: "Get Started →",
    exploreBtn: "Explore Workflow",
    aiScannerBtn: "✨ Live AI Scanner",
    stat1Val: "99.4%",
    stat1Lbl: "CPCB Compliance Rate",
    stat2Val: "14,820 KG",
    stat2Lbl: "Bio-Medical Waste Tracked",
    stat3Val: "42+",
    stat3Lbl: "Hospitals Connected",
    stat4Val: "0%",
    stat4Lbl: "Landfill Contamination",
    // Hero Dashboard
    dashTitle: "Live Healthcare Operations Hub",
    dashBarcodeTagTitle: "Live CPCB Form VI Barcode Tag",
    dashLaserTitle: "Optical Holographic Laser Scanner",
    dashLaserSub: "Sub-second CPCB Vision AI",
    // Roles
    rolesTitle: "Unified Role Portals",
    rolesSub: "Specialized interfaces built for every stakeholder in the biomedical waste lifecycle.",
    roleHospitalTitle: "Hospital Portal",
    roleHospitalSub: "Log daily ward waste, generate verifiable CPCB barcode tags, and audit segregation compliance.",
    roleHospitalAction: "Enter Hospital Portal →",
    roleCollectorTitle: "Collector Fleet",
    roleCollectorSub: "GPS-optimized collection routes, digital barcode scanning at pickup, and custody transit logs.",
    roleCollectorAction: "Enter Collector Fleet →",
    roleAdminTitle: "State Admin & SPCB",
    roleAdminSub: "Comprehensive oversight, real-time pollution board compliance audits, and legal non-conformance logs.",
    roleAdminAction: "Enter Admin Console →",
    // Color Streams
    streamsTitle: "CPCB 2016 Bio-Medical Waste Streams",
    streamsSub: "Strict segregation at source prevents pathogen outbreaks, toxic emissions, and groundwater contamination.",
    // How It Works
    howTitle: "How MediSort Works",
    howSub: "From Hospital Ward to Authorized Treatment Facility",
    step1Title: "1. Segregate at Source",
    step1Text: "Clinical staff segregates items into 4 CPCB color categories with AI multimodal vision verification.",
    step2Title: "2. Form VI Tagging",
    step2Text: "Instant generation of adhesive Code-128 barcodes and dynamic QR stickers with GPS metadata.",
    step3Title: "3. Monitored Transit",
    step3Text: "Authorized CBWTF fleets scan and transport waste under live GPS-monitored chain of custody.",
    step4Title: "4. Scientific Treatment",
    step4Text: "High-temperature incineration (1050°C), autoclaving, shredding, and circular recycling.",
    // Trust
    trustTitle: "National Healthcare & Environmental Standards",
    footerText: "Together for a Cleaner, Healthier India 🌿 • Smart India Hackathon Flagship Project"
  },
  hi: {
    navHome: "होम",
    navStats: "आंकड़े",
    navStreams: "कचरा श्रेणियां",
    navRoles: "पोर्टल",
    navFeatures: "कार्यप्रणाली",
    navAbout: "परिचय",
    navAiBtn: "✨ एआई सहायक",
    navGetStarted: "शुरू करें",
    heroTagline: "सुरक्षित अस्पताल | स्वच्छ समुदाय | हरित कल",
    heroH1Pre: "बायोमेडिकल कचरा प्रबंधन",
    heroH1Post: "करें",
    heroH1Highlight: "स्मार्ट",
    heroSub: "रीयल-टाइम जीपीएस ट्रैकिंग, सीपीसीबी 2016 फॉर्म VI डिजिटल बारकोड, और एआई विज़न द्वारा अस्पताल अपशिष्ट का सुरक्षित निस्तारण।",
    getStartedBtn: "प्रारंभ करें →",
    exploreBtn: "कार्यप्रणाली देखें",
    aiScannerBtn: "✨ लाइव एआई स्कैनर",
    stat1Val: "99.4%",
    stat1Lbl: "सीपीसीबी नियम अनुपालन दर",
    stat2Val: "14,820 किग्रा",
    stat2Lbl: "प्रसंस्कृत बायोमेडिकल कचरा",
    stat3Val: "42+",
    stat3Lbl: "संबद्ध अस्पताल एवं केंद्र",
    stat4Val: "0%",
    stat4Lbl: "लैंडफिल संदूषण दुर्घटना",
    dashTitle: "लाइव अस्पताल संचालन केंद्र",
    dashBarcodeTagTitle: "सीपीसीबी फॉर्म VI बारकोड टैग",
    dashLaserTitle: "ऑप्टिकल होलोग्राफिक लेजर स्कैनर",
    dashLaserSub: "माइक्रो-सेकंड एआई विज़न जांच",
    rolesTitle: "एकीकृत हितधारक पोर्टल",
    rolesSub: "बायोमेडिकल अपशिष्ट प्रबंधन श्रृंखला के प्रत्येक हितधारक के लिए समर्पित डिजिटल पोर्टल।",
    roleHospitalTitle: "अस्पताल पोर्टल",
    roleHospitalSub: "वार्ड-वार दैनिक कचरा रिकॉर्ड दर्ज करें, डिजिटल बारकोड बनाएं और संदूषण ऑडिट करें।",
    roleHospitalAction: "अस्पताल पोर्टल खोलें →",
    roleCollectorTitle: "कलेक्टर फ्लीट पोर्टल",
    roleCollectorSub: "जीपीएस रूट ट्रैकिंग, बारकोड स्कैनिंग और डिजिटल कस्टडी सत्यापन।",
    roleCollectorAction: "कलेक्टर पोर्टल खोलें →",
    roleAdminTitle: "राज्य प्रदूषण बोर्ड एडमिन",
    roleAdminSub: "राज्य प्रदूषण नियंत्रण बोर्ड (SPCB) ऑडिट, उल्लंघन निगरानी और अनुपालन रिपोर्ट।",
    roleAdminAction: "एडमिन कंसोल खोलें →",
    streamsTitle: "सीपीसीबी 2016 बायोमेडिकल कचरा श्रेणियां",
    streamsSub: "स्रोत पर सही पृथक्करण रोग प्रसार रोकता है और पर्यावरण की रक्षा करता है।",
    howTitle: "मेडीसॉर्ट कैसे काम करता है?",
    howSub: "अस्पताल वार्ड से वैज्ञानिक उपचार संयंत्र तक",
    step1Title: "1. स्रोत पर पृथक्करण",
    step1Text: "एआई विज़न की सहायता से 4 निर्धारित रंग श्रेणियों में कचरा अलग किया जाता है।",
    step2Title: "2. फॉर्म VI बारकोड टैग",
    step2Text: "वजन, जीपीएस और विभाग सहित कोड-128 बारकोड और क्यूआर स्टिकर जनरेट करें।",
    step3Title: "3. जीपीएस फ्लीट परिवहन",
    step3Text: "अधिकृत CBWTF वाहनों द्वारा सुरक्षित एवं ट्रैक योग्य परिवहन।",
    step4Title: "4. वैज्ञानिक निस्तारण",
    step4Text: "भस्मीकरण (1050°C), ऑटोक्लेविंग, श्रेडिंग और 100% रीसाइक्लिंग।",
    trustTitle: "राष्ट्रीय स्वास्थ्य एवं पर्यावरण मानक",
    footerText: "स्वच्छ और स्वस्थ भारत के लिए समर्पित 🌿 • स्मार्ट इंडिया हैकथॉन नवाचार"
  },
  or: {
    navHome: "ମୂଳପୃଷ୍ଠା",
    navStats: "ପରିସଂଖ୍ୟାନ",
    navStreams: "ବର୍ଗ ବିଭାଜନ",
    navRoles: "ପୋର୍ଟାଲ୍",
    navFeatures: "କାର୍ଯ୍ୟପ୍ରଣାଳୀ",
    navAbout: "ଆମ ବିଷୟରେ",
    navAiBtn: "✨ AI ସହାୟକ",
    navGetStarted: "ଆରମ୍ଭ କରନ୍ତୁ",
    heroTagline: "ସୁରକ୍ଷିତ ଡାକ୍ତରଖାନା | ସ୍ୱଚ୍ଛ ସମାଜ | ସବୁଜ ଭବିଷ୍ୟତ",
    heroH1Pre: "ଡାକ୍ତରଖାନା ବର୍ଜ୍ୟବସ୍ତୁ ପରିଚାଳନା",
    heroH1Post: "କରନ୍ତୁ",
    heroH1Highlight: "ସ୍ମାର୍ଟ୍ ଭାବରେ",
    heroSub: "ଲାଇଭ୍ GPS ଟ୍ରାକିଂ, CPCB ଫର୍ମ VI ବାରକୋଡ୍, ଏବଂ AI କ୍ୟାମେରା ଭିଜନ୍ ସହିତ ସୁରକ୍ଷିତ ବର୍ଜ୍ୟବସ୍ତୁ ନିଷ୍କାସନ ।",
    getStartedBtn: "ଆରମ୍ଭ କରନ୍ତୁ →",
    exploreBtn: "କାର୍ଯ୍ୟପ୍ରଣାଳୀ ଦେଖନ୍ତୁ",
    aiScannerBtn: "✨ ଲାଇଭ୍ AI ସ୍କାନର୍",
    stat1Val: "୯୯.୪%",
    stat1Lbl: "CPCB ନିୟମ ଅନୁପାଳନ",
    stat2Val: "୧୪,୮୨୦ କିଗ୍ରା",
    stat2Lbl: "ସୁରକ୍ଷିତ ନିଷ୍କାସିତ ବର୍ଜ୍ୟବସ୍ତୁ",
    stat3Val: "୪୨+",
    stat3Lbl: "ସଂଯୁକ୍ତ ଡାକ୍ତରଖାନା",
    stat4Val: "୦%",
    stat4Lbl: "ପ୍ରଦୂଷଣ ଦୁର୍ଘଟଣା",
    dashTitle: "ଲାଇଭ୍ ସ୍ୱାସ୍ଥ୍ୟସେବା ପରିଚାଳନା କେନ୍ଦ୍ର",
    dashBarcodeTagTitle: "CPCB ଫର୍ମ VI ବାରକୋଡ୍ ଟ୍ୟାଗ୍",
    dashLaserTitle: "ଅପ୍ଟିକାଲ୍ ଲେଜର୍ ସ୍କାନର୍",
    dashLaserSub: "ତତକ୍ଷଣାତ୍ AI ଭିଜନ୍ ଯାଞ୍ଚ",
    rolesTitle: "ଡିଜିଟାଲ୍ ପୋର୍ଟାଲ୍ ସମୂହ",
    rolesSub: "ଡାକ୍ତରଖାନା, ବର୍ଜ୍ୟବସ୍ତୁ ସଂଗ୍ରହକାରୀ ଓ ପ୍ରଶାସନ ପାଇଁ ସ୍ୱତନ୍ତ୍ର ଡିଜିଟାଲ୍ ବ୍ୟବସ୍ଥା ।",
    roleHospitalTitle: "ଡାକ୍ତରଖାନା ପୋର୍ଟାଲ୍",
    roleHospitalSub: "ଦୈନିକ ବର୍ଜ୍ୟ ରେକର୍ଡ, ଡିଜିଟାଲ୍ ବାରକୋଡ୍ ଟ୍ୟାଗିଂ ଏବଂ ପ୍ରଦୂଷଣ ଯାଞ୍ଚ କରନ୍ତୁ ।",
    roleHospitalAction: "ଡାକ୍ତରଖାନା ପୋର୍ଟାଲ୍ →",
    roleCollectorTitle: "ସଂଗ୍ରହକାରୀ ଗାଡ଼ି ପୋର୍ଟାଲ୍",
    roleCollectorSub: "GPS ରୁଟ୍ ନେଭିଗେସନ୍, ବାରକୋଡ୍ ସ୍କାନିଂ ଏବଂ ଡିଜିଟାଲ୍ ରସିଦ ।",
    roleCollectorAction: "ସଂଗ୍ରହକାରୀ ପୋର୍ଟାଲ୍ →",
    roleAdminTitle: "ରାଜ୍ୟ ପ୍ରଦୂଷଣ ନିୟନ୍ତ୍ରଣ ବୋର୍ଡ",
    roleAdminSub: "ସମସ୍ତ ଡାକ୍ତରଖାନାର ଅନୁପାଳନ ରିପୋର୍ଟ, NGT ନିୟମ ଯାଞ୍ଚ ଓ ଅଡିଟ୍ ।",
    roleAdminAction: "ପ୍ରଶାସନିକ କନସୋଲ୍ →",
    streamsTitle: "CPCB 2016 ବର୍ଜ୍ୟବସ୍ତୁ ବର୍ଗୀକରଣ",
    streamsSub: "ଉତ୍ସ ସ୍ଥଳରେ ସଠିକ୍ ପୃଥକୀକରଣ ସଂକ୍ରମଣ ଓ ପରିବେଶ ପ୍ରଦୂଷଣ ରୋକିଥାଏ ।",
    howTitle: "ମେଡ଼ିସର୍ଟ କିପରି କାର୍ଯ୍ୟ କରେ?",
    howSub: "ୱାର୍ଡରୁ ପ୍ରାମାଣିକ ଚିକିତ୍ସା କେନ୍ଦ୍ର ପର୍ଯ୍ୟନ୍ତ",
    step1Title: "୧. ଉତ୍ସରେ ପୃଥକୀକରଣ",
    step1Text: "AI କ୍ୟାମେରା ସହାୟତାରେ ୪ଟି ନିର୍ଦ୍ଧାରିତ ରଙ୍ଗ ପାତ୍ରରେ ବର୍ଜ୍ୟବସ୍ତୁ ଅଲଗା କରନ୍ତୁ ।",
    step2Title: "୨. ବାରକୋଡ୍ ଟ୍ୟାଗିଂ",
    step2Text: "ওଜନ ଓ GPS ସହ କୋଡ୍-୧୨୮ ବାରକୋଡ୍ ଏବଂ QR ଷ୍ଟିକର୍ ସୃଷ୍ଟି କରନ୍ତୁ ।",
    step3Title: "୩. GPS ଯାନ ପରିବହନ",
    step3Text: "ଅନୁମୋଦିତ CBWTF ଯାନ ଦ୍ୱାରା ନିରନ୍ତର ଟ୍ରାକ୍ ହୋଇ ପରିବହନ ।",
    step4Title: "୪. ବୈଜ୍ଞାନିକ ଉପଚାର",
    step4Text: "ଉଚ୍ଚ ତାପମାତ୍ରାରେ ଭସ୍ମୀକରଣ (୧୦୫୦°C), ଅଟୋକ୍ଲେଭିଂ ଏବଂ ରିସାଇକ୍ଲିଂ ।",
    trustTitle: "ଜାତୀୟ ସ୍ୱାସ୍ଥ୍ୟ ଓ ପରିବେଶ ମାନକ",
    footerText: "ସ୍ୱଚ୍ଛ ଓ ସୁସ୍ଥ ଭାରତ ଗଠନ ପାଇଁ 🌿 • ସ୍ମାର୍ଟ ଇଣ୍ଡିଆ ହାକାଥନ୍ ନବସୃଜନ"
  }
};

// ─── CPCB Color Stream Data ─────────────────────────────────────────
const CPCB_STREAMS = [
  {
    id: "YELLOW",
    title: "Yellow Stream",
    symbol: "☣",
    color: "#eab308",
    bgTint: "rgba(234, 179, 8, 0.08)",
    borderTint: "rgba(234, 179, 8, 0.3)",
    container: "Yellow Non-Chlorinated Autoclavable Plastic Bag",
    treatment: "Incineration at 1050°C / Plasma Pyrolysis / Deep Burial",
    items: "Soiled cotton gauze, blood bandages, pathological tissues, expired cytotoxic drugs",
    badge: "INCINERATION",
    shortLabel: "Biohazard Incineration",
    statBadge: "● 99%",
    verifiedPill: "Yellow Category • 99.4% CPCB Verified",
    barcodeCode: "*BMW-OD-AIIMS-2026-YEL-8492*",
    weight: "2.45 KG",
    ward: "ICU Ward 4B"
  },
  {
    id: "RED",
    title: "Red Stream",
    symbol: "♻",
    color: "#ef4444",
    bgTint: "rgba(239, 68, 68, 0.08)",
    borderTint: "rgba(239, 68, 68, 0.3)",
    container: "Red Non-Chlorinated Autoclavable Plastic Bag",
    treatment: "Autoclaving / Microwaving followed by Shredding & Pelletizing",
    items: "Contaminated IV tubings, catheters, syringes without needles, disposable latex gloves",
    badge: "AUTOCLAVE + RECYCLE",
    shortLabel: "Autoclave Recycling",
    statBadge: "● 0%",
    verifiedPill: "Red Category • 100% Autoclave Verified",
    barcodeCode: "*BMW-OD-AIIMS-2026-RED-5104*",
    weight: "3.10 KG",
    ward: "Surgery Suite 2"
  },
  {
    id: "WHITE",
    title: "White Stream",
    symbol: "⚠",
    color: "#64748b",
    bgTint: "rgba(100, 116, 139, 0.08)",
    borderTint: "rgba(100, 116, 139, 0.3)",
    container: "Puncture-Proof, Leak-Proof Translucent Polypropylene Container",
    treatment: "Autoclaving / Dry Heat followed by Mutilation / Iron Smelting",
    items: "Needles, syringes with fixed needles, scalpels, surgical blades, trocar points",
    badge: "SHARPS SMELTING",
    shortLabel: "Sharps Mutilation",
    statBadge: "● 83%",
    verifiedPill: "White Category • Puncture-Proof Verified",
    barcodeCode: "*BMW-OD-AIIMS-2026-WHT-2931*",
    weight: "0.85 KG",
    ward: "Trauma Emergency"
  },
  {
    id: "BLUE",
    title: "Blue Stream",
    symbol: "🧪",
    color: "#3b82f6",
    bgTint: "rgba(59, 130, 246, 0.08)",
    borderTint: "rgba(59, 130, 246, 0.3)",
    container: "Puncture-Proof Cardboard Box / Rigid Caddy with Blue Markings",
    treatment: "Disinfection (1% Sodium Hypochlorite) or Autoclaving then Glass Recycling",
    items: "Broken or intact medicine glass vials, ampoules, orthopedic metallic implants",
    badge: "GLASS RECYCLING",
    shortLabel: "Glass Vials",
    statBadge: "● 25%",
    verifiedPill: "Blue Category • Glass Ampoules Verified",
    barcodeCode: "*BMW-OD-AIIMS-2026-BLU-7419*",
    weight: "1.60 KG",
    ward: "Oncology Daycare"
  }
];

function FrontPage({ onHospitalClick, onCollectorClick, onAdminClick, onOpenAiAssistant }) {
  const [lang, setLang] = useState(() => localStorage.getItem("medisort_lang") || "en");
  const [selectedHeroBin, setSelectedHeroBin] = useState("YELLOW");
  const t = LANDING_STRINGS[lang] || LANDING_STRINGS.en;

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem("medisort_lang", newLang);
  };

  const activeStream = CPCB_STREAMS.find(s => s.id === selectedHeroBin) || CPCB_STREAMS[0];

  return (
    <div className="landing-page">

      {/* ─── FROSTED-GLASS NAVBAR ─── */}
      <header className="navbar">
        {/* ── TOP IDENTITY BAR ── */}
        <div className="navbar-top">
          <div className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            {/* 3D Emblem */}
            <div className="brand-logo-3d">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGrad1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#34d399"/>
                    <stop offset="100%" stopColor="#059669"/>
                  </linearGradient>
                  <linearGradient id="logoGrad2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6ee7b7"/>
                    <stop offset="100%" stopColor="#10b981"/>
                  </linearGradient>
                  <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#059669" floodOpacity="0.4"/>
                  </filter>
                </defs>
                {/* 3D cube-like cross */}
                <rect x="4" y="18" width="40" height="12" rx="6" fill="url(#logoGrad1)" filter="url(#logoShadow)"/>
                <rect x="18" y="4" width="12" height="40" rx="6" fill="url(#logoGrad2)" filter="url(#logoShadow)"/>
                {/* Shine highlight */}
                <rect x="19" y="5" width="5" height="16" rx="2.5" fill="rgba(255,255,255,0.4)"/>
                <rect x="5" y="19" width="16" height="5" rx="2.5" fill="rgba(255,255,255,0.3)"/>
              </svg>
            </div>
            <div className="brand-text-wrap">
              <h2 className="brand-name">MediSort</h2>
              <span className="brand-sub">CPCB Biomedical Suite</span>
            </div>
          </div>

          {/* System Status Pill */}
          <div className="navbar-status-pill">
            <span className="status-dot-live" />
            <span className="status-text-full">System Online (24ms)</span>
            <span className="status-text-compact">24ms</span>
          </div>

          {/* Language Selector */}
          <div className="navbar-lang-selector">
            <span className="lang-globe">🌐</span>
            <button
              type="button"
              className={`navbar-lang-opt ${lang === "en" ? "active" : ""}`}
              onClick={() => handleLangChange("en")}
            >
              <span className="lang-full">English</span>
              <span className="lang-short">EN</span>
            </button>
            <span className="lang-divider">|</span>
            <button
              type="button"
              className={`navbar-lang-opt ${lang === "hi" ? "active" : ""}`}
              onClick={() => handleLangChange("hi")}
            >
              <span className="lang-full">हिंदी</span>
              <span className="lang-short">HI</span>
            </button>
            <span className="lang-divider">|</span>
            <button
              type="button"
              className={`navbar-lang-opt ${lang === "or" ? "active" : ""}`}
              onClick={() => handleLangChange("or")}
            >
              <span className="lang-full">ଓଡ଼ିଆ</span>
              <span className="lang-short">OD</span>
            </button>
            <span className="lang-chevron">▾</span>
          </div>
        </div>

        {/* ── BOTTOM FLOATING CAPSULE NAV ── */}
        <div className="navbar-bottom">
          <div className="navbar-capsule">
            {/* Nav Links */}
            <nav className="capsule-nav">
              <a href="#home" className="capsule-link capsule-active">{t.navHome}</a>
              <a href="#roles" className="capsule-link">{t.navRoles}</a>
              <a href="#stats" className="capsule-link">{t.navStats}</a>
              <a href="#streams" className="capsule-link">{t.navStreams}</a>
              <a href="#features" className="capsule-link">{t.navFeatures}</a>
              <a href="#about" className="capsule-link">{t.navAbout}</a>
            </nav>
          </div>

          {/* Right side action buttons */}
          <div className="capsule-actions">
            {onOpenAiAssistant && (
              <button className="capsule-ai-btn" onClick={onOpenAiAssistant} title="Open AI Segregation Assistant">
                <span className="capsule-ai-sparkle">✨</span>
                {t.navAiBtn || "AI Scanner"}
              </button>
            )}
            <button
              className="capsule-launch-btn"
              onClick={() => document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t.navGetStarted || "Launch Console"} →
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <main id="home">
        <section className="hero">
          <div className="hero-left">
            <div className="tagline">
              <span className="tagline-flag">🇮🇳</span>
              <span>{t.heroTagline}</span>
              <span className="tagline-badge">CPCB 2016</span>
            </div>

            <h1>
              {t.heroH1Pre}
              <br />
              {t.heroH1Post} <span>{t.heroH1Highlight}</span>
            </h1>

            <p className="hero-subtext">
              {t.heroSub}
            </p>

            <div className="hero-buttons">
              <button
                className="primary-button"
                onClick={() => document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" })}
              >
                {t.getStartedBtn}
              </button>

              {onOpenAiAssistant && (
                <button className="ai-hero-button" onClick={onOpenAiAssistant}>
                  <span className="sparkle-ico">✨</span>
                  {t.aiScannerBtn}
                </button>
              )}

              <button
                className="secondary-button"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                {t.exploreBtn}
              </button>
            </div>

            {/* ─── LIVE COMPLIANCE STATS STRIP ─── */}
            <div className="hero-stats-strip" id="stats">
              <div className="hero-stat-box">
                <strong>{t.stat1Val}</strong>
                <span>{t.stat1Lbl}</span>
              </div>
              <div className="hero-stat-box">
                <strong>{t.stat2Val}</strong>
                <span>{t.stat2Lbl}</span>
              </div>
              <div className="hero-stat-box">
                <strong>{t.stat3Val}</strong>
                <span>{t.stat3Lbl}</span>
              </div>
              <div className="hero-stat-box">
                <strong className="stat-highlight-safe">{t.stat4Val}</strong>
                <span>{t.stat4Lbl}</span>
              </div>
            </div>
          </div>

          {/* ─── HERO RIGHT: INTERACTIVE MEDICAL DASHBOARD SHOWCASE ─── */}
          <div className="hero-right">
            <div className="hero-dashboard-card">
              {/* Dashboard Top Header with 3D Crystal Cross & Telemetry */}
              <div className="dashboard-top-bar">
                <div className="dash-brand-icon-3d">
                  <span className="crystal-cross">✚</span>
                  <div className="dash-title-wrap">
                    <strong>{t.dashTitle}</strong>
                  </div>
                </div>

                <div className="dash-header-right">
                  {/* ECG Heartbeat Wave */}
                  <svg className="dash-ecg-svg" viewBox="0 0 60 18" fill="none">
                    <path
                      d="M0 9 L16 9 L21 3 L26 15 L31 6 L36 12 L41 9 L60 9"
                      stroke="#10b981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="dash-telemetry-pill">
                    <span className="dash-pulse-dot" />
                    <span>CPCB Live Telemetry (24ms)</span>
                  </div>
                </div>
              </div>

              {/* Main Dual Feature Preview */}
              <div className="dash-feature-grid">
                {/* 1. Holographic 3D AI Vision Inspection Pod */}
                <div
                  className="dash-scanner-pod"
                  onClick={onOpenAiAssistant}
                  title="Click to launch Multimodal AI Scanner"
                >
                  {/* Floating verification badge */}
                  <div className="scanner-floating-pill">
                    <span className="scanner-reticle-ico">⌖</span>
                    <span>{activeStream.verifiedPill}</span>
                  </div>

                  {/* Holographic Glowing Dome & 3D Container Display */}
                  <div className="scanner-dome-wrapper">
                    <div className="hologram-dome-glow" />
                    <div className="hologram-dome-ring" />
                    <div className="hologram-scanner-laser" />

                    {/* 3D Clinical Container */}
                    <div className={`clinical-3d-box ${selectedHeroBin.toLowerCase()}`}>
                      <div className="box-handle" />
                      <div className="box-body">
                        <span className="box-symbol">{activeStream.symbol}</span>
                      </div>
                      <div className="box-pedestal">
                        <div className="pedestal-ring" />
                      </div>
                    </div>
                  </div>

                  <div className="scanner-click-hint">
                    <span>✨ Test in Live AI Scanner</span>
                    <small>Real-Time Multimodal Audit</small>
                  </div>
                </div>

                {/* 2. CPCB Form VI Adhesive Bag Tag with Holographic Seal */}
                <div className="dash-sticker-tag">
                  <div className="sticker-header-row">
                    <span className="sticker-title">CPCB Form VI adhesive tag</span>
                    <span className="sticker-live-badge">VERIFIED</span>
                  </div>

                  {/* Metallic Hologram Badge + Code-128 Barcode */}
                  <div className="sticker-barcode-row">
                    <div className="hologram-metallic-seal" title="State Pollution Control Board Seal">
                      <div className="seal-pattern" />
                      <span className="seal-text">CPCB</span>
                    </div>

                    <div className="barcode-render-box">
                      <svg viewBox="0 0 160 36" className="dash-mini-barcode" preserveAspectRatio="none">
                        <rect x="0" y="0" width="3" height="36" fill="#0f172a" />
                        <rect x="5" y="0" width="1.5" height="36" fill="#0f172a" />
                        <rect x="8" y="0" width="4" height="36" fill="#0f172a" />
                        <rect x="14" y="0" width="2" height="36" fill="#0f172a" />
                        <rect x="18" y="0" width="5" height="36" fill="#0f172a" />
                        <rect x="25" y="0" width="1.5" height="36" fill="#0f172a" />
                        <rect x="28" y="0" width="3" height="36" fill="#0f172a" />
                        <rect x="33" y="0" width="4" height="36" fill="#0f172a" />
                        <rect x="39" y="0" width="2" height="36" fill="#0f172a" />
                        <rect x="43" y="0" width="5" height="36" fill="#0f172a" />
                        <rect x="50" y="0" width="1.5" height="36" fill="#0f172a" />
                        <rect x="53" y="0" width="3" height="36" fill="#0f172a" />
                        <rect x="58" y="0" width="4.5" height="36" fill="#0f172a" />
                        <rect x="65" y="0" width="2" height="36" fill="#0f172a" />
                        <rect x="69" y="0" width="5" height="36" fill="#0f172a" />
                        <rect x="76" y="0" width="2" height="36" fill="#0f172a" />
                        <rect x="80" y="0" width="3.5" height="36" fill="#0f172a" />
                        <rect x="86" y="0" width="1.5" height="36" fill="#0f172a" />
                        <rect x="89" y="0" width="4" height="36" fill="#0f172a" />
                        <rect x="95" y="0" width="3" height="36" fill="#0f172a" />
                        <rect x="100" y="0" width="2" height="36" fill="#0f172a" />
                        <rect x="104" y="0" width="5" height="36" fill="#0f172a" />
                        <rect x="111" y="0" width="1.5" height="36" fill="#0f172a" />
                        <rect x="114" y="0" width="4" height="36" fill="#0f172a" />
                        <rect x="120" y="0" width="2.5" height="36" fill="#0f172a" />
                        <rect x="124" y="0" width="4" height="36" fill="#0f172a" />
                        <rect x="130" y="0" width="2" height="36" fill="#0f172a" />
                        <rect x="134" y="0" width="5" height="36" fill="#0f172a" />
                        <rect x="141" y="0" width="1.5" height="36" fill="#0f172a" />
                        <rect x="144" y="0" width="4" height="36" fill="#0f172a" />
                        <rect x="150" y="0" width="3" height="36" fill="#0f172a" />
                        <rect x="155" y="0" width="4" height="36" fill="#0f172a" />
                      </svg>
                      <small className="barcode-code-lbl">Code-128</small>
                    </div>
                  </div>

                  {/* QR Matrix + Hospital Details */}
                  <div className="sticker-meta-row">
                    <div className="sticker-qr-box">
                      <svg viewBox="0 0 36 36" className="sticker-qr-svg">
                        <rect width="36" height="36" fill="#ffffff" />
                        <rect x="1" y="1" width="11" height="11" fill="#0f172a" />
                        <rect x="3" y="3" width="7" height="7" fill="#ffffff" />
                        <rect x="5" y="5" width="3" height="3" fill="#0f172a" />
                        <rect x="24" y="1" width="11" height="11" fill="#0f172a" />
                        <rect x="26" y="3" width="7" height="7" fill="#ffffff" />
                        <rect x="28" y="5" width="3" height="3" fill="#0f172a" />
                        <rect x="1" y="24" width="11" height="11" fill="#0f172a" />
                        <rect x="3" y="26" width="7" height="7" fill="#ffffff" />
                        <rect x="5" y="28" width="3" height="3" fill="#0f172a" />
                        <rect x="15" y="3" width="3" height="3" fill="#0f172a" />
                        <rect x="19" y="3" width="3" height="3" fill="#0f172a" />
                        <rect x="15" y="8" width="3" height="3" fill="#0f172a" />
                        <rect x="16" y="13" width="4" height="4" fill="#0f172a" />
                        <rect x="22" y="15" width="4" height="3" fill="#0f172a" />
                        <rect x="15" y="20" width="3" height="4" fill="#0f172a" />
                        <rect x="20" y="20" width="4" height="4" fill="#0f172a" />
                        <rect x="26" y="20" width="3" height="3" fill="#0f172a" />
                        <rect x="15" y="26" width="4" height="4" fill="#0f172a" />
                        <rect x="20" y="26" width="4" height="3" fill="#0f172a" />
                        <rect x="26" y="26" width="4" height="4" fill="#0f172a" />
                        <rect x="31" y="26" width="3" height="3" fill="#0f172a" />
                        <rect x="31" y="31" width="4" height="4" fill="#0f172a" />
                      </svg>
                    </div>

                    <div className="sticker-details-col">
                      <strong>AIIMS Bhubaneswar</strong>
                      <span>{activeStream.ward}</span>
                      <span>Weight: <strong>{activeStream.weight}</strong></span>
                      <span className="gps-verified-tag">GPS Validated ✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Tactile Glossy Stream Cards */}
              <div className="dash-bins-row-tactile">
                {CPCB_STREAMS.map(stream => {
                  const isSelected = selectedHeroBin === stream.id;
                  return (
                    <button
                      key={stream.id}
                      type="button"
                      className={`dash-tactile-card ${stream.id.toLowerCase()} ${isSelected ? "active" : ""}`}
                      onClick={() => setSelectedHeroBin(stream.id)}
                    >
                      <div className="tactile-top-row">
                        <span className="tactile-name">{stream.id}</span>
                        <span className="tactile-stat-pill">{stream.statBadge}</span>
                      </div>
                      <div className="tactile-bottom-row">
                        <span className="tactile-icon-squircle">{stream.symbol}</span>
                        <span className="tactile-label">{stream.shortLabel}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ─── 1. ROLES PORTAL SECTION (Elevated directly beneath Hero) ─── */}
        <section className="roles-section" id="roles">
          <div className="section-head-center">
            <span className="section-tag-pill">ROLE-BASED WORKSPACES</span>
            <h2>{t.rolesTitle}</h2>
            <p>{t.rolesSub}</p>
          </div>

          <div className="roles-cards-grid">
            {/* 1. Hospital Portal Card */}
            <div className="role-portal-card hospital" onClick={onHospitalClick}>
              <div className="role-portal-top">
                <div className="role-title-head">
                  <h3>{t.roleHospitalTitle}</h3>
                  <span className="role-subhead-pill">Smart Hospital Station</span>
                </div>
                <div className="hud-accuracy-ring">
                  <svg viewBox="0 0 54 54" className="hud-ring-svg">
                    <circle cx="27" cy="27" r="22" stroke="#e2e8f0" strokeWidth="4" fill="none" />
                    <circle
                      cx="27"
                      cy="27"
                      r="22"
                      stroke="#10b981"
                      strokeWidth="4"
                      strokeDasharray="138"
                      strokeDashoffset="8"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                  <div className="hud-ring-text">
                    <strong>99.4%</strong>
                    <small>Segregation</small>
                  </div>
                </div>
              </div>

              {/* 3D Smart Station Canvas: Scale + CPCB Yellow Bin + Form VI Holographic Printer */}
              <div className="role-art-canvas-wrap hospital-wrap">
                <svg viewBox="0 0 340 180" className="role-vector-art" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="hospPlatter" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f8fafc" />
                      <stop offset="50%" stopColor="#e2e8f0" />
                      <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                    <linearGradient id="hospYellowBin" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="35%" stopColor="#facc15" />
                      <stop offset="85%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </linearGradient>
                    <linearGradient id="hospLidGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="70%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#a16207" />
                    </linearGradient>
                    <linearGradient id="hospPoleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#94a3b8" />
                      <stop offset="50%" stopColor="#e2e8f0" />
                      <stop offset="100%" stopColor="#64748b" />
                    </linearGradient>
                    <linearGradient id="hospHologram" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fb7185" />
                      <stop offset="25%" stopColor="#c084fc" />
                      <stop offset="50%" stopColor="#38bdf8" />
                      <stop offset="75%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                    <linearGradient id="hospPrinterBody" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="60%" stopColor="#f1f5f9" />
                      <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>
                    <filter id="hospShadow" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.12" />
                    </filter>
                  </defs>

                  {/* LEFT ZONE: 3D PRECISION DIGITAL SCALE */}
                  <g filter="url(#hospShadow)">
                    {/* Weighing Platter Ground Shadow */}
                    <ellipse cx="85" cy="144" rx="62" ry="14" fill="rgba(15,23,42,0.12)" />
                    {/* Metal Platter Base */}
                    <ellipse cx="85" cy="138" rx="60" ry="14" fill="url(#hospPlatter)" stroke="#94a3b8" strokeWidth="1.2" />
                    <ellipse cx="85" cy="135" rx="55" ry="11" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />

                    {/* Scale Tower Pole */}
                    <rect x="36" y="58" width="6" height="78" rx="3" fill="url(#hospPoleGrad)" />
                    <ellipse cx="39" cy="136" rx="6" ry="2.5" fill="#64748b" />

                    {/* LED Display Terminal */}
                    <rect x="18" y="24" width="66" height="34" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <rect x="22" y="28" width="58" height="26" rx="4" fill="#022c22" stroke="#065f46" strokeWidth="1" />
                    {/* Glowing LED Numbers */}
                    <text x="51" y="44" fill="#10b981" fontSize="13" fontWeight="900" fontFamily="monospace" textAnchor="middle" letterSpacing="1">016.0 KG</text>
                    <text x="51" y="51" fill="#34d399" fontSize="6.5" fontWeight="800" textAnchor="middle" letterSpacing="0.5">CPCB CALIBRATED</text>

                    {/* 3D Yellow Clinical Biohazard Bin */}
                    <ellipse cx="102" cy="132" rx="30" ry="8" fill="rgba(202,138,4,0.3)" />
                    {/* Bin Body */}
                    <path
                      d="M 76 82 L 82 130 Q 102 138 122 130 L 128 82 Z"
                      fill="url(#hospYellowBin)"
                      stroke="#ca8a04"
                      strokeWidth="1.2"
                    />
                    {/* Gloss Reflection */}
                    <path
                      d="M 80 84 L 84 126 Q 92 130 96 128 L 92 84 Z"
                      fill="rgba(255,255,255,0.4)"
                    />
                    {/* Bin Stepped Lid */}
                    <ellipse cx="102" cy="82" rx="28" ry="8" fill="url(#hospLidGrad)" stroke="#ca8a04" strokeWidth="1.2" />
                    <ellipse cx="102" cy="79" rx="23" ry="5.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                    {/* Handle */}
                    <rect x="94" y="73" width="16" height="4.5" rx="2" fill="#ca8a04" />

                    {/* Biohazard Symbol & Label on Bin */}
                    <circle cx="102" cy="107" r="12" fill="#ca8a04" opacity="0.15" />
                    <text x="102" y="112" fill="#713f12" fontSize="15" fontWeight="900" textAnchor="middle">☣</text>
                    <text x="102" y="122" fill="#854d0e" fontSize="6" fontWeight="900" textAnchor="middle" letterSpacing="0.5">BIO-HAZARD</text>

                    {/* Left Platter Footing Label */}
                    <rect x="42" y="156" width="86" height="15" rx="7.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="85" y="167" fill="#475569" fontSize="7.5" fontWeight="800" textAnchor="middle">SMART SCALE • 16.0 KG</text>
                  </g>

                  {/* RIGHT ZONE: 3D MEDICAL THERMAL PRINTER & FORM VI STICKER */}
                  <g filter="url(#hospShadow)">
                    {/* Printer Chassis */}
                    <rect x="186" y="48" width="134" height="98" rx="10" fill="url(#hospPrinterBody)" stroke="#cbd5e1" strokeWidth="1.2" />
                    <rect x="192" y="54" width="122" height="86" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />

                    {/* Status Top Bar */}
                    <circle cx="204" cy="65" r="3" fill="#10b981" />
                    <circle cx="204" cy="65" r="5" fill="none" stroke="#10b981" strokeWidth="0.8" opacity="0.5" />
                    <text x="214" y="68" fill="#475569" fontSize="7" fontWeight="800">THERMAL PRINTER</text>
                    <rect x="282" y="60" width="26" height="10" rx="5" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.8" />
                    <text x="295" y="67.5" fill="#059669" fontSize="5.5" fontWeight="800" textAnchor="middle">ONLINE</text>

                    {/* Dispenser Slot */}
                    <rect x="200" y="74" width="106" height="6" rx="3" fill="#0f172a" />

                    {/* Freshly Dispensed Form VI Sticker */}
                    <g transform="translate(208, 77)">
                      {/* Sticker Surface with drop shadow */}
                      <rect x="0" y="0" width="90" height="65" rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />

                      {/* Rainbow Hologram Foil Stamp */}
                      <rect x="6" y="5" width="28" height="9" rx="2.5" fill="url(#hospHologram)" />
                      <text x="20" y="12" fill="#ffffff" fontSize="5.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4">CPCB SEAL</text>

                      {/* Verification Badge */}
                      <rect x="46" y="5" width="38" height="9" rx="4.5" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.8" />
                      <text x="65" y="12" fill="#059669" fontSize="6" fontWeight="800" textAnchor="middle">VERIFIED ✓</text>

                      {/* Micro QR Code */}
                      <rect x="6" y="18" width="22" height="22" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.8" />
                      <rect x="8" y="20" width="6" height="6" fill="#0f172a" />
                      <rect x="20" y="20" width="6" height="6" fill="#0f172a" />
                      <rect x="8" y="32" width="6" height="6" fill="#0f172a" />
                      <rect x="16" y="28" width="4" height="4" fill="#0f172a" />

                      {/* Barcode Lines */}
                      <g transform="translate(34, 18)">
                        <rect x="0" y="0" width="2" height="18" fill="#0f172a" />
                        <rect x="3" y="0" width="1" height="18" fill="#0f172a" />
                        <rect x="5" y="0" width="3" height="18" fill="#0f172a" />
                        <rect x="9" y="0" width="1.5" height="18" fill="#0f172a" />
                        <rect x="12" y="0" width="2.5" height="18" fill="#0f172a" />
                        <rect x="16" y="0" width="1" height="18" fill="#0f172a" />
                        <rect x="18" y="0" width="3" height="18" fill="#0f172a" />
                        <rect x="23" y="0" width="2" height="18" fill="#0f172a" />
                        <rect x="27" y="0" width="1.5" height="18" fill="#0f172a" />
                        <rect x="30" y="0" width="3" height="18" fill="#0f172a" />
                        <rect x="35" y="0" width="1.5" height="18" fill="#0f172a" />
                        <rect x="38" y="0" width="3" height="18" fill="#0f172a" />
                        <rect x="43" y="0" width="2" height="18" fill="#0f172a" />
                        <rect x="47" y="0" width="3" height="18" fill="#0f172a" />
                      </g>

                      {/* Hospital Form VI Code */}
                      <text x="45" y="44" fill="#0f172a" fontSize="6.5" fontWeight="800" textAnchor="middle" letterSpacing="0.4">FORM VI • AIIMS-BBSR</text>
                      <text x="45" y="52" fill="#64748b" fontSize="5.5" fontWeight="700" textAnchor="middle" letterSpacing="0.2">YELLOW-CYTO • 16.0 KG</text>
                      <text x="45" y="60" fill="#059669" fontSize="6" fontWeight="900" textAnchor="middle">GPS BARCODE VALIDATED</text>
                    </g>

                    {/* Printer Base Label */}
                    <rect x="200" y="156" width="106" height="15" rx="7.5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="253" y="167" fill="#475569" fontSize="7.5" fontWeight="800" textAnchor="middle">FORM VI TAG DISPENSER</text>
                  </g>
                </svg>
              </div>

              <div className="role-card-footer">
                <button className="role-enter-btn hospital" onClick={onHospitalClick}>
                  <span>{t.roleHospitalAction}</span>
                  <span className="btn-arrow-icon">➔</span>
                </button>
              </div>
            </div>

            {/* 2. Collector Fleet Portal Card */}
            <div className="role-portal-card collector" onClick={onCollectorClick}>
              <div className="role-portal-top">
                <div className="role-title-head">
                  <h3>{t.roleCollectorTitle}</h3>
                  <span className="role-subhead-pill">GPS Fleet Logistics</span>
                </div>
                <div className="fleet-telemetry-pill">
                  <span className="telemetry-speed-ico">⚡</span>
                  <span>8 Active Fleets • ETA 14m</span>
                </div>
              </div>

              {/* 3D Logistics Canvas: Satellite Uplink + Perspective Road Grid + Electric Medical Van */}
              <div className="role-art-canvas-wrap collector-wrap">
                <svg viewBox="0 0 340 180" className="role-vector-art" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="collSkyBeam" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#0284c7" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="collSolarWing" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0369a1" />
                      <stop offset="50%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#075985" />
                    </linearGradient>
                    <linearGradient id="collRoadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f1f5f9" />
                      <stop offset="40%" stopColor="#e2e8f0" />
                      <stop offset="100%" stopColor="#cbd5e1" />
                    </linearGradient>
                    <linearGradient id="collVanCabin" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="60%" stopColor="#f8fafc" />
                      <stop offset="100%" stopColor="#e2e8f0" />
                    </linearGradient>
                    <linearGradient id="collWindshield" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0369a1" />
                    </linearGradient>
                    <filter id="collShadow" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.12" />
                    </filter>
                  </defs>

                  {/* SATELLITE UPLINK & BEAM */}
                  {/* Conical GPS Downlink Laser Beam */}
                  <polygon points="170,22 100,126 210,126" fill="url(#collSkyBeam)" />
                  <line x1="170" y1="22" x2="152" y2="120" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.9" />

                  {/* Orbiting Satellite Body */}
                  <g transform="translate(170, 20)" filter="url(#collShadow)">
                    {/* Left Solar Panel */}
                    <rect x="-48" y="-7" width="30" height="14" rx="2" fill="url(#collSolarWing)" stroke="#38bdf8" strokeWidth="0.8" />
                    <line x1="-38" y1="-7" x2="-38" y2="7" stroke="#38bdf8" strokeWidth="0.5" />
                    <line x1="-28" y1="-7" x2="-28" y2="7" stroke="#38bdf8" strokeWidth="0.5" />
                    <line x1="-48" y1="0" x2="-18" y2="0" stroke="#38bdf8" strokeWidth="0.5" />

                    {/* Central Satellite Chassis */}
                    <rect x="-14" y="-9" width="28" height="18" rx="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.2" />
                    <rect x="-10" y="-6" width="20" height="12" rx="2" fill="#f59e0b" />
                    <circle cx="0" cy="0" r="3" fill="#38bdf8" />

                    {/* Right Solar Panel */}
                    <rect x="18" y="-7" width="30" height="14" rx="2" fill="url(#collSolarWing)" stroke="#38bdf8" strokeWidth="0.8" />
                    <line x1="28" y1="-7" x2="28" y2="7" stroke="#38bdf8" strokeWidth="0.5" />
                    <line x1="38" y1="-7" x2="38" y2="7" stroke="#38bdf8" strokeWidth="0.5" />
                    <line x1="18" y1="0" x2="48" y2="0" stroke="#38bdf8" strokeWidth="0.5" />

                    {/* Downward Antenna Dish */}
                    <path d="M -6 9 Q 0 14 6 9 Z" fill="#64748b" stroke="#38bdf8" strokeWidth="0.8" />
                  </g>

                  {/* Satellite Pill Header */}
                  <rect x="88" y="2" width="164" height="14" rx="7" fill="#ffffff" stroke="#bae6fd" strokeWidth="1" filter="url(#collShadow)" />
                  <circle cx="98" cy="9" r="3" fill="#0284c7" />
                  <text x="172" y="12.5" fill="#0284c7" fontSize="7" fontWeight="800" textAnchor="middle" letterSpacing="0.4">GPS & NAVIC LIVE SATELLITE BEAM</text>

                  {/* 3D PERSPECTIVE ISOMETRIC ROAD NETWORK */}
                  <g>
                    {/* Highway Ground Polygon */}
                    <polygon points="15,160 115,70 225,70 325,160" fill="url(#collRoadGrad)" stroke="#cbd5e1" strokeWidth="1.2" />
                    {/* Perspective Highway Lane Markers */}
                    <line x1="170" y1="72" x2="170" y2="158" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="8,6" opacity="0.9" />
                    <line x1="140" y1="72" x2="90" y2="158" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="4,4" />
                    <line x1="200" y1="72" x2="250" y2="158" stroke="#e0f2fe" strokeWidth="1" strokeDasharray="4,4" />

                    {/* GPS Active Route Ribbon connecting Origin -> In-transit -> Destination */}
                    <path
                      d="M 45 142 Q 110 110 152 118 T 275 88"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Origin Facility Station A */}
                    <circle cx="45" cy="142" r="6" fill="#0284c7" />
                    <circle cx="45" cy="142" r="10" fill="none" stroke="#0284c7" strokeWidth="1" opacity="0.4" />
                    <circle cx="45" cy="142" r="2.5" fill="#ffffff" />
                    <rect x="18" y="148" width="54" height="12" rx="6" fill="#ffffff" stroke="#bae6fd" strokeWidth="0.8" />
                    <text x="45" y="156.5" fill="#0369a1" fontSize="6" fontWeight="800" textAnchor="middle">AIIMS (ORIGIN)</text>
                  </g>

                  {/* 3D ELECTRIC MEDICAL COLLECTION VAN (IN-TRANSIT) */}
                  <g transform="translate(108, 92)" filter="url(#collShadow)">
                    {/* Van Ground Shadow */}
                    <ellipse cx="44" cy="38" rx="42" ry="9" fill="rgba(15,23,42,0.22)" />

                    {/* Cargo Enclosure */}
                    <rect x="0" y="6" width="50" height="28" rx="4" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                    {/* CPCB Biohazard / Medical Recycling Logo */}
                    <circle cx="25" cy="20" r="9" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                    <text x="25" y="24" fill="#059669" fontSize="12" fontWeight="900" textAnchor="middle">♻</text>

                    {/* Driver Aerodynamic Cabin */}
                    <path
                      d="M 50 14 L 66 18 Q 72 23 74 34 L 50 34 Z"
                      fill="url(#collVanCabin)"
                      stroke="#0284c7"
                      strokeWidth="1.5"
                    />
                    {/* Windshield */}
                    <path
                      d="M 52 16 L 64 20 Q 68 24 69 28 L 52 28 Z"
                      fill="url(#collWindshield)"
                    />
                    {/* Cyan Speed Decal */}
                    <path d="M 0 28 L 72 28 L 70 31 L 0 31 Z" fill="#0ea5e9" />

                    {/* LED Headlight & Light Cone on Road */}
                    <circle cx="73" cy="30" r="2.5" fill="#fef08a" />
                    <polygon points="75,29 110,24 110,38 75,32" fill="rgba(254,240,138,0.25)" />

                    {/* Dual Wheels */}
                    <circle cx="16" cy="36" r="6.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
                    <circle cx="16" cy="36" r="2" fill="#e2e8f0" />
                    <circle cx="58" cy="36" r="6.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
                    <circle cx="58" cy="36" r="2" fill="#e2e8f0" />

                    {/* Telemetry Floating Pill above Van */}
                    <rect x="6" y="-8" width="76" height="12" rx="6" fill="#0f172a" opacity="0.9" />
                    <text x="44" y="0.5" fill="#38bdf8" fontSize="6.5" fontWeight="800" textAnchor="middle" letterSpacing="0.4">VAN #04 • 42 KM/H • 4°C</text>
                  </g>

                  {/* DESTINATION FACILITY: CBWTF SECTOR-4 */}
                  <g transform="translate(250, 68)" filter="url(#collShadow)">
                    {/* Facility Building 3D Isometric */}
                    <rect x="10" y="8" width="32" height="24" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="1.2" />
                    <polygon points="8,8 26,0 44,8" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
                    {/* Chimney Vents */}
                    <rect x="14" y="-3" width="4" height="6" fill="#64748b" />
                    <rect x="22" y="-5" width="4" height="8" fill="#64748b" />

                    {/* Red Destination Pin */}
                    <circle cx="26" cy="18" r="5" fill="#ef4444" />
                    <circle cx="26" cy="18" r="9" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.4" />
                    <circle cx="26" cy="18" r="2" fill="#ffffff" />

                    {/* Badge */}
                    <rect x="-10" y="34" width="72" height="13" rx="6.5" fill="#ffffff" stroke="#bae6fd" strokeWidth="1" />
                    <text x="26" y="43" fill="#0369a1" fontSize="6.5" fontWeight="800" textAnchor="middle">CBWTF PLANT (B)</text>
                  </g>

                  {/* Bottom Strip Label */}
                  <rect x="75" y="160" width="190" height="15" rx="7.5" fill="#ffffff" stroke="#bae6fd" strokeWidth="1" />
                  <text x="170" y="170.5" fill="#0369a1" fontSize="7.5" fontWeight="800" textAnchor="middle">GPS ROUTE TELEMETRY & GEO-FENCING ACTIVE</text>
                </svg>
              </div>

              <div className="role-card-footer">
                <button className="role-enter-btn collector" onClick={onCollectorClick}>
                  <span>{t.roleCollectorAction}</span>
                  <span className="btn-arrow-icon">➔</span>
                </button>
              </div>
            </div>

            {/* 3. Admin SPCB Portal Card */}
            <div className="role-portal-card admin" onClick={onAdminClick}>
              <div className="role-portal-top">
                <div className="role-title-head">
                  <h3>{t.roleAdminTitle}</h3>
                  <span className="role-subhead-pill">State Regulatory Console</span>
                </div>
                <span className="role-status-badge oversight">
                  <span className="live-pulse-dot" /> SPCB Oversight Active
                </span>
              </div>

              {/* 3D State Compliance Center: Minted Gold Regulatory Coin + MoEFCC Stamp + 3D Terrain Map */}
              <div className="role-art-canvas-wrap admin-wrap">
                <svg viewBox="0 0 340 180" className="role-vector-art" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <radialGradient id="adminCoinDisk" cx="40%" cy="40%" r="60%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="45%" stopColor="#facc15" />
                      <stop offset="85%" stopColor="#ca8a04" />
                      <stop offset="100%" stopColor="#854d0e" />
                    </radialGradient>
                    <linearGradient id="adminCoinRim" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef9c3" />
                      <stop offset="50%" stopColor="#d97706" />
                      <stop offset="100%" stopColor="#78350f" />
                    </linearGradient>
                    <linearGradient id="adminMapTop" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f5f3ff" />
                      <stop offset="50%" stopColor="#ede9fe" />
                      <stop offset="100%" stopColor="#ddd6fe" />
                    </linearGradient>
                    <linearGradient id="adminMapSide" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#5b21b6" />
                    </linearGradient>
                    <filter id="adminShadow" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.14" />
                    </filter>
                  </defs>

                  {/* TOP ROW: OFFICIAL REGULATORY CERTIFICATIONS */}
                  {/* Left: 3D Minted Gold Government Regulatory Seal Coin */}
                  <g transform="translate(85, 40)" filter="url(#adminShadow)">
                    {/* Coin Outer Reeded Rim */}
                    <circle cx="0" cy="0" r="30" fill="url(#adminCoinRim)" stroke="#78350f" strokeWidth="1.2" />
                    {/* Inner Gold Disc */}
                    <circle cx="0" cy="0" r="25" fill="url(#adminCoinDisk)" stroke="#fef08a" strokeWidth="1" />
                    <circle cx="0" cy="0" r="21" fill="none" stroke="#78350f" strokeWidth="0.8" strokeDasharray="2.5,1.5" />

                    {/* Government Capital Emblem (Pillars + Pediment) */}
                    <polygon points="-12,-8 12,-8 0,-16" fill="#78350f" />
                    <rect x="-14" y="-8" width="28" height="2" fill="#78350f" />
                    <rect x="-10" y="-6" width="3" height="12" fill="#78350f" />
                    <rect x="-4" y="-6" width="3" height="12" fill="#78350f" />
                    <rect x="2" y="-6" width="3" height="12" fill="#78350f" />
                    <rect x="8" y="-6" width="3" height="12" fill="#78350f" />
                    <rect x="-13" y="6" width="26" height="2.5" rx="0.5" fill="#78350f" />
                    <text x="0" y="15" fill="#78350f" fontSize="5.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4">GOVT OF INDIA</text>

                    {/* Seal Label Pill */}
                    <rect x="-48" y="32" width="96" height="13" rx="6.5" fill="#fefce8" stroke="#ca8a04" strokeWidth="0.8" />
                    <text x="0" y="41" fill="#854d0e" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.3">SPCB REGULATORY SEAL</text>
                  </g>

                  {/* Right: Official Circular MoEFCC & NGT Approved Compliance Stamp */}
                  <g transform="translate(252, 40) rotate(-4)" filter="url(#adminShadow)">
                    {/* Double Ring Certified Stamp */}
                    <circle cx="0" cy="0" r="30" fill="#ecfdf5" stroke="#059669" strokeWidth="1.5" strokeDasharray="4,2.5" />
                    <circle cx="0" cy="0" r="26" fill="none" stroke="#059669" strokeWidth="1" />

                    {/* Curved Stamp Headings */}
                    <text x="0" y="-16" fill="#047857" fontSize="5.5" fontWeight="900" textAnchor="middle" letterSpacing="0.4">MINISTRY OF ENVIRONMENT</text>
                    <text x="-20" y="-8" fill="#059669" fontSize="6">★</text>
                    <text x="16" y="-8" fill="#059669" fontSize="6">★</text>

                    {/* Green Approval Banner */}
                    <rect x="-24" y="-7" width="48" height="14" rx="3" fill="#059669" />
                    <text x="0" y="3" fill="#ffffff" fontSize="7.5" fontWeight="900" textAnchor="middle" letterSpacing="0.5">APPROVED</text>

                    {/* Sub-label */}
                    <text x="0" y="14" fill="#047857" fontSize="5.5" fontWeight="900" textAnchor="middle" letterSpacing="0.3">MoEFCC & NGT</text>
                    <text x="0" y="21" fill="#059669" fontSize="5" fontWeight="800" textAnchor="middle" letterSpacing="0.2">CPCB STATUTORY 2016</text>

                    {/* Stamp Label Pill */}
                    <rect x="-48" y="32" width="96" height="13" rx="6.5" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.8" />
                    <text x="0" y="41" fill="#047857" fontSize="6.5" fontWeight="900" textAnchor="middle" letterSpacing="0.3">MoEFCC & NGT CERTIFIED</text>
                  </g>

                  {/* BOTTOM: 3D RAISED STATE RELIEF TERRAIN MAP WITH COMPLIANCE PINS */}
                  <g filter="url(#adminShadow)">
                    {/* Ground Soft Shadow */}
                    <polygon points="45,130 115,102 215,98 295,116 312,138 260,160 145,166 48,150" fill="rgba(124,58,237,0.12)" />

                    {/* 3D Extrusion Side Wall (Depth) */}
                    <polygon
                      points="38,122 38,130 140,162 255,154 308,132 308,124 255,146 140,154"
                      fill="url(#adminMapSide)"
                    />

                    {/* 3D Top Relief Polygon Surface */}
                    <polygon
                      points="38,122 105,98 205,94 288,112 308,124 255,146 140,154 38,122"
                      fill="url(#adminMapTop)"
                      stroke="#c084fc"
                      strokeWidth="1.2"
                    />

                    {/* Administrative Regional Boundary Lines */}
                    <line x1="105" y1="98" x2="140" y2="154" stroke="#c084fc" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.7" />
                    <line x1="205" y1="94" x2="255" y2="146" stroke="#c084fc" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.7" />

                    {/* 5 LIVE HOSPITAL COMPLIANCE PINS */}
                    {/* Pin 1: AIIMS Bhubaneswar (Compliant Green) */}
                    <g transform="translate(85, 116)">
                      <circle cx="0" cy="0" r="4.5" fill="#10b981" />
                      <circle cx="0" cy="0" r="8" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                      <text x="0" y="2.5" fill="#ffffff" fontSize="6" fontWeight="900" textAnchor="middle">✓</text>
                    </g>

                    {/* Pin 2: Capital Hospital (Compliant Green) */}
                    <g transform="translate(135, 110)">
                      <circle cx="0" cy="0" r="4.5" fill="#10b981" />
                      <circle cx="0" cy="0" r="8" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                      <text x="0" y="2.5" fill="#ffffff" fontSize="6" fontWeight="900" textAnchor="middle">✓</text>
                    </g>

                    {/* Pin 3: SCB Medical Cuttack (Compliant Green) */}
                    <g transform="translate(188, 106)">
                      <circle cx="0" cy="0" r="4.5" fill="#10b981" />
                      <circle cx="0" cy="0" r="8" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                      <text x="0" y="2.5" fill="#ffffff" fontSize="6" fontWeight="900" textAnchor="middle">✓</text>
                    </g>

                    {/* Pin 4: Apollo Hospitals (Compliant Green) */}
                    <g transform="translate(255, 120)">
                      <circle cx="0" cy="0" r="4.5" fill="#10b981" />
                      <circle cx="0" cy="0" r="8" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.4" />
                      <text x="0" y="2.5" fill="#ffffff" fontSize="6" fontWeight="900" textAnchor="middle">✓</text>
                    </g>

                    {/* Pin 5: KIMS Medical (Amber Audit Required) */}
                    <g transform="translate(155, 134)">
                      <circle cx="0" cy="0" r="4.5" fill="#f59e0b" />
                      <circle cx="0" cy="0" r="8" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />
                      <text x="0" y="2.5" fill="#ffffff" fontSize="6" fontWeight="900" textAnchor="middle">!</text>
                    </g>

                    {/* Floating Central Compliance Rate Tooltip */}
                    <rect x="98" y="90" width="144" height="15" rx="7.5" fill="#0f172a" opacity="0.92" />
                    <circle cx="108" cy="97.5" r="3" fill="#10b981" />
                    <text x="174" y="101" fill="#ede9fe" fontSize="7" fontWeight="800" textAnchor="middle" letterSpacing="0.4">98.8% STATE COMPLIANCE (48 HCFs)</text>

                    {/* Bottom Strip Label */}
                    <rect x="75" y="160" width="190" height="15" rx="7.5" fill="#ffffff" stroke="#d8b4fe" strokeWidth="1" />
                    <text x="170" y="170.5" fill="#6d28d9" fontSize="7.5" fontWeight="800" textAnchor="middle">SPCB REAL-TIME ENVIRONMENTAL COMPLIANCE GRID</text>
                  </g>
                </svg>
              </div>

              <div className="role-card-footer">
                <button className="role-enter-btn admin" onClick={onAdminClick}>
                  <span>{t.roleAdminAction}</span>
                  <span className="btn-arrow-icon">➔</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. CPCB 4 COLOR STREAMS SHOWCASE BENTO ─── */}
        <section className="cpcb-streams-section" id="streams">
          <div className="section-head-center">
            <span className="section-tag-pill">STATUTORY CLASSIFICATION</span>
            <h2>{t.streamsTitle}</h2>
            <p>{t.streamsSub}</p>
          </div>

          <div className="streams-bento-grid">
            {CPCB_STREAMS.map(stream => {
              const colorClass = stream.id.toLowerCase();

              /* ── per-stream 3D SVG art ── */
              const artSVG = {
                YELLOW: (
                  <svg viewBox="0 0 200 130" className="stream-container-svg" fill="none">
                    <defs>
                      <linearGradient id="yBag" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fde047"/><stop offset="100%" stopColor="#ca8a04"/></linearGradient>
                      <linearGradient id="yLid" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fef08a"/><stop offset="100%" stopColor="#eab308"/></linearGradient>
                      <filter id="yShadow"><feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#ca8a04" floodOpacity="0.3"/></filter>
                    </defs>
                    {/* Ground shadow */}
                    <ellipse cx="100" cy="122" rx="58" ry="8" fill="rgba(234,179,8,0.18)"/>
                    {/* Bag body */}
                    <path d="M 55 38 Q 52 110 58 118 Q 100 130 142 118 Q 148 110 145 38 Z" fill="url(#yBag)" filter="url(#yShadow)"/>
                    {/* Gloss */}
                    <path d="M 62 42 Q 60 100 64 112 Q 74 118 80 115 L 75 42 Z" fill="rgba(255,255,255,0.35)"/>
                    {/* Lid/top fold */}
                    <path d="M 55 38 Q 100 20 145 38 Q 100 56 55 38 Z" fill="url(#yLid)"/>
                    {/* Tie */}
                    <ellipse cx="100" cy="22" rx="16" ry="5" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5"/>
                    <rect x="94" y="10" width="12" height="12" rx="4" fill="#ca8a04"/>
                    {/* Biohazard symbol */}
                    <circle cx="100" cy="82" r="18" fill="rgba(202,138,4,0.18)"/>
                    <text x="100" y="90" fill="#713f12" fontSize="22" fontWeight="900" textAnchor="middle">☣</text>
                    {/* Label strip */}
                    <rect x="65" y="56" width="70" height="14" rx="7" fill="#fef9c3" stroke="#eab308" strokeWidth="1"/>
                    <text x="100" y="66" fill="#713f12" fontSize="8" fontWeight="800" textAnchor="middle">INCINERATION</text>
                  </svg>
                ),
                RED: (
                  <svg viewBox="0 0 200 130" className="stream-container-svg" fill="none">
                    <defs>
                      <linearGradient id="rBag" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fca5a5"/><stop offset="100%" stopColor="#b91c1c"/></linearGradient>
                      <linearGradient id="rLid" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fecaca"/><stop offset="100%" stopColor="#ef4444"/></linearGradient>
                      <filter id="rShadow"><feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#b91c1c" floodOpacity="0.28"/></filter>
                    </defs>
                    <ellipse cx="100" cy="122" rx="58" ry="8" fill="rgba(239,68,68,0.15)"/>
                    <path d="M 55 38 Q 52 110 58 118 Q 100 130 142 118 Q 148 110 145 38 Z" fill="url(#rBag)" filter="url(#rShadow)"/>
                    <path d="M 62 42 Q 60 100 64 112 Q 74 118 80 115 L 75 42 Z" fill="rgba(255,255,255,0.3)"/>
                    <path d="M 55 38 Q 100 20 145 38 Q 100 56 55 38 Z" fill="url(#rLid)"/>
                    <ellipse cx="100" cy="22" rx="16" ry="5" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5"/>
                    <rect x="94" y="10" width="12" height="12" rx="4" fill="#b91c1c"/>
                    {/* Recycle arrows */}
                    <circle cx="100" cy="82" r="18" fill="rgba(185,28,28,0.12)"/>
                    <text x="100" y="90" fill="#7f1d1d" fontSize="22" fontWeight="900" textAnchor="middle">♻</text>
                    <rect x="62" y="56" width="76" height="14" rx="7" fill="#fee2e2" stroke="#ef4444" strokeWidth="1"/>
                    <text x="100" y="66" fill="#7f1d1d" fontSize="7" fontWeight="800" textAnchor="middle">AUTOCLAVE + RECYCLE</text>
                  </svg>
                ),
                WHITE: (
                  <svg viewBox="0 0 200 130" className="stream-container-svg" fill="none">
                    <defs>
                      <linearGradient id="wBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f1f5f9"/><stop offset="100%" stopColor="#94a3b8"/></linearGradient>
                      <linearGradient id="wLid" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff"/><stop offset="100%" stopColor="#cbd5e1"/></linearGradient>
                      <filter id="wShadow"><feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#64748b" floodOpacity="0.22"/></filter>
                    </defs>
                    {/* Container ground shadow */}
                    <ellipse cx="100" cy="122" rx="52" ry="7" fill="rgba(100,116,139,0.15)"/>
                    {/* Sharps container body */}
                    <rect x="52" y="40" width="96" height="78" rx="8" fill="url(#wBox)" filter="url(#wShadow)"/>
                    {/* Translucency effect */}
                    <rect x="56" y="44" width="36" height="70" rx="5" fill="rgba(255,255,255,0.55)"/>
                    {/* Lid */}
                    <rect x="48" y="30" width="104" height="18" rx="6" fill="url(#wLid)" stroke="#94a3b8" strokeWidth="1.2"/>
                    {/* Funnel opening */}
                    <ellipse cx="100" cy="30" rx="14" ry="5" fill="#64748b" opacity="0.4"/>
                    <ellipse cx="100" cy="30" rx="8" ry="3" fill="#334155" opacity="0.6"/>
                    {/* Needles/syringes inside */}
                    <line x1="80" y1="58" x2="80" y2="100" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="93" y1="52" x2="93" y2="106" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="107" y1="56" x2="107" y2="102" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
                    <line x1="120" y1="60" x2="120" y2="98" stroke="#64748b" strokeWidth="2" strokeLinecap="round"/>
                    {/* Warning label */}
                    <rect x="58" y="55" width="32" height="28" rx="3" fill="#fef3c7" stroke="#d97706" strokeWidth="1"/>
                    <text x="74" y="67" fill="#92400e" fontSize="14" fontWeight="900" textAnchor="middle">⚠</text>
                    <text x="74" y="78" fill="#92400e" fontSize="5.5" fontWeight="800" textAnchor="middle">SHARPS</text>
                    <rect x="58" y="106" width="84" height="10" rx="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8"/>
                    <text x="100" y="114" fill="#334155" fontSize="7" fontWeight="800" textAnchor="middle">PUNCTURE-PROOF PP</text>
                  </svg>
                ),
                BLUE: (
                  <svg viewBox="0 0 200 130" className="stream-container-svg" fill="none">
                    <defs>
                      <linearGradient id="bBox" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#dbeafe"/><stop offset="100%" stopColor="#1d4ed8"/></linearGradient>
                      <linearGradient id="bFace" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#eff6ff"/><stop offset="100%" stopColor="#93c5fd"/></linearGradient>
                      <filter id="bShadow"><feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#1d4ed8" floodOpacity="0.22"/></filter>
                    </defs>
                    {/* Ground */}
                    <ellipse cx="100" cy="122" rx="54" ry="7" fill="rgba(59,130,246,0.13)"/>
                    {/* Box isometric look */}
                    <path d="M 52 50 L 52 112 L 148 112 L 148 50 Z" fill="url(#bFace)" filter="url(#bShadow)" stroke="#93c5fd" strokeWidth="1.2"/>
                    {/* Side face */}
                    <path d="M 148 50 L 164 34 L 164 96 L 148 112 Z" fill="#bfdbfe" stroke="#93c5fd" strokeWidth="1"/>
                    {/* Top face */}
                    <path d="M 52 50 L 68 34 L 164 34 L 148 50 Z" fill="#dbeafe" stroke="#93c5fd" strokeWidth="1"/>
                    {/* Blue cross markings */}
                    <rect x="68" y="65" width="6" height="22" rx="3" fill="#1d4ed8" opacity="0.6"/>
                    <rect x="62" y="71" width="18" height="6" rx="3" fill="#1d4ed8" opacity="0.6"/>
                    {/* Vials inside */}
                    <rect x="90" y="68" width="10" height="36" rx="5" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5"/>
                    <rect x="105" y="64" width="10" height="40" rx="5" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5"/>
                    <rect x="120" y="70" width="10" height="34" rx="5" fill="#bfdbfe" stroke="#3b82f6" strokeWidth="1.5"/>
                    {/* Liquid in vials */}
                    <rect x="91" y="84" width="8" height="18" rx="4" fill="#3b82f6" opacity="0.6"/>
                    <rect x="106" y="78" width="8" height="24" rx="4" fill="#3b82f6" opacity="0.6"/>
                    <rect x="121" y="86" width="8" height="16" rx="4" fill="#3b82f6" opacity="0.6"/>
                    {/* Label */}
                    <rect x="56" y="92" width="28" height="16" rx="3" fill="#dbeafe" stroke="#3b82f6" strokeWidth="0.8"/>
                    <text x="70" y="100" fill="#1e3a8a" fontSize="5.5" fontWeight="800" textAnchor="middle">GLASS</text>
                    <text x="70" y="107" fill="#1e3a8a" fontSize="5" fontWeight="700" textAnchor="middle">RECYCLE</text>
                  </svg>
                ),
              }[stream.id];

              return (
                <div
                  key={stream.id}
                  className={`stream-bento-card ${colorClass}`}
                >
                  {/* Header: icon + stat */}
                  <div className="stream-card-header">
                    <div className="stream-icon-wrap">{stream.symbol}</div>
                    <span className="stream-stat-pill">{stream.statBadge}</span>
                  </div>

                  {/* Title + treatment badge */}
                  <div className="stream-title-block">
                    <h3>{stream.id} CATEGORY</h3>
                    <span className="stream-badge-pill">{stream.badge}</span>
                  </div>

                  {/* 3D container art */}
                  <div className="stream-art-zone">{artSVG}</div>

                  {/* Data rows */}
                  <div className="stream-card-content">
                    <div className="stream-prop">
                      <label>CPCB Mandated Treatment</label>
                      <p>{stream.treatment}</p>
                    </div>
                    <div className="stream-prop">
                      <label>Designated Container</label>
                      <p>{stream.container}</p>
                    </div>
                    <div className="stream-prop">
                      <label>Clinical Waste Items</label>
                      <p>{stream.items}</p>
                    </div>
                  </div>

                  {/* AI Action Button */}
                  {onOpenAiAssistant && (
                    <div className="stream-card-footer">
                      <button
                        type="button"
                        className="stream-ai-action-btn"
                        onClick={onOpenAiAssistant}
                      >
                        <span className="stream-ai-sparkle">✨</span>
                        Audit {stream.id} Waste in AI
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>


        {/* ─── HOW IT WORKS PIPELINE ─── */}
        <section className="how-section" id="features">
          <div className="section-head-center">
            <span className="section-tag-pill">END-TO-END PIPELINE</span>
            <h2>{t.howTitle}</h2>
            <p>{t.howSub}</p>
          </div>

          <div className="workflow-steps-grid">
            <div className="workflow-step-card">
              <div className="workflow-step-header">
                <span className="workflow-num">01</span>
                <span className="workflow-ico">🏥</span>
              </div>
              <h4>{t.step1Title}</h4>
              <p>{t.step1Text}</p>
            </div>

            <div className="workflow-arrow-connector">➔</div>

            <div className="workflow-step-card">
              <div className="workflow-step-header">
                <span className="workflow-num">02</span>
                <span className="workflow-ico">🏷️</span>
              </div>
              <h4>{t.step2Title}</h4>
              <p>{t.step2Text}</p>
            </div>

            <div className="workflow-arrow-connector">➔</div>

            <div className="workflow-step-card">
              <div className="workflow-step-header">
                <span className="workflow-num">03</span>
                <span className="workflow-ico">🚛</span>
              </div>
              <h4>{t.step3Title}</h4>
              <p>{t.step3Text}</p>
            </div>

            <div className="workflow-arrow-connector">➔</div>

            <div className="workflow-step-card">
              <div className="workflow-step-header">
                <span className="workflow-num">04</span>
                <span className="workflow-ico">♻️</span>
              </div>
              <h4>{t.step4Title}</h4>
              <p>{t.step4Text}</p>
            </div>
          </div>
        </section>

        {/* ─── NATIONAL STATUTORY TRUST STRIP ─── */}
        <section className="trust-strip-section" id="about">
          <div className="trust-inner-wrap">
            <div className="trust-headline-row">
              <span className="trust-flag">🇮🇳</span>
              <strong>{t.trustTitle}</strong>
            </div>
            <div className="trust-badges-row">
              <div className="trust-badge-pill">
                <span>📜</span> CPCB BMW Rules 2016
              </div>
              <div className="trust-badge-pill">
                <span>🛡️</span> MoEFCC Certified
              </div>
              <div className="trust-badge-pill">
                <span>⚖️</span> National Green Tribunal (NGT) Compliant
              </div>
              <div className="trust-badge-pill">
                <span>💡</span> Smart India Hackathon Innovation
              </div>
              <div className="trust-badge-pill">
                <span>📍</span> State PCB Verifiable QR
              </div>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer id="contact" className="landing-footer">
          <div className="footer-top-row">
            <div className="footer-brand-col">
              <div className="brand">
                <div className="brand-logo">✚</div>
                <div>
                  <h2>MediSort</h2>
                  <span>Smart Medical Waste Management Platform</span>
                </div>
              </div>
              <p className="footer-desc">
                Engineering transparent, digitally verifiable, and zero-landfill biomedical waste workflows across Indian healthcare facilities.
              </p>
            </div>

            <div className="footer-nav-col">
              <strong>Quick Navigation</strong>
              <a href="#home">Home</a>
              <a href="#stats">Live Compliance Stats</a>
              <a href="#streams">CPCB 4-Color Streams</a>
              <a href="#roles">Portals</a>
              <a href="#features">Workflow Pipeline</a>
            </div>

            <div className="footer-nav-col">
              <strong>Statutory Compliance</strong>
              <span>CPCB Form VI Verification</span>
              <span>OSPCB Authorization Portal</span>
              <span>Barcoded GPS Transit</span>
              <span>Bio-Medical Waste 2016 Rules</span>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <span>{t.footerText}</span>
            <span>OSPCB/BMW-REG/2026 • ISO 14001:2015 Compliant</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default FrontPage;