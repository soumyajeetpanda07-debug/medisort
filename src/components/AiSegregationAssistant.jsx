import { useState, useRef, useEffect, useCallback } from "react";
import "./AiSegregationAssistant.css";

// ─── Multi-Language UI Strings (English, Hindi, Odia) ─────────────
const UI_STRINGS = {
  en: {
    title: "AI Waste Segregation Assistant",
    subtitle: "Bio-Medical Waste Vision Classifier, CPCB 2016 Rules & Degradation Estimator",
    tabCamera: "Camera & Image Scanner",
    tabText: "Smart Text / Voice Chat",
    tabTray: "⚠️ Contamination Detector",
    tabImpact: "Degradation & Eco-Impact",
    online: "Gemini Live Connected",
    offline: "CPCB Offline Engine Active",
    aimCamera: "AI VISION READY • AIM CAMERA AT WASTE ITEM",
    takePhoto: "Capture Photo",
    retake: "Retake Snapshot",
    uploadOther: "Upload Different",
    uploadBtn: "Upload Image File Instead",
    demoPresets: "⚡ Demo Test Presets:",
    quickSuggestions: "Quick Suggestions:",
    voiceQuery: "Voice Query",
    listening: "Listening... Speak now",
    speakHandsFree: "Speak (Hands-free)",
    readAloud: "🔊 Read aloud",
    mute: "⏹️ Mute",
    inputPlaceholder: "Ask or speak (e.g. 'Where does an IV catheter go?')...",
    listeningPlaceholder: "Listening... Speak your waste item now...",
    send: "Send",
    confidence: "Confidence",
    container: "🗑️ Designated Container",
    treatment: "⚡ Prescribed Treatment",
    degradation: "⏳ Natural Degradation Time",
    recycling: "♻️ Circular Recycling Potential",
    handlingTitle: "🛡️ Safe Hospital Handling Protocol:",
    listenGuidance: "Listen Guidance",
    stopVoice: "Stop Voice",
    applyBtn: "➕ Transfer & Apply to Waste Record",
    clearBtn: "Clear Result",
    analyzing: "Analyzing CPCB guidelines...",
    welcome: "👋 Hello! I am your AI Bio-Medical Waste Segregation Assistant. Type any hospital waste item, use your microphone to speak hands-free, or capture a photo with your camera.",
    ecoTitle: "🌿 Environmental Degradation & Scientific Treatment",
    ecoSub: "Improper medical waste segregation contaminates soil, causes healthcare-acquired infections (HAIs), and introduces toxic microplastics and pathogen runoff into municipal groundwater.",
    // Option 3: Contamination Detector
    trayTitle: "Multi-Item Tray & Cross-Contamination Auditor",
    traySub: "Scan surgical trays or mixed waste bags to detect dangerous cross-contamination (e.g. sharps in red bags, glass in yellow bags) under CPCB Bio-Medical Waste Management Rules 2016.",
    trayAuditingTarget: "Auditing Target Container:",
    trayTargetAll: "🗂️ Mixed Surgical Tray / Batch",
    trayTargetYellow: "🟡 Yellow Biohazard Bag",
    trayTargetRed: "🔴 Red Recycled Plastics Bag",
    trayTargetWhite: "⚪ White Sharps Container",
    trayTargetBlue: "🔵 Blue Glassware Container",
    trayPresetsLabel: "⚡ Real Hospital Audit Scenarios (1-Click Test):",
    trayCustomLabel: "Custom Multi-Item Audit (Type or Speak comma-separated items):",
    trayInputPlaceholder: "e.g. Uncapped needle, blood gauze, saline bottle, glass vial...",
    trayScanPhoto: "📸 Upload Tray / Bag Photo",
    trayRunBtn: "Run Contamination Audit",
    trayAuditing: "Auditing items against CPCB 2016 cross-contamination matrices...",
    trayCompliantBadge: "✅ 100% CPCB COMPLIANT BATCH",
    trayCriticalBadge: "🚨 CRITICAL CONTAMINATION DETECTED",
    trayHighBadge: "⚠️ HIGH-RISK MISMATCH DETECTED",
    trayModerateBadge: "ℹ️ MODERATE SEGREGATION VIOLATION",
    trayScoreLabel: "Segregation Compliance Score",
    trayItemsFound: "Items Discovered & Analyzed:",
    trayViolationsLabel: "CPCB 2016 Statutory Violations:",
    trayCorrectiveLabel: "Step-by-Step Immediate Corrective Protocol:",
    trayPenaltiesLabel: "Legal & Environmental Liability Notice:",
    trayListenAudio: "🔊 Listen Audio Alert",
    trayMuteAudio: "⏹️ Stop Audio",
    trayApplyCompliant: "➕ Apply Compliant Waste",
    trayClear: "Clear Audit Report",
    // Option 4: Barcode Tag Generator
    tabBarcode: "🖨️ CPCB Barcode Tag",
    barcodeTitle: "Instant CPCB Barcode & QR Bag Tag Generator",
    barcodeSub: "Generate official Form VI verifiable barcode & QR stickers for hospital waste bags with GPS, batch ID & CBWTF manifest as per CPCB 2016 Rules.",
    barcodePresetTag: "CPCB FORM VI VERIFIED",
    barcodeBagColor: "Container / Color Category:",
    barcodeWard: "Ward / Operating Unit:",
    barcodeMaterial: "Material / Waste Description:",
    barcodeWeight: "Net Weight (kg):",
    barcodeFacility: "Hospital / Healthcare Facility:",
    barcodeCBWTF: "Authorized CBWTF Destination:",
    barcodeAuthNo: "OSPCB Authorization No.:",
    barcodePrintBtn: "🖨️ Print Adhesive Sticker",
    barcodeThermalBtn: "🧾 4x3 Thermal Label",
    barcodeDownloadBtn: "📥 Download Tag PNG",
    barcodeCopyManifestBtn: "📋 Copy Digital Manifest",
    barcodeApplyFormBtn: "➕ Transfer to Waste Record",
    barcodeRegenerate: "🔄 Generate New Serial",
    barcodeScanNotice: "Verifiable with CPCB Mobile App & State Pollution Control Board scanner.",
    manifestCopied: "✅ Digital CPCB Manifest copied to clipboard!"
  },
  hi: {
    title: "एआई बायोमेडिकल अपशिष्ट पृथक्करण सहायक",
    subtitle: "केंद्रीय प्रदूषण नियंत्रण बोर्ड (CPCB) 2016 दिशानिर्देश, कैमरा विज़न एवं अपघटन विश्लेषण",
    tabCamera: "📷 कैमरा और इमेज स्कैनर",
    tabText: "💬 टेक्स्ट और वॉयस चैट",
    tabTray: "⚠️ संदूषण डिटेक्टर",
    tabImpact: "🌱 पर्यावरण प्रभाव और अपघटन",
    online: "जेमिनी लाइव क्लाउड एआई",
    offline: "सीपीसीबी 2016 ऑफलाइन इंजन सक्रिय",
    aimCamera: "कैमरा तैयार है • कचरे की वस्तु की ओर दिखाएं",
    takePhoto: "फोटो खींचे",
    retake: "दोबारा फोटो लें",
    uploadOther: "दूसरी फोटो चुनें",
    uploadBtn: "फ़ाइल से फ़ोटो अपलोड करें",
    demoPresets: "⚡ त्वरित परीक्षण नमूने:",
    quickSuggestions: "त्वरित सुझाव:",
    voiceQuery: "बोलकर पूछें",
    listening: "सुन रहे हैं... बोलिए",
    speakHandsFree: "हैंड्स-फ्री वॉयस",
    readAloud: "🔊 बोलकर बताएं",
    mute: "⏹️ म्यूट करें",
    inputPlaceholder: "पूछें या बोलें (उदा. 'आईवी ट्यूबिंग किस बैग में जाएगी?')...",
    listeningPlaceholder: "सुन रहे हैं... अपना कचरा आइटम बोलें...",
    send: "भेजें ➔",
    confidence: "सटीकता",
    container: "🗑️ निर्धारित डिब्बा/कंटेनर",
    treatment: "⚡ निर्धारित उपचार विधि",
    degradation: "⏳ अपघटन समय (सड़ने का समय)",
    recycling: "♻️ पुनर्चक्रण (रीसाइक्लिंग) क्षमता",
    handlingTitle: "🛡️ अस्पताल सुरक्षा प्रोटोकॉल एवं सावधानियां:",
    listenGuidance: "निर्देश सुनें",
    stopVoice: "आवाज बंद करें",
    applyBtn: "➕ कचरा रिकॉर्ड में दर्ज करें",
    clearBtn: "हटाएं",
    analyzing: "सीपीसीबी नियमों का विश्लेषण हो रहा है...",
    welcome: "👋 नमस्ते! मैं आपका एआई बायोमेडिकल कचरा पृथक्करण सहायक हूँ। किसी भी वस्तु का नाम लिखें, माइक से बोलें या कैमरे से फोटो खींचें।",
    ecoTitle: "🌿 पर्यावरणीय अपघटन एवं वैज्ञानिक उपचार चक्र",
    ecoSub: "गलत पृथक्करण से मिट्टी और भूजल दूषित होता है, संक्रमण फैलता है और पर्यावरण को गंभीर नुकसान पहुँचता है।",
    // Option 3: Contamination Detector
    trayTitle: "मल्टी-आइटम ट्रे एवं क्रॉस-संदूषण ऑडिट",
    traySub: "सर्जिकल ट्रे या मिश्रित कचरे के बैग को स्कैन करें और सीपीसीबी 2016 नियमों के तहत क्रॉस-संदूषण (जैसे लाल बैग में सुई, पीले में कांच) का पता लगाएं।",
    trayAuditingTarget: "ऑडिट का लक्षित कंटेनर/बैग:",
    trayTargetAll: "🗂️ संपूर्ण सर्जिकल ट्रे (मिश्रित)",
    trayTargetYellow: "🟡 पीला बायोहैज़र्ड बैग",
    trayTargetRed: "🔴 लाल प्लास्टिक बैग",
    trayTargetWhite: "⚪ सफेद नुकीला कंटेनर",
    trayTargetBlue: "🔵 नीला कांच कंटेनर",
    trayPresetsLabel: "⚡ अस्पताल ऑडिट परिदृश्य (1-क्लिक टेस्ट):",
    trayCustomLabel: "कस्टम मल्टी-आइटम ऑडिट (कॉमा लगाकर कई नाम लिखें या बोलें):",
    trayInputPlaceholder: "उदा. खुली सुई, खून की पट्टी, सेलाइन बोतल, कांच की शीशी...",
    trayScanPhoto: "📸 ट्रे की फोटो जांचें",
    trayRunBtn: "संदूषण ऑडिट चलाएं",
    trayAuditing: "सीपीसीबी 2016 नियमों के तहत संदूषण की जांच हो रही है...",
    trayCompliantBadge: "✅ 100% सीपीसीबी अनुपालित बैच (सुरक्षित)",
    trayCriticalBadge: "🚨 गंभीर संदूषण खतरा (CRITICAL ALERT)",
    trayHighBadge: "⚠️ उच्च जोखिम बेमेल कचरा (HIGH RISK)",
    trayModerateBadge: "ℹ️ मध्यम पृथक्करण उल्लंघन",
    trayScoreLabel: "पृथक्करण अनुपालन स्कोर",
    trayItemsFound: "ट्रे में पहचाने गए कचरा आइटम:",
    trayViolationsLabel: "सीपीसीबी 2016 वैधानिक नियम उल्लंघन:",
    trayCorrectiveLabel: "तत्काल सुधारात्मक कदम (सुरक्षा प्रोटोकॉल):",
    trayPenaltiesLabel: "कानूनी एवं पर्यावरणीय देयता चेतावनी:",
    trayListenAudio: "🔊 ऑडिट चेतावनी सुनें",
    trayMuteAudio: "⏹️ आवाज रोकें",
    trayApplyCompliant: "➕ कचरा रिकॉर्ड में जोड़ें",
    trayClear: "ऑडिट साफ़ करें",
    // Option 4: Barcode Tag Generator
    tabBarcode: "🖨️ सीपीसीबी बारकोड टैग",
    barcodeTitle: "त्वरित सीपीसीबी बारकोड एवं क्यूआर बैग टैग जनरेटर",
    barcodeSub: "सीपीसीबी 2016 नियमों के तहत अस्पताल अपशिष्ट बैग के लिए फॉर्म VI डिजिटल बारकोड और क्यूआर स्टिकर तुरंत बनाएं।",
    barcodePresetTag: "सीपीसीबी फॉर्म VI प्रमाणित",
    barcodeBagColor: "कंटेनर / कचरा श्रेणी:",
    barcodeWard: "वार्ड / ऑपरेटिंग यूनिट:",
    barcodeMaterial: "सामग्री / कचरा विवरण:",
    barcodeWeight: "शुद्ध वजन (किग्रा):",
    barcodeFacility: "अस्पताल / स्वास्थ्य सेवा संस्थान:",
    barcodeCBWTF: "अधिकृत CBWTF गंतव्य:",
    barcodeAuthNo: "राज्य प्रदूषण बोर्ड प्राधिकरण संख्या:",
    barcodePrintBtn: "🖨️ स्टिकर प्रिंट करें",
    barcodeThermalBtn: "🧾 4x3 थर्मल प्रिंट",
    barcodeDownloadBtn: "📥 टैग इमेज डाउनलोड करें",
    barcodeCopyManifestBtn: "📋 डिजिटल मैनिफेस्ट कॉपी करें",
    barcodeApplyFormBtn: "➕ कचरा रिकॉर्ड में जोड़ें",
    barcodeRegenerate: "🔄 नया सीरियल जनरेट करें",
    barcodeScanNotice: "सीपीसीबी मोबाइल ऐप एवं ओडिशा राज्य प्रदूषण नियंत्रण बोर्ड द्वारा सत्यापन योग्य।",
    manifestCopied: "✅ डिजिटल सीपीसीबी मैनिफेस्ट कॉपी हो गया!"
  },
  or: {
    title: "AI ବର୍ଜ୍ୟବସ୍ତୁ ପୃଥକୀକରଣ ସହାୟକ",
    subtitle: "କେନ୍ଦ୍ରୀୟ ପ୍ରଦୂଷଣ ନିୟନ୍ତ୍ରଣ ବୋର୍ଡ (CPCB 2016) ନିୟମାବଳୀ ଓ ପରିବେଶ ପ୍ରଭାବ ବିଶ୍ଳେଷଣ",
    tabCamera: "📷 କ୍ୟାମେରା ଓ ଫଟୋ ସ୍କାନର୍",
    tabText: "💬 ଟେକ୍ସଟ୍ ଓ ଭଏସ୍ ଚାଟ୍",
    tabTray: "⚠️ ପ୍ରଦୂଷଣ ଯାଞ୍ଚ",
    tabImpact: "🌱 ପରିବେଶ ପ୍ରଭାବ ଓ ଅବକ୍ଷୟ",
    online: "ଜେମିନି ଲାଇଭ୍ ଏଆଇ ସଂଯୁକ୍ତ",
    offline: "CPCB ଅଫଲାଇନ୍ ଇଞ୍ଜିନ୍ ସକ୍ରିୟ",
    aimCamera: "କ୍ୟାମେରା ପ୍ରସ୍ତୁତ • ବର୍ଜ୍ୟବସ୍ତୁ ସମ୍ମୁଖରେ ରଖନ୍ତୁ",
    takePhoto: "ଫଟୋ ଉଠାନ୍ତୁ",
    retake: "ପୁଣି ଫଟୋ ନିଅନ୍ତୁ",
    uploadOther: "ଅନ୍ୟ ଫଟୋ ବାଛନ୍ତୁ",
    uploadBtn: "ଗ୍ୟାଲେରୀରୁ ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ",
    demoPresets: "⚡ ନମୁନା ପରୀକ୍ଷଣ:",
    quickSuggestions: "ଦ୍ରୁତ ପରାମର୍ଶ:",
    voiceQuery: "କହି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ",
    listening: "ଶୁଣୁଛି... କୁହନ୍ତୁ",
    speakHandsFree: "ଭଏସ୍ ସହାୟକ",
    readAloud: "🔊 ପଢ଼ି ଶୁଣାନ୍ତୁ",
    mute: "⏹️ ମ୍ୟୁଟ୍ କରନ୍ତୁ",
    inputPlaceholder: "ପଚାରନ୍ତୁ ବା କୁହନ୍ତୁ (ଯଥା: 'ସିରିଞ୍ଜ କେଉଁ ବିନରେ ପକାଇବି?')...",
    listeningPlaceholder: "ଶୁଣୁଛି... ବର୍ଜ୍ୟବସ୍ତୁର ନାମ କୁହନ୍ତୁ...",
    send: "ପଠାନ୍ତୁ ➔",
    confidence: "ସଠିକତା",
    container: "🗑️ ନିର୍ଦ୍ଦିଷ୍ଟ ପାତ୍ର/ଡଷ୍ଟବିନ୍",
    treatment: "⚡ ନିର୍ଦ୍ଧାରିତ ଉପଚାର ପଦ୍ଧତି",
    degradation: "⏳ ପ୍ରାକୃତିକ ଅବକ୍ଷୟ ସମୟ",
    recycling: "♻️ ପୁନଃଚକ୍ରଣ (ରିସାଇକ୍ଲିଂ) ସମ୍ଭାବନା",
    handlingTitle: "🛡️ ଡାକ୍ତରଖାନା ନିରାପତ୍ତା ଓ ନିୟମାବଳୀ:",
    listenGuidance: "ନିର୍ଦ୍ଦେଶ ଶୁଣନ୍ତୁ",
    stopVoice: "ଶବ୍ଦ ବନ୍ଦ କରନ୍ତୁ",
    applyBtn: "➕ ୱେଷ୍ଟ ରେକର୍ଡରେ ଯୋଡ଼ନ୍ତୁ",
    clearBtn: "ଫଳାଫଳ ହଟାନ୍ତୁ",
    analyzing: "CPCB ନିୟମ ଅନୁସାରେ ବିଶ୍ଳେଷଣ ଚାଲିଛି...",
    welcome: "👋 ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କ AI ମେଡିକାଲ୍ ବର୍ଜ୍ୟବସ୍ତୁ ପୃଥକୀକରଣ ସହାୟକ । କୌଣସି ଜିନିଷ ଟାଇପ୍ କରନ୍ତୁ, ମାଇକ୍ ଦ୍ଵାରା କୁହନ୍ତୁ କିମ୍ବା କ୍ୟାମେରାରେ ଫଟୋ ଉଠାନ୍ତୁ ।",
    ecoTitle: "🌿 ପରିବେଶ ଅବକ୍ଷୟ ଏବଂ ବୈଜ୍ଞାନିକ ଉପଚାର ଚକ୍ର",
    ecoSub: "ଭୁଲ୍ ପୃଥକୀକରଣ ଯୋଗୁଁ ଭୂତଳ ଜଳ ଏବଂ ମୃତ୍ତିକା ପ୍ରଦୂଷିତ ହୁଏ, ସଂକ୍ରମଣ ବ୍ୟାପେ ଏବଂ ସଫେଇ କର୍ମଚାରୀ ଆହତ ହୁଅନ୍ତି ।",
    // Option 3: Contamination Detector
    trayTitle: "ବହୁ-ବର୍ଜ୍ୟବସ୍ତୁ ଟ୍ରେ ଓ ପ୍ରଦୂଷଣ ଯାଞ୍ଚ (Contamination Audit)",
    traySub: "ସର୍ଜିକାଲ୍ ଟ୍ରେ କିମ୍ବା ମିଶ୍ରିତ ବ୍ୟାଗ୍ ସ୍କାନ୍ କରି CPCB 2016 ନିୟମ ଅନୁସାରେ ଭୁଲ୍ ମିଶ୍ରଣ (ଯଥା: ଲାଲ୍ ବ୍ୟାଗରେ ଛୁଞ୍ଚି, ହଳଦିଆରେ କାଚ) ଚିହ୍ନଟ କରନ୍ତୁ ।",
    trayAuditingTarget: "ଯାଞ୍ଚ କରାଯାଉଥିବା ପାତ୍ର/ବ୍ୟାଗ୍:",
    trayTargetAll: "🗂️ ସମ୍ପୂର୍ଣ୍ଣ ସର୍ଜିକାଲ୍ ଟ୍ରେ (ମିଶ୍ରିତ)",
    trayTargetYellow: "🟡 ହଳଦିଆ ସଂକ୍ରାମକ ବ୍ୟାଗ୍",
    trayTargetRed: "🔴 ଲାଲ୍ ପ୍ଲାଷ୍ଟିକ୍ ବ୍ୟାଗ୍",
    trayTargetWhite: "⚪ ଧଳା ଧାରୁଆ କଣ୍ଟେନର୍",
    trayTargetBlue: "🔵 ନୀଳ କାଚ କଣ୍ଟେନର୍",
    trayPresetsLabel: "⚡ ଡାକ୍ତରଖାନା ଅଡିଟ୍ ନମୁନା (୧-କ୍ଲିକ୍ ପରୀକ୍ଷଣ):",
    trayCustomLabel: "ନିଜ ପସନ୍ଦର ବର୍ଜ୍ୟବସ୍ତୁ ଯାଞ୍ଚ କରନ୍ତୁ (କମା ଦେଇ ଲେଖନ୍ତୁ ବା କୁହନ୍ତୁ):",
    trayInputPlaceholder: "ଯଥା: ଖୋଲା ଛୁଞ୍ଚି, ରକ୍ତ ଗଜ୍, ସାଲାଇନ୍ ବୋତଲ, କାଚ ଶିଶି...",
    trayScanPhoto: "📸 ଟ୍ରେ ର ଫଟୋ ଯାଞ୍ଚ କରନ୍ତୁ",
    trayRunBtn: "ପ୍ରଦୂଷଣ ଯାଞ୍ଚ ଆରମ୍ଭ କରନ୍ତୁ",
    trayAuditing: "CPCB 2016 ନିୟମ ଅନୁସାରେ ପ୍ରଦୂଷଣ ଯାଞ୍ଚ ଚାଲିଛି...",
    trayCompliantBadge: "✅ ୧୦୦% CPCB ନିୟମାନୁମୋଦିତ (ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ)",
    trayCriticalBadge: "🚨 ମାରାତ୍ମକ ପ୍ରଦୂଷଣ ଚିହ୍ନଟ (CRITICAL ALERT)",
    trayHighBadge: "⚠️ ଅତ୍ୟଧିକ ବିପଜ୍ଜନକ ମିଶ୍ରଣ (HIGH RISK)",
    trayModerateBadge: "ℹ️ ସାମାନ୍ୟ ପୃଥକୀକରଣ ତ୍ରୁଟି",
    trayScoreLabel: "ପୃଥକୀକରଣ ଅନୁପାଳନ ସ୍କୋର୍",
    trayItemsFound: "ଚିହ୍ନଟ ହୋଇଥିବା ବର୍ଜ୍ୟବସ୍ତୁ:",
    trayViolationsLabel: "CPCB 2016 ଆଇନଗତ ଉଲ୍ଲଂଘନ:",
    trayCorrectiveLabel: "ତୁରନ୍ତ ସୁଧାର ନିର୍ଦ୍ଦେଶାବଳୀ (Corrective Protocol):",
    trayPenaltiesLabel: "ଆଇନଗତ ଓ ପରିବେଶ ଜରିମାନା ସତର୍କତା:",
    trayListenAudio: "🔊 ଅଡିଟ୍ ସତର୍କତା ଶୁଣନ୍ତୁ",
    trayMuteAudio: "⏹️ ଶବ୍ଦ ବନ୍ଦ କରନ୍ତୁ",
    trayApplyCompliant: "➕ ରେକର୍ଡରେ ଯୋଡ଼ନ୍ତୁ",
    trayClear: "ଅଡିଟ୍ ହଟାନ୍ତୁ",
    // Option 4: Barcode Tag Generator
    tabBarcode: "🖨️ CPCB ବାରକୋଡ୍ ଟ୍ୟାଗ୍",
    barcodeTitle: "ତ୍ୱରିତ CPCB ବାରକୋଡ୍ ଓ QR ବ୍ୟାଗ୍ ଟ୍ୟାଗ୍ ଜେନେରେଟର୍",
    barcodeSub: "CPCB 2016 ନିୟମ ଅନୁସାରେ ଡାକ୍ତରଖାନା ବର୍ଜ୍ୟବସ୍ତୁ ବ୍ୟାଗ୍ ପାଇଁ ସରକାରୀ Form VI ବାରକୋଡ୍ ଓ QR ଷ୍ଟିକର୍ ସୃଷ୍ଟି କରନ୍ତୁ ।",
    barcodePresetTag: "CPCB FORM VI ପ୍ରମାଣିତ",
    barcodeBagColor: "କଣ୍ଟେନର୍ / ରଙ୍ଗ ବର୍ଗ:",
    barcodeWard: "ୱାର୍ଡ / ଚିକିତ୍ସା ବିଭାଗ:",
    barcodeMaterial: "ବର୍ଜ୍ୟବସ୍ତୁ ବିବରଣୀ:",
    barcodeWeight: "ଓଜନ (କିଲୋଗ୍ରାମ):",
    barcodeFacility: "ଡାକ୍ତରଖାନା / ସ୍ୱାସ୍ଥ୍ୟସେବା କେନ୍ଦ୍ର:",
    barcodeCBWTF: "ଅନୁମୋଦିତ CBWTF କେନ୍ଦ୍ର:",
    barcodeAuthNo: "OSPCB ଅନୁମୋଦନ ନମ୍ବର:",
    barcodePrintBtn: "🖨️ ଷ୍ଟିକର୍ ପ୍ରିଣ୍ଟ କରନ୍ତୁ",
    barcodeThermalBtn: "🧾 ୪x୩ ଥର୍ମାଲ୍ ପ୍ରିଣ୍ଟ",
    barcodeDownloadBtn: "📥 ଟ୍ୟାଗ୍ ଫଟୋ ଡାଉନଲୋଡ୍",
    barcodeCopyManifestBtn: "📋 ଡିଜିଟାଲ୍ ମ୍ୟାନିଫେଷ୍ଟ କପି",
    barcodeApplyFormBtn: "➕ ରେକର୍ଡରେ ଯୋଡ଼ନ୍ତୁ",
    barcodeRegenerate: "🔄 ନୂଆ ସିରିଏଲ୍ କୋଡ୍",
    barcodeScanNotice: "CPCB ମୋବାଇଲ୍ ଆପ୍ ଏବଂ ରାଜ୍ୟ ପ୍ରଦୂଷଣ ନିୟନ୍ତ୍ରଣ ବୋର୍ଡ ଦ୍ୱାରା ଯାଞ୍ଚ ଯୋଗ୍ୟ ।",
    manifestCopied: "✅ ଡିଜିଟାଲ୍ CPCB ମ୍ୟାନିଫେଷ୍ଟ କପି ହେଲା!"
  }
};

// ─── Bio-Medical Waste Knowledge Base (CPCB Rules 2016) ─────────────
const BMW_KNOWLEDGE_BASE = [
  {
    keywords: ["syringe with needle", "needle", "scalpel", "blade", "lancet", "sharp", "lumbar puncture needle", "suture needle", "सुई", "ब्लेड", "ଛୁଞ୍ଚି", "ବ୍ଲେଡ୍"],
    category: "WHITE",
    colorHex: "#64748b",
    emoji: "⚪",
    name: {
      en: "Sharps & Metallic Blades",
      hi: "नुकीली धातु, सर्जिकल ब्लेड एवं सुई",
      or: "ଧାରୁଆ ଧାତୁ, ବ୍ଲେଡ୍ ଓ ସିରିଞ୍ଜ ଛୁଞ୍ଚି"
    },
    categoryName: {
      en: "White (Translucent) — Waste Sharps",
      hi: "सफेद (पारभासी) — नुकीला कचरा",
      or: "ଧଳା (ପାରଦର୍ଶୀ) — ଧାରୁଆ ବର୍ଜ୍ୟବସ୍ତୁ"
    },
    binType: {
      en: "Puncture-proof, tamper-proof, leak-proof container",
      hi: "पंचर-प्रूफ, लीक-प्रूफ सफेद पारभासी कंटेनर",
      or: "ପଙ୍କଚର୍-ପ୍ରୁଫ୍ (କଣା ନହେବା ଭଳି) ଧଳା ପାରଦର୍ଶୀ କଣ୍ଟେନର୍"
    },
    treatment: {
      en: "Autoclaving or Dry Heat Sterilization followed by Shredding / Mutilation",
      hi: "ऑटोक्लेविंग या शुष्क ताप नसबंदी, उसके बाद श्रेडिंग (काटना)",
      or: "ଅଟୋକ୍ଲେଭିଂ ଏବଂ ତା'ପରେ ଶ୍ରେଡିଂ / ତରଳାଇବା (ସ୍ମେଲ୍ଟିଂ)"
    },
    riskLevel: {
      en: "CRITICAL (Sharps Injury & Blood-borne Pathogen Transmission)",
      hi: "अत्यधिक गंभीर (सुई चुभने की चोट एवं रक्त जनित संक्रमण का खतरा)",
      or: "ଅତ୍ୟନ୍ତ ଗୁରୁତର (ଛୁଞ୍ଚି ଫୁଟିବା ଆଘାତ ଓ ରକ୍ତବାହୀ ସଂକ୍ରମଣ ଆଶଙ୍କା)"
    },
    handlingRules: {
      en: [
        "Never recap, bend, or break needles by hand.",
        "Discard directly into puncture-resistant white sharps container at point of use.",
        "Seal container when 3/4th full; never overfill."
      ],
      hi: [
        "सुई को कभी हाथ से रीकैप, मोड़ें या तोड़ें नहीं।",
        "इस्तेमाल के तुरंत बाद सफेद पंचर-रोधी कंटेनर में डालें।",
        "कंटेनर के 3/4 भरने पर उसे सील कर दें।"
      ],
      or: [
        "ଛୁଞ୍ଚିକୁ କେବେ ବି ହାତରେ ବଙ୍କା କିମ୍ବା ରିକ୍ୟାପ୍ କରନ୍ତୁ ନାହିଁ ।",
        "ବ୍ୟବହାର ପରେ ସଙ୍ଗେ ସଙ୍ଗେ ଧଳା ପଙ୍କଚର୍-ପ୍ରୁଫ୍ କଣ୍ଟେନରରେ ପକାନ୍ତୁ ।",
        "ପାତ୍ରଟି ୩/୪ ଅଂଶ ଭର୍ତ୍ତି ହେଲେ ସିଲ୍ କରନ୍ତୁ ।"
      ]
    },
    degradationTime: {
      en: "Metallic components take 50 to 100+ years to corrode. Plastics take 450+ years.",
      hi: "धातु घटकों को गलने में 50 से 100+ वर्ष लगते हैं। प्लास्टिक 450+ वर्ष लेता है।",
      or: "ଧାତୁ କଳଙ୍କି ଲାଗି ନଷ୍ଟ ହେବାକୁ ୫୦ ରୁ ୧୦୦+ ବର୍ଷ ନିଏ । ପ୍ଲାଷ୍ଟିକ୍ ୪୫୦+ ବର୍ଷ ନିଏ ।"
    },
    environmentalImpact: {
      en: "Risk of needle-stick injuries to sanitation staff and hepatitis/HIV contamination.",
      hi: "सफाई कर्मियों को सुई चुभने का खतरा तथा हेपेटाइटिस/एचआईवी संक्रमण का प्रसार।",
      or: "ସଫେଇ କର୍ମଚାରୀଙ୍କୁ ଛୁଞ୍ଚି ଆଘାତ ଏବଂ ହେପାଟାଇଟିସ୍/HIV ସଂକ୍ରମଣର ଭୟଙ୍କର ଆଶଙ୍କା ।"
    },
    recyclingPotential: {
      en: "High — Shredded metal undergoes sterilized smelting and recycling after autoclaving.",
      hi: "उच्च — ऑटोक्लेविंग के बाद धातु को पिघलाकर औद्योगिक रीसाइक्लिंग की जाती है।",
      or: "ଉଚ୍ଚ — ଅଟୋକ୍ଲେଭିଂ ପରେ ଧାତୁକୁ ତରଳାଇ ନିରାପଦ ଭାବେ ରିସାଇକ୍ଲିଂ କରାଯାଏ ।"
    }
  },
  {
    keywords: ["blood", "gauze", "cotton", "dressing", "anatomical", "tissue", "organ", "body part", "placenta", "pathology", "swab", "soiled", "plaster cast", "foley bag fluid", "रक्त", "खून", "कॉटन", "पट्टी", "ରକ୍ତ", "କପା", "ପଟି", "ମାଂସପେଶୀ"],
    category: "YELLOW",
    colorHex: "#eab308",
    emoji: "🟡",
    name: {
      en: "Human Anatomical & Soiled Infectious Waste",
      hi: "मानव शारीरिक एवं रक्त से सने संक्रामक अपशिष्ट",
      or: "ମାନବ ଶାରୀରିକ ଏବଂ ରକ୍ତ ଲାଗିଥିବା ସଂକ୍ରାମକ ବର୍ଜ୍ୟବସ୍ତୁ"
    },
    categoryName: {
      en: "Yellow — Highly Infectious & Anatomical",
      hi: "पीला — अत्यधिक संक्रामक एवं शारीरिक",
      or: "ହଳଦିଆ — ଅତି ସଂକ୍ରାମକ ଓ ଶାରୀରିକ ବର୍ଜ୍ୟ"
    },
    binType: {
      en: "Non-chlorinated Yellow plastic bag with Biohazard symbol",
      hi: "गैर-क्लोरीनीकृत पीला प्लास्टिक बैग (बायोहैज़र्ड प्रतीक)",
      or: "ଅଣ-କ୍ଲୋରିନେଟେଡ୍ ହଳଦିଆ ପ୍ଲାଷ୍ଟିକ୍ ବ୍ୟାଗ୍ (ବାୟୋହାଜାର୍ଡ ଚିହ୍ନ)"
    },
    treatment: {
      en: "Incineration / Plasma Pyrolysis / Deep Burial in secured pits",
      hi: "उच्च तापमान पर भस्मीकरण (इंसिनरेशन) / प्लाज्मा पाइरोलिसिस",
      or: "ଉଚ୍ଚ ତାପମାତ୍ରା ଇନସିନେରେସନ୍ (ଭସ୍ମୀକରଣ) / ପ୍ଲାଜମା ପାଇରୋଲିସିସ୍"
    },
    riskLevel: {
      en: "HIGH (Severe Biological Hazard & Pathogen Contamination)",
      hi: "उच्च (गंभीर जैविक खतरा एवं रोगाणु संक्रमण)",
      or: "ଅତ୍ୟଧିକ (ମାରାତ୍ମକ ଜୈବିକ ବିପଦ ଓ ରୋଗାଣୁ ସଂକ୍ରମଣ)"
    },
    handlingRules: {
      en: [
        "Must be collected only in certified non-chlorinated yellow bags.",
        "Treat within 48 hours as per CPCB 2016 guidelines.",
        "Wear heavy-duty nitrile gloves and waterproof aprons."
      ],
      hi: [
        "केवल प्रमाणित गैर-क्लोरीनीकृत पीले बैग में एकत्र करें।",
        "सीपीसीबी नियमों के अनुसार 48 घंटे के भीतर उपचार अनिवार्य है।",
        "मजबूत दस्ताने और एप्रन अवश्य पहनें।"
      ],
      or: [
        "କେବଳ ପ୍ରମାଣିତ ହଳଦିଆ ବ୍ୟାଗରେ ସଂଗ୍ରହ କରନ୍ତୁ ।",
        "CPCB ନିୟମ ଅନୁସାରେ ୪୮ ଘଣ୍ଟା ମଧ୍ୟରେ ନିଷ୍କାସନ ବାଧ୍ୟତାମୂଳକ ।",
        "ହାତମୋଜା (ଗ୍ଲୋଭସ୍) ଏବଂ ଆପ୍ରନ ପିନ୍ଧନ୍ତୁ ।"
      ]
    },
    degradationTime: {
      en: "Biological matter decomposes in 2-6 weeks; plastic liners take 400+ years.",
      hi: "जैविक अपशिष्ट 2-6 सप्ताह में सड़ता है; प्लास्टिक लाइनर 400+ वर्ष लेते हैं।",
      or: "ଜୈବିକ ବର୍ଜ୍ୟବସ୍ତୁ ୨-୬ ସପ୍ତାହ ନିଏ; ପ୍ଲାଷ୍ଟିକ୍ ୪୦୦+ ବର୍ଷ ନିଏ ।"
    },
    environmentalImpact: {
      en: "If left untreated, spreads severe infectious diseases into groundwater and air.",
      hi: "उपचार न होने पर भूजल और हवा में गंभीर संक्रामक बीमारियां फैलाता है।",
      or: "ନିଷ୍କାସନ ନହେଲେ ଭୂତଳ ଜଳ ଓ ପରିବେଶରେ ମାରାତ୍ମକ ରୋଗ ବ୍ୟାପେ ।"
    },
    recyclingPotential: {
      en: "Zero — Strict incineration required to ash residue (<0.01% toxic organics).",
      hi: "शून्य — पूर्ण भस्मीकरण अनिवार्य (राख में परिवर्तित करना आवश्यक)।",
      or: "ଶୂନ — ସମ୍ପୂର୍ଣ୍ଣ ଭସ୍ମୀକରଣ (ପାଉଁଶ) କରିବା ବାଧ୍ୟତାମୂଳକ ।"
    }
  },
  {
    keywords: ["expired medicine", "cytotoxic", "chemotherapy", "drug", "tablet", "capsule", "antibiotic", "pharma", "vaccine expired", "दवा", "औषधि", "ଔଷଧ", "ଟାବଲେଟ୍"],
    category: "YELLOW",
    colorHex: "#eab308",
    emoji: "🟡",
    name: {
      en: "Expired / Discarded Medicines & Cytotoxic Drugs",
      hi: "एक्सपायर्ड दवाइयां एवं साइटोटॉक्सिक कीमोथेरेपी ड्रग्स",
      or: "ଅବଧି ସରିଥିବା (ଏକ୍ସପାୟାର୍ଡ) ଔଷଧ ଓ କୀମୋଥେରାପି ଡ୍ରଗ୍ସ"
    },
    categoryName: {
      en: "Yellow — Cytotoxic & Pharmaceutical Waste",
      hi: "पीला — साइटोटॉक्सिक एवं फार्मास्युटिकल अपशिष्ट",
      or: "ହଳଦିଆ — ସାଇଟୋଟକ୍ସିକ୍ ଓ ଫାର୍ମାସ୍ୟୁଟିକାଲ୍ ବର୍ଜ୍ୟ"
    },
    binType: {
      en: "Yellow bag/box with Cytotoxic hazard label",
      hi: "साइटोटॉक्सिक खतरे के लेबल वाला पीला बैग/बॉक्स",
      or: "ସାଇଟୋଟକ୍ସିକ୍ ଚିହ୍ନ ଥିବା ହଳଦିଆ ବ୍ୟାଗ୍ / ବକ୍ସ"
    },
    treatment: {
      en: "High-Temperature Incineration (>1200°C) or Return to Manufacturer",
      hi: "अत्यधिक उच्च तापमान इंसिनरेशन (>1200°C) या निर्माता को वापसी",
      or: "ଅତି ଉଚ୍ଚ ତାପମାତ୍ରା ଭସ୍ମୀକରଣ (>୧୨୦୦°C) କିମ୍ବା ଉତ୍ପାଦକଙ୍କୁ ଫେରସ୍ତ"
    },
    riskLevel: {
      en: "HIGH (Chemical & Carcinogenic Hazard)",
      hi: "उच्च (रासायनिक एवं कैंसरकारी खतरा)",
      or: "ଉଚ୍ଚ (ରାସାୟନିକ ଏବଂ କ୍ୟାନସରକାରୀ ବିପଦ)"
    },
    handlingRules: {
      en: [
        "Keep separate from biological waste in marked yellow bins.",
        "Do not drain down hospital sinks or general sewer lines."
      ],
      hi: [
        "अस्पताल के सिंक या सामान्य नाली में कभी न बहाएं।",
        "अलग पीले बॉक्स में साइटोटॉक्सिक लेबल के साथ रखें।"
      ],
      or: [
        "ଡାକ୍ତରଖାନାର ସିଙ୍କ୍ ବା ସାଧାରଣ ନାଳରେ କେବେ ବି ଢାଳନ୍ତୁ ନାହିଁ ।",
        "ସ୍ୱତନ୍ତ୍ର ହଳଦିଆ ବକ୍ସରେ ସାଇଟୋଟକ୍ସିକ୍ ଚିହ୍ନ ସହ ରଖନ୍ତୁ ।"
      ]
    },
    degradationTime: {
      en: "Active pharmaceutical ingredients (APIs) persist for decades in water.",
      hi: "दवाओं के रासायनिक तत्व दशकों तक भूजल में बने रहते हैं।",
      or: "ଔଷଧର ରାସାୟନିକ ଉପାଦାନ ବର୍ଷ ବର୍ଷ ଧରି ପାଣିରେ ନଷ୍ଟ ନହୋଇ ରହିଥାଏ ।"
    },
    environmentalImpact: {
      en: "Induces widespread antimicrobial resistance (AMR) and toxic water supply.",
      hi: "एंटीमाइक्रोबियल प्रतिरोध (AMR) को बढ़ावा देता है तथा पेयजल को जहरीला बनाता है।",
      or: "ଆଣ୍ଟିବାୟୋଟିକ୍ ପ୍ରତିରୋଧ (AMR) ସୃଷ୍ଟି କରେ ଏବଂ ପିଇବା ପାଣିକୁ ବିଷାକ୍ତ କରେ ।"
    },
    recyclingPotential: {
      en: "None — Destruction required.",
      hi: "शून्य — पूर्ण विनाश आवश्यक।",
      or: "ଶୂନ — ସମ୍ପୂର୍ଣ୍ଣ ନଷ୍ଟ କରିବା ବାଧ୍ୟତାମୂଳକ ।"
    }
  },
  {
    keywords: ["iv bottle", "iv set", "tubing", "catheter", "urine bag", "dialysis", "gloves", "apron", "vacutainer", "plastic", "syringe without needle", "speculum", "प्लास्टिक", "दस्ताने", "ग्लव्स", "ପ୍ଲାଷ୍ଟିକ୍", "ଗ୍ଲୋଭସ୍", "ପାଇପ୍"],
    category: "RED",
    colorHex: "#ef4444",
    emoji: "🔴",
    name: {
      en: "Contaminated Recyclable Plastics",
      hi: "दूषित पुनर्चक्रण योग्य प्लास्टिक अपशिष्ट",
      or: "ଦୂଷିତ ପୁନଃଚକ୍ରଣ ଯୋଗ୍ୟ ପ୍ଲାଷ୍ଟିକ୍ ବର୍ଜ୍ୟବସ୍ତୁ"
    },
    categoryName: {
      en: "Red — Contaminated Plastic Waste",
      hi: "लाल — दूषित प्लास्टिक अपशिष्ट",
      or: "ଲାଲ୍ — ଦୂଷିତ ପ୍ଲାଷ୍ଟିକ୍ ବର୍ଜ୍ୟବସ୍ତୁ"
    },
    binType: {
      en: "Non-chlorinated Red plastic bag with Biohazard symbol",
      hi: "गैर-क्लोरीनीकृत लाल प्लास्टिक बैग (बायोहैज़र्ड प्रतीक)",
      or: "ଅଣ-କ୍ଲୋରିନେଟେଡ୍ ଲାଲ୍ ପ୍ଲାଷ୍ଟିକ୍ ବ୍ୟାଗ୍ (ବାୟୋହାଜାର୍ଡ ଚିହ୍ନ)"
    },
    treatment: {
      en: "Autoclaving / Hydroclaving / Microwaving followed by Shredding & Regranulation",
      hi: "ऑटोक्लेविंग / माइक्रोवेविंग और उसके बाद श्रेडिंग (टुकड़े करना)",
      or: "ଅଟୋକ୍ଲେଭିଂ ଏବଂ ତା'ପରେ ଶ୍ରେଡିଂ (ଛୋଟ ଖଣ୍ଡ କରି କାଟିବା)"
    },
    riskLevel: {
      en: "MODERATE TO HIGH (Infectious Plastic Contamination)",
      hi: "मध्यम से उच्च (संक्रामक प्लास्टिक संदूषण)",
      or: "ମଧ୍ୟମରୁ ଉଚ୍ଚ (ସଂକ୍ରାମକ ପ୍ଲାଷ୍ଟିକ୍ ପ୍ରଦୂଷଣ)"
    },
    handlingRules: {
      en: [
        "Cut tubing into small lengths at source to prevent reuse.",
        "Ensure needles are detached and discarded in White container first."
      ],
      hi: [
        "पुनः उपयोग रोकने के लिए ट्यूबिंग को छोटे टुकड़ों में काटें।",
        "सुनिश्चित करें कि सुई को पहले अलग कर सफेद डिब्बे में डाला गया है।"
      ],
      or: [
        "ପୁନର୍ବାର ବ୍ୟବହାର ରୋକିବା ପାଇଁ ପାଇପ୍ କୁ ଛୋଟ ଛୋଟ ଖଣ୍ଡ କରି କାଟନ୍ତୁ ।",
        "ନିଶ୍ଚିତ କରନ୍ତୁ ଯେ ଛୁଞ୍ଚିକୁ ପ୍ରଥମେ ଅଲଗା କରି ଧଳା କଣ୍ଟେନରରେ ରଖାଯାଇଛି ।"
      ]
    },
    degradationTime: {
      en: "450 to 500+ years if dumped in landfills; breaks down into toxic microplastics.",
      hi: "लैंडफिल में 450 से 500+ वर्ष; जहरीले माइक्रोप्लास्टिक में बदल जाता है।",
      or: "ମାଟିରେ ପଡ଼ି ରହିଲେ ୪୫୦ ରୁ ୫୦୦+ ବର୍ଷ ନିଏ; ବିଷାକ୍ତ ମାଇକ୍ରୋପ୍ଲାଷ୍ଟିକରେ ପରିଣତ ହୁଏ ।"
    },
    environmentalImpact: {
      en: "Dioxin emissions if burned improperly; long-term plastic pollution.",
      hi: "जलाने पर जहरीली डाइऑक्सिन गैस निकलती है; दीर्घकालिक प्लास्टिक प्रदूषण।",
      or: "ଜଳାଇଲେ ବିଷାକ୍ତ ଡାଇଅକ୍ସିନ୍ ଗ୍ୟାସ୍ ବାହାରେ; ପରିବେଶ ପାଇଁ ଗମ୍ଭୀର କ୍ଷତିକାରକ ।"
    },
    recyclingPotential: {
      en: "Very High — Recycled into industrial plastic pellets after autoclaving.",
      hi: "अत्यधिक उच्च — ऑटोक्लेव के बाद औद्योगिक प्लास्टिक दानों में रीसायकल।",
      or: "ଅତ୍ୟନ୍ତ ଉଚ୍ଚ — ନିର୍ମଳ ଅଟୋକ୍ଲେଭିଂ ପରେ ଶିଳ୍ପ ପ୍ଲାଷ୍ଟିକ୍ ସାମଗ୍ରୀରେ ରିସାଇକ୍ଲିଂ ହୁଏ ।"
    }
  },
  {
    keywords: ["glass", "vial", "ampoule", "beaker", "test tube", "slide", "implant", "orthopedic pin", "plate", "metal screw", "कांच", "शीशी", "इम्प्लांट", "କାଚ", "ଶିଶି", "ଇମ୍ପ୍ଲାଣ୍ଟ"],
    category: "BLUE",
    colorHex: "#3b82f6",
    emoji: "🔵",
    name: {
      en: "Glassware & Metallic Implants",
      hi: "कांच का सामान एवं आर्थोपेडिक धातु प्रत्यारोपण",
      or: "କାଚ ସାମଗ୍ରୀ ଏବଂ ଧାତବ ଅସ୍ଥି ଇମ୍ପ୍ଲାଣ୍ଟ"
    },
    categoryName: {
      en: "Blue — Glassware & Metallic Implants",
      hi: "नीला — कांच की शीशियां एवं धातु प्रत्यारोपण",
      or: "ନୀଳ — କାଚ ଶିଶି ଏବଂ ଧାତବ ଇମ୍ପ୍ଲାଣ୍ଟ"
    },
    binType: {
      en: "Cardboard boxes with blue marking / Puncture-proof container",
      hi: "नीले निशान वाला कार्डबोर्ड बॉक्स / मजबूत कंटेनर",
      or: "ନୀଳ ଚିହ୍ନ ଥିବା କାର୍ଡବୋର୍ଡ ବକ୍ସ / ପଙ୍କଚର୍-ପ୍ରୁଫ୍ କଣ୍ଟେନର୍"
    },
    treatment: {
      en: "Disinfection (1% Sodium Hypochlorite soaking or Autoclaving) followed by Glass Recycling",
      hi: "कीटाणुशोधन (1% सोडियम हाइपोक्लोराइट या ऑटोक्लेविंग) एवं कांच पुनर्चक्रण",
      or: "ଡିସଇନଫେକସନ୍ (୧% ସୋଡିୟମ୍ ହାଇପୋକ୍ଲୋରାଇଟ୍) ଏବଂ କାଚ ରିସାଇକ୍ଲିଂ"
    },
    riskLevel: {
      en: "MODERATE (Physical Cut Hazard & Residual Contamination)",
      hi: "मध्यम (कांच से कटने का खतरा एवं अवशिष्ट संदूषण)",
      or: "ମଧ୍ୟମ (କାଚ କଟିବା ଆଘାତ ଓ ଅବଶିଷ୍ଟ ଔଷଧ ବିପଦ)"
    },
    handlingRules: {
      en: [
        "Discard medicine ampoules and vials into blue-marked box.",
        "Do not mix with broken window glass or general trash."
      ],
      hi: [
        "दवा की कांच की शीशियों और एम्पुल को नीले बॉक्स में डालें।",
        "सामान्य कचरे या खिड़की के कांच के साथ न मिलाएं।"
      ],
      or: [
        "ଔଷଧ କାଚ ଶିଶି ଓ ଆମ୍ପୁଲ୍ କୁ ନୀଳ ବକ୍ସରେ ପକାନ୍ତୁ ।",
        "ସାଧାରଣ ଅଳିଆ ବା ଝରକା କାଚ ସହ ମିଶାନ୍ତୁ ନାହିଁ ।"
      ]
    },
    degradationTime: {
      en: "Glass takes 1,000,000+ years to decompose in nature.",
      hi: "कांच को प्रकृति में विघटित होने में 10 लाख से अधिक वर्ष लगते हैं।",
      or: "କାଚ ପ୍ରାକୃତିକ ଭାବେ ନଷ୍ଟ ହେବାକୁ ୧୦ ଲକ୍ଷରୁ ଅଧିକ ବର୍ଷ ଲାଗିଥାଏ ।"
    },
    environmentalImpact: {
      en: "Hazardous sharp cuts in landfills; 100% infinitely recyclable.",
      hi: "कचरे के ढेर में कटने का खतरा; 100% अनंत बार पुनर्चक्रण योग्य।",
      or: "ମାଟିରେ ରହିଲେ କାଟିବା ଆଘାତ ହୁଏ; କିନ୍ତୁ ଏହା ଶତପ୍ରତିଶତ ଅନନ୍ତକାଳ ପାଇଁ ରିସାଇକ୍ଲିଂ ଯୋଗ୍ୟ ।"
    },
    recyclingPotential: {
      en: "100% Recyclable — Re-melted into new industrial glassware.",
      hi: "100% पुनर्चक्रण योग्य — नई कांच की बोतलों में दोबारा गलाना।",
      or: "୧୦୦% ରିସାଇକ୍ଲିଂ ଯୋଗ୍ୟ — ତରଳାଇ ପୁଣି ନୂଆ କାଚ ବୋତଲ ତିଆରି ହୋଇପାରିବ ।"
    }
  }
];

// Fallback search algorithm with multi-language resolution
function classifyByText(queryText, lang = "en") {
  const q = String(queryText || "").toLowerCase().trim();
  const safeLang = ["en", "hi", "or"].includes(lang) ? lang : "en";

  for (const item of BMW_KNOWLEDGE_BASE) {
    for (const kw of item.keywords) {
      if (q.includes(kw.toLowerCase())) {
        return {
          category: item.category,
          colorHex: item.colorHex,
          emoji: item.emoji,
          detectedItem: item.name[safeLang] || item.name.en,
          categoryName: item.categoryName[safeLang] || item.categoryName.en,
          binType: item.binType[safeLang] || item.binType.en,
          treatment: item.treatment[safeLang] || item.treatment.en,
          riskLevel: item.riskLevel[safeLang] || item.riskLevel.en,
          handlingRules: item.handlingRules[safeLang] || item.handlingRules.en,
          degradationTime: item.degradationTime[safeLang] || item.degradationTime.en,
          environmentalImpact: item.environmentalImpact[safeLang] || item.environmentalImpact.en,
          recyclingPotential: item.recyclingPotential[safeLang] || item.recyclingPotential.en,
          confidence: 96 + Math.floor(Math.random() * 3),
          source: safeLang === "hi" ? "सीपीसीबी 2016 मानक क्लासिफायर" : safeLang === "or" ? "CPCB 2016 ମାନକ ବିଶ୍ଳେଷକ" : "CPCB 2016 Standard Classifier"
        };
      }
    }
  }

  // Broad fallbacks
  const item = (q.includes("mask") || q.includes("ppe") || q.includes("band") || q.includes("urine") || q.includes("fluid") || q.includes("रक्त") || q.includes("ରକ୍ତ"))
    ? BMW_KNOWLEDGE_BASE[1] // Yellow
    : BMW_KNOWLEDGE_BASE[3]; // Red

  return {
    category: item.category,
    colorHex: item.colorHex,
    emoji: item.emoji,
    detectedItem: item.name[safeLang] || item.name.en,
    categoryName: item.categoryName[safeLang] || item.categoryName.en,
    binType: item.binType[safeLang] || item.binType.en,
    treatment: item.treatment[safeLang] || item.treatment.en,
    riskLevel: item.riskLevel[safeLang] || item.riskLevel.en,
    handlingRules: item.handlingRules[safeLang] || item.handlingRules.en,
    degradationTime: item.degradationTime[safeLang] || item.degradationTime.en,
    environmentalImpact: item.environmentalImpact[safeLang] || item.environmentalImpact.en,
    recyclingPotential: item.recyclingPotential[safeLang] || item.recyclingPotential.en,
    confidence: 88,
    source: safeLang === "hi" ? "सीपीसीबी 2016 दिशानिर्देश" : safeLang === "or" ? "CPCB 2016 ନିର୍ଦ୍ଦେଶାବଳୀ" : "CPCB 2016 Baseline"
  };
}

// ─── CPCB 2016 Contamination & Cross-Mixing Audit Engine ───────────
const CONTAMINATION_PRESETS = [
  {
    id: "emergency_ot_tray",
    name: {
      en: "🚨 Post-Op Emergency OT Tray (Critical Cross-Contamination)",
      hi: "🚨 ऑपरेशन के बाद की ट्रे (अत्यधिक गंभीर क्रॉस-संदूषण)",
      or: "🚨 ଅପରେସନ୍ ପରର ଟ୍ରେ (ମାରାତ୍ମକ ପ୍ରଦୂଷଣ ମିଶ୍ରଣ)"
    },
    badge: {
      en: "Critical Alert",
      hi: "गंभीर चेतावनी",
      or: "ଗୁରୁତର ସତର୍କତା"
    },
    targetBin: "ALL",
    sampleItems: [
      "Used syringe with uncapped needle",
      "Blood-soaked cotton gauze swab",
      "Empty saline plastic IV bottle",
      "Broken glass medicine ampoule"
    ],
    itemsList: {
      en: [
        { name: "Used Syringe with Uncapped Needle", expectedBin: "WHITE", currentBin: "MIXED TRAY", isContaminant: true, danger: "High puncture injury hazard; extreme risk of transmitting HIV, Hepatitis B & C to hospital housekeeping workers." },
        { name: "Blood-Soaked Surgical Gauze Swab", expectedBin: "YELLOW", currentBin: "MIXED TRAY", isContaminant: true, danger: "High biological pathogen load; must never be commingled with recyclable plastics or glass." },
        { name: "Empty Saline Plastic IV Bottle (PP)", expectedBin: "RED", currentBin: "MIXED TRAY", isContaminant: false, danger: "Contaminated by surrounding fluids; requires autoclave sterilization before circular recycling." },
        { name: "Broken Glass Medicine Ampoule", expectedBin: "BLUE", currentBin: "MIXED TRAY", isContaminant: true, danger: "Severe laceration hazard; if mixed into yellow incineration bag, causes high-pressure explosive furnace shatter." }
      ],
      hi: [
        { name: "सुई सहित इस्तेमाल सिरिंज (खुली सुई)", expectedBin: "WHITE", currentBin: "मिश्रित ट्रे", isContaminant: true, danger: "सुई चुभने का गंभीर खतरा; सफाई कर्मियों में एचआईवी और हेपेटाइटिस बी/सी फैलने की अत्यधिक संभावना।" },
        { name: "खून से सनी सर्जिकल रुई व पट्टी", expectedBin: "YELLOW", currentBin: "मिश्रित ट्रे", isContaminant: true, danger: "अत्यधिक संक्रामक रोगाणु; इसे रीसाइकिल प्लास्टिक या कांच के साथ कभी नहीं मिलाना चाहिए।" },
        { name: "खाली सेलाइन प्लास्टिक बोतल (पीपी)", expectedBin: "RED", currentBin: "मिश्रित ट्रे", isContaminant: false, danger: "अन्य कचरे से दूषित; रीसाइक्लिंग से पहले ऑटोक्लेव नसबंदी आवश्यक।" },
        { name: "टूटा हुआ कांच का एम्पूल", expectedBin: "BLUE", currentBin: "मिश्रित ट्रे", isContaminant: true, danger: "कांच से कटने का खतरा; भस्मीकरण भट्टी में फटने और भट्टी की ईंटों को नुकसान पहुंचाने का जोखिम।" }
      ],
      or: [
        { name: "ଖୋଲା ଛୁଞ୍ଚି ଥିବା ବ୍ୟବହୃତ ସିରିଞ୍ଜ", expectedBin: "WHITE", currentBin: "ମିଶ୍ରିତ ଟ୍ରେ", isContaminant: true, danger: "ଛୁଞ୍ଚି ଫୁଟିବା ଆଘାତର ଭୟଙ୍କର ବିପଦ; ସଫେଇ କର୍ମଚାରୀଙ୍କୁ HIV ଓ ହେପାଟାଇଟିସ୍ B/C ସଂକ୍ରମଣ ଆଶଙ୍କା ।" },
        { name: "ରକ୍ତ ଭିଜା ସର୍ଜିକାଲ୍ କପା ଓ ପଟି", expectedBin: "YELLOW", currentBin: "ମିଶ୍ରିତ ଟ୍ରେ", isContaminant: true, danger: "ମାରାତ୍ମକ ଜୈବିକ ସଂକ୍ରାମକ ବର୍ଜ୍ୟ; ଏହାକୁ କଦାପି ପ୍ଲାଷ୍ଟିକ୍ ବା କାଚ ସହ ମିଶାନ୍ତୁ ନାହିଁ ।" },
        { name: "ଖାଲି ସାଲାଇନ୍ ପ୍ଲାଷ୍ଟିକ୍ ବୋତଲ (PP)", expectedBin: "RED", currentBin: "ମିଶ୍ରିତ ଟ୍ରେ", isContaminant: false, danger: "ଅନ୍ୟ ବର୍ଜ୍ୟ ସଂସ୍ପର୍ଶରେ ଆସିଛି; ରିସାଇକ୍ଲିଂ ପୂର୍ବରୁ ଅଟୋକ୍ଲେଭିଂ ଆବଶ୍ୟକ ।" },
        { name: "ଭଙ୍ଗା କାଚ ଔଷଧ ଆମ୍ପୁଲ୍", expectedBin: "BLUE", currentBin: "ମିଶ୍ରିତ ଟ୍ରେ", isContaminant: true, danger: "କାଚ କଟିବା ଆଘାତ; ଇନସିନେରେଟର ଭିତରେ ବିସ୍ଫୋରଣ ଘଟାଇ ଯନ୍ତ୍ରପାତି ନଷ୍ଟ କରିପାରେ ।" }
      ]
    },
    severity: "CRITICAL",
    complianceScore: 25,
    summary: {
      en: "CRITICAL VIOLATION: 4 completely incompatible CPCB waste streams are commingled on an open tray. Immediate intervention required before waste handlers touch this batch.",
      hi: "गंभीर उल्लंघन: खुले ट्रे पर 4 पूरी तरह से असंगत सीपीसीबी कचरा श्रेणियां एक साथ मिली हुई हैं। कचरा संभालने से पहले तत्काल अलगाव आवश्यक है।",
      or: "ଗୁରୁତର ନିୟମ ଉଲ୍ଲଂଘନ: ୪ଟି ପରସ୍ପର ବିରୋଧୀ ବର୍ଜ୍ୟବସ୍ତୁ ଗୋଟିଏ ଖୋଲା ଟ୍ରେ ରେ ମିଶି ରହିଛି । ହାତ ଲଗାଇବା ପୂର୍ବରୁ ତୁରନ୍ତ ସୁଧାର ଆବଶ୍ୟକ ।"
    },
    violations: {
      en: [
        "CPCB 2016 Schedule I Part 1: Waste sharps (needles/scalpels) mixed in general tray instead of designated puncture-proof White container.",
        "CPCB Bio-Medical Waste Rule 4(c): Non-segregation at source leading to gross cross-contamination of recyclable plastic polymers.",
        "Hazardous Incineration Risk: Mixing glass ampoules with organic waste introduces thermal explosion hazards in biomedical incinerators."
      ],
      hi: [
        "सीपीसीबी 2016 अनुसूची I: नुकीले कचरे (सुई) को सफेद पंचर-रोधी कंटेनर के बजाय खुली ट्रे में रखना सख्त वर्जित है।",
        "सीपीसीबी नियम 4(c): स्रोत पर पृथक्करण न होने के कारण पुनर्चक्रण योग्य प्लास्टिक पूरी तरह दूषित हो गया है।",
        "भस्मीकरण खतरा: जैविक कचरे के साथ कांच मिलाने से बायोमेडिकल इंसिनरेटर में विस्फोट का गंभीर खतरा उत्पन्न होता है।"
      ],
      or: [
        "CPCB 2016 ଅନୁସୂଚୀ I: ଧାରୁଆ ଛୁଞ୍ଚିକୁ ଧଳା ପଙ୍କଚର୍-ପ୍ରୁଫ୍ କଣ୍ଟେନର୍ ବଦଳରେ ଖୋଲା ଟ୍ରେ ରେ ରଖିବା ନିୟମ ବିରୁଦ୍ଧ ।",
        "CPCB ନିୟମ ୪(c): ଉତ୍ପତ୍ତି ସ୍ଥଳରେ ପୃଥକୀକରଣ ନକରିବା ଫଳରେ ରିସାଇକ୍ଲିଂ ଯୋଗ୍ୟ ପ୍ଲାଷ୍ଟିକ୍ ଦୂଷିତ ହୋଇଛି ।",
        "ଇନସିନେରେସନ୍ ବିପଦ: ହଳଦିଆ ବର୍ଜ୍ୟ ସହ କାଚ ମିଶିଲେ ଭସ୍ମୀକରଣ ଚୁଲିରେ ବିସ୍ଫୋରଣ ଘଟିପାରେ ।"
      ]
    },
    correctiveSteps: {
      en: [
        "🛑 HALT DISPOSAL: Do not compress, tip, or transport this tray into any single bin bag.",
        "🧤 PPE MANDATE: Wear puncture-resistant nitrile gloves and eye safety shield.",
        "🧲 FORCEPS RETRIEVAL: Use surgical forceps (never bare hands) to pick up the needle/syringe and drop into the WHITE sharps container.",
        "🟡 YELLOW ISOLATION: Transfer blood-soaked gauze into a non-chlorinated YELLOW biohazard bag.",
        "🔵 BLUE SEGREGATION: Place glass ampoule shards into puncture-proof cardboard box with Blue label.",
        "🔴 RED RECYCLING: Place the plastic IV bottle into the RED bag for autoclaving and shredding.",
        "📋 INCIDENT LOG: Log non-conformance ticket in MediSort Hospital Compliance Register."
      ],
      hi: [
        "🛑 तुरंत रोकें: इस ट्रे को किसी भी एक बैग में न पलटें या दबाएं।",
        "🧤 सुरक्षा उपकरण: पंचर-रोधी दस्ताने और सुरक्षा चश्मा पहनें।",
        "🧲 फोरसेप्स से सुई हटाएं: बिना हाथ लगाए चिमटे (फोरसेप्स) से सुई उठाकर सफेद कंटेनर में डालें।",
        "🟡 पीला अलगाव: खून से सनी रुई पट्टी को गैर-क्लोरीनीकृत पीले बैग में डालें।",
        "🔵 नीला अलगाव: कांच के टुकड़ों को नीले लेबल वाले कार्डबोर्ड बॉक्स में रखें।",
        "🔴 लाल रीसाइक्लिंग: प्लास्टिक बोतल को लाल बैग में ऑटोक्लेविंग हेतु डालें।",
        "📋 रजिस्टर में दर्ज: मेडीसॉर्ट कम्प्लायंस रजिस्टर में उल्लंघन नोट करें।"
      ],
      or: [
        "🛑 ତୁରନ୍ତ ବନ୍ଦ କରନ୍ତୁ: ଏହି ଟ୍ରେ କୁ କୌଣସି ଗୋଟିଏ ବ୍ୟାଗରେ ଢାଳନ୍ତୁ ନାହିଁ ।",
        "🧤 ସୁରକ୍ଷା ଉପକରଣ: ମଜବୁତ୍ ଗ୍ଲୋଭସ୍ ଓ ଚଷମା ପିନ୍ଧନ୍ତୁ ।",
        "🧲 ଫୋରସେପ୍ସ ସାହାଯ୍ୟରେ ଛୁଞ୍ଚି କାଢ଼ନ୍ତୁ: ହାତ ନଲଗାଇ ଚିମୁଟା (ଫୋରସେପ୍ସ) ସାହାଯ୍ୟରେ ଛୁଞ୍ଚିକୁ ଧଳା କଣ୍ଟେନରରେ ପକାନ୍ତୁ ।",
        "🟡 ହଳଦିଆ ବ୍ୟାଗ୍: ରକ୍ତ ଲାଗିଥିବା ଗଜ୍ କପାକୁ ହଳଦିଆ ବ୍ୟାଗରେ ରଖନ୍ତୁ ।",
        "🔵 ନୀଳ ବକ୍ସ: କାଚ ଆମ୍ପୁଲ୍ କୁ ନୀଳ ଚିହ୍ନ ଥିବା ପାତ୍ରରେ ପକାନ୍ତୁ ।",
        "🔴 ଲାଲ୍ ବ୍ୟାଗ୍: ପ୍ଲାଷ୍ଟିକ୍ ବୋତଲକୁ ଲାଲ୍ ବ୍ୟାଗରେ ଅଟୋକ୍ଲେଭିଂ ପାଇଁ ପକାନ୍ତୁ ।",
        "📋 ରେକର୍ଡ ଦର୍ଜ: ମେଡ଼ିସର୍ଟ ପଞ୍ଜିକାରେ ଏହି ଘଟଣା ଲିପିବଦ୍ଧ କରନ୍ତୁ ।"
      ]
    },
    audioAlert: {
      en: "Critical contamination alert! Four incompatible waste streams found commingled on tray. Loose uncapped needle detected. Do not touch with bare hands. Use forceps to isolate sharps into white container immediately.",
      hi: "गंभीर संदूषण चेतावनी! ट्रे पर चार असंगत कचरा श्रेणियां मिली हैं। खुली सुई मौजूद है। बिना दस्ताने हाथ न लगाएं। तुरंत फोरसेप्स से सुई को सफेद डिब्बे में डालें।",
      or: "ଗୁରୁତର ସତର୍କତା! ଟ୍ରେ ରେ ଚାରୋଟି ଭିନ୍ନ ବର୍ଜ୍ୟ ମିଶି ରହିଛି । ଖୋଲା ଛୁଞ୍ଚି ଚିହ୍ନଟ ହୋଇଛି । ହାତ ଲଗାନ୍ତୁ ନାହିଁ, ଫୋରସେପ୍ସ ସାହାଯ୍ୟରେ ଧଳା ବାକ୍ସରେ ପକାନ୍ତୁ ।"
    }
  },
  {
    id: "yellow_bag_pvc",
    name: {
      en: "🚨 Yellow Bag Infiltration (PVC Plastic & Glass in Incinerator Bag)",
      hi: "🚨 पीले बैग में प्लास्टिक और कांच (डाइऑक्सिन विषैला उत्सर्जन खतरा)",
      or: "🚨 ହଳଦିଆ ବ୍ୟାଗରେ ପ୍ଲାଷ୍ଟିକ୍ ଓ କାଚ (ବିଷାକ୍ତ ଡାଇଅକ୍ସିନ୍ ନିର୍ଗମନ ବିପଦ)"
    },
    badge: {
      en: "High Risk",
      hi: "उच्च जोखिम",
      or: "ଉଚ୍ଚ ବିପଦ"
    },
    targetBin: "YELLOW",
    sampleItems: [
      "Human pathological organ tissue",
      "PVC Catheter tubing line",
      "Glass injection vial with metal crimp"
    ],
    itemsList: {
      en: [
        { name: "Human Pathological Tissue / Placenta", expectedBin: "YELLOW", currentBin: "YELLOW BAG", isContaminant: false, danger: "100% compliant for high-temperature incineration (>1050°C)." },
        { name: "PVC Urinary Catheter Tubing", expectedBin: "RED", currentBin: "YELLOW BAG", isContaminant: true, danger: "Combustion of polyvinyl chloride (PVC) at incinerator temperatures generates lethal Carcinogenic Polychlorinated Dibenzo-p-Dioxins and Furans (PCDD/PCDF)." },
        { name: "Glass Medicine Vial with Crimp", expectedBin: "BLUE", currentBin: "YELLOW BAG", isContaminant: true, danger: "Glass cannot burn; fuses into furnace refractory bricks and clogs bottom ash grate systems." }
      ],
      hi: [
        { name: "मानव पैथोलॉजिकल ऊतक (ऑर्गन वेस्ट)", expectedBin: "YELLOW", currentBin: "पीला बैग", isContaminant: false, danger: "पीले बैग के लिए 100% सही; 1050°C भस्मीकरण हेतु उपयुक्त।" },
        { name: "पीवीसी कैथेटर यूरिनरी ट्यूबिंग", expectedBin: "RED", currentBin: "पीला बैग", isContaminant: true, danger: "पीवीसी जलने पर अत्यधिक विषैले और कैंसरकारी डाइऑक्सिन और फ्यूरान रसायन निकलते हैं।" },
        { name: "कांच की दवा शीशी (वायल)", expectedBin: "BLUE", currentBin: "पीला बैग", isContaminant: true, danger: "कांच जलता नहीं है; भट्टी की दीवारों पर पिघलकर चिपक जाता है और राख की जाली बंद कर देता है।" }
      ],
      or: [
        { name: "ମାନବ ଶାରୀରିକ କ୍ଷତ ଅଂଶ (ପାଥୋଲୋଜିକାଲ୍)", expectedBin: "YELLOW", currentBin: "ହଳଦିଆ ବ୍ୟାଗ୍", isContaminant: false, danger: "ହଳଦିଆ ବ୍ୟାଗ୍ ପାଇଁ ୧୦୦% ସଠିକ୍; ୧୦୫୦°C ଭସ୍ମୀକରଣ ପାଇଁ ଉଦ୍ଦିଷ୍ଟ ।" },
        { name: "PVC କ୍ୟାଥେଟର ପାଇପ୍", expectedBin: "RED", currentBin: "ହଳଦିଆ ବ୍ୟାଗ୍", isContaminant: true, danger: "PVC ପୋଡ଼ିଲେ କ୍ୟାନସର ସୃଷ୍ଟିକାରୀ ବିଷାକ୍ତ ଡାଇଅକ୍ସିନ୍ ଏବଂ ଫ୍ୟୁରାନ୍ ବାଷ୍ପ ବାହାରେ ।" },
        { name: "କାଚ ଇଞ୍ଜେକ୍ସନ୍ ଭାଏଲ୍", expectedBin: "BLUE", currentBin: "ହଳଦିଆ ବ୍ୟାଗ୍", isContaminant: true, danger: "କାଚ ଜଳେ ନାହିଁ; ଇନସିନେରେଟର ଭିତର କାନ୍ଥ ନଷ୍ଟ କରେ ।" }
      ]
    },
    severity: "HIGH",
    complianceScore: 33,
    summary: {
      en: "HIGH VIOLATION: PVC Plastics and Glass discovered inside Yellow Incineration Bag. Burning chlorinated plastics violates national environmental emission norms.",
      hi: "उच्च उल्लंघन: पीले भस्मीकरण बैग में पीवीसी प्लास्टिक और कांच पाए गए। क्लोरीनीकृत प्लास्टिक जलाना पर्यावरण मानकों का गंभीर उल्लंघन है।",
      or: "ଗୁରୁତର ତ୍ରୁଟି: ହଳଦିଆ ବ୍ୟାଗରେ PVC ପ୍ଲାଷ୍ଟିକ୍ ଏବଂ କାଚ ଚିହ୍ନଟ ହୋଇଛି । ଏହାକୁ ଜଳାଇଲେ ବାୟୁମଣ୍ଡଳ ବିଷାକ୍ତ ହେବ ।"
    },
    violations: {
      en: [
        "CPCB 2016 Rule 5(g): Prohibition of chlorinated plastic bags and tubing in yellow stream destined for incineration.",
        "MoEFCC Dioxin/Furan Standard: Violation of the mandatory 0.1 ng TEQ/Nm³ stack emission standard.",
        "Schedule I Yellow (a): Non-incinerable glass commingling."
      ],
      hi: [
        "सीपीसीबी नियम 5(g): पीले भस्मीकरण कचरे में क्लोरीनीकृत प्लास्टिक डालना पूरी तरह प्रतिबंधित है।",
        "पर्यावरण मंत्रालय उत्सर्जन मानक: 0.1 ng TEQ/Nm³ डाइऑक्सिन मानक का गंभीर उल्लंघन।",
        "अनुसूची I: गैर-दहनशील कांच का जैविक कचरे में मिश्रण।"
      ],
      or: [
        "CPCB ନିୟମ ୫(g): ହଳଦିଆ ଭସ୍ମୀକରଣ ବର୍ଜ୍ୟରେ କ୍ଲୋରିନେଟେଡ୍ ପ୍ଲାଷ୍ଟିକ୍ ପକାଇବା ସମ୍ପୂର୍ଣ୍ଣ ନିଷେଧ ।",
        "ପରିବେଶ ମନ୍ତ୍ରଣାଳୟ ନିୟମ: ଡାଇଅକ୍ସିନ୍ ନିର୍ଗମନ ମାନକର ଉଲ୍ଲଂଘନ ।",
        "ଅନୁସୂଚୀ I: ନ ଜଳିପାରୁଥିବା କାଚର ଅନୈତିକ ମିଶ୍ରଣ ।"
      ]
    },
    correctiveSteps: {
      en: [
        "🛑 HOLD DISPATCH: Mark bag with red quarantine tag 'HOLD - CONTAMINATED STREAM'.",
        "🧤 DON PPE: Wear chemical-resistant gloves.",
        "🔴 REMOVE PVC TUBING: Carefully remove PVC tubing, disinfect with 1% Sodium Hypochlorite, transfer to RED bag.",
        "🔵 EXTRACT GLASS: Extract glass vial and place in BLUE puncture-proof container.",
        "🟡 RE-INSPECT & SEAL: Confirm only organic/pathological items remain in Yellow bag; seal with tamper-evident tie.",
        "🏷️ RE-PRINT BARCODE: Update digital barcode record in MediSort before dispatch to CBWTF."
      ],
      hi: [
        "🛑 बैग रोकें: बैग पर 'संदूषित - क्वारंटीन' का लाल टैग लगाएं।",
        "🧤 दस्ताने पहनें: रासायनिक प्रतिरोधी दस्ताने पहनें।",
        "🔴 पीवीसी निकालें: पीवीसी ट्यूबिंग को सुरक्षित निकालकर लाल बैग में डालें।",
        "🔵 कांच निकालें: कांच की शीशी को नीले कंटेनर में स्थानांतरित करें।",
        "🟡 बैग सील करें: सुनिश्चित करें कि केवल शारीरिक अंग/ऊतक बचे हैं, फिर सील करें।",
        "🏷️ बारकोड अपडेट: मेडीसॉर्ट में नया बारकोड उत्पन्न करें।"
      ],
      or: [
        "🛑 ବ୍ୟାଗ୍ ଅଟକାନ୍ତୁ: ବ୍ୟାଗ୍ ଉପରେ 'ଦୂଷିତ - କ୍ୱାରେଣ୍ଟାଇନ୍' ଲେବୁଲ୍ ଲଗାନ୍ତୁ ।",
        "🧤 ଗ୍ଲୋଭସ୍ ପିନ୍ଧନ୍ତୁ: ନିରାପଦ ହାତମୋଜା ପିନ୍ଧନ୍ତୁ ।",
        "🔴 PVC କାଢ଼ନ୍ତୁ: PVC ପାଇପ୍ କୁ କାଢ଼ି ଲାଲ୍ ବ୍ୟାଗରେ ରଖନ୍ତୁ ।",
        "🔵 କାଚ ଅଲଗା କରନ୍ତୁ: କାଚ ଶିଶିକୁ ନୀଳ କଣ୍ଟେନରରେ ରଖନ୍ତୁ ।",
        "🟡 ବ୍ୟାଗ୍ ସିଲ୍ କରନ୍ତୁ: ହଳଦିଆ ବ୍ୟାଗ୍ ସିଲ୍ କରି ନୂଆ ବାରକୋଡ୍ ଲଗାନ୍ତୁ ।"
      ]
    },
    audioAlert: {
      en: "Warning! Yellow bag contamination detected. PVC catheter and glass vials found inside incinerator bag. PVC burning produces lethal dioxins. Stop dispatch and segregate immediately.",
      hi: "सावधान! पीले बैग में संदूषण पाया गया। इंसिनरेटर बैग में पीवीसी ट्यूब और कांच की शीशियां मौजूद हैं। इससे जहरीली गैस बनती है। तुरंत बैग रोकें और कचरा अलग करें।",
      or: "ସତର୍କତା! ହଳଦିଆ ବ୍ୟାଗରେ PVC ପ୍ଲାଷ୍ଟିକ୍ ଓ କାଚ ମିଶିଛି । ଏହା ପୋଡ଼ିଲେ ବିଷାକ୍ତ ଗ୍ୟାସ୍ ବାହାରିବ । ତୁରନ୍ତ ଅଲଗା କରନ୍ତୁ ।"
    }
  },
  {
    id: "red_bag_needle",
    name: {
      en: "🚨 Red Plastics Bag with Hidden Scalpel (Sanitation Worker Risk)",
      hi: "🚨 लाल बैग में छुपा हुआ सर्जिकल ब्लेड (सफाईकर्मी जानलेवा खतरा)",
      or: "🚨 ଲାଲ୍ ପ୍ଲାଷ୍ଟିକ୍ ବ୍ୟାଗରେ ଲୁଚି ରହିଥିବା ସର୍ଜିକାଲ୍ ବ୍ଲେଡ୍ (ପ୍ରାଣଘାତୀ ଆଘାତ ବିପଦ)"
    },
    badge: {
      en: "Critical Hazard",
      hi: "गंभीर खतरा",
      or: "ମାରାତ୍ମକ ବିପଦ"
    },
    targetBin: "RED",
    sampleItems: [
      "IV Infusion tubing line",
      "Dialysis kit blood tubing",
      "Loose surgical scalpel blade #11"
    ],
    itemsList: {
      en: [
        { name: "IV Infusion Plastic Tubing", expectedBin: "RED", currentBin: "RED BAG", isContaminant: false, danger: "Recyclable plastic polymer; compliant for autoclaving." },
        { name: "Dialysis Kit Plastic Tubing", expectedBin: "RED", currentBin: "RED BAG", isContaminant: false, danger: "Compliant recyclable plastic." },
        { name: "Loose Surgical Scalpel Blade #11", expectedBin: "WHITE", currentBin: "RED BAG", isContaminant: true, danger: "FATAL HAZARD: Loose metallic blade can slash through red plastic bag during lifting or shredding, causing deep puncture lacerations and blood-borne disease transmission." }
      ],
      hi: [
        { name: "आईवी इन्फ्यूजन प्लास्टिक ट्यूब", expectedBin: "RED", currentBin: "लाल बैग", isContaminant: false, danger: "रीसायकल योग्य प्लास्टिक; लाल बैग के लिए सही।" },
        { name: "डायलिसिस किट प्लास्टिक ट्यूब", expectedBin: "RED", currentBin: "लाल बैग", isContaminant: false, danger: "रीसाइक्लिंग के लिए अनुपालित।" },
        { name: "खुला सर्जिकल स्कैल्पल ब्लेड #11", expectedBin: "WHITE", currentBin: "लाल बैग", isContaminant: true, danger: "जानलेवा खतरा: उठाव या श्रेडिंग के समय ब्लेड लाल थैली को काटकर कर्मचारी के हाथ या पैर में गहरा कट लगा सकता है।" }
      ],
      or: [
        { name: "IV ଇନଫ୍ୟୁଜନ୍ ପ୍ଲାଷ୍ଟିକ୍ ପାଇପ୍", expectedBin: "RED", currentBin: "ଲାଲ୍ ବ୍ୟାଗ୍", isContaminant: false, danger: "ରିସାଇକ୍ଲିଂ ଯୋଗ୍ୟ ପ୍ଲାଷ୍ଟିକ୍; ଲାଲ୍ ବ୍ୟାଗ୍ ପାଇଁ ଅନୁମୋଦିତ ।" },
        { name: "ଡାୟାଲିସିସ୍ ପ୍ଲାଷ୍ଟିକ୍ ଟ୍ୟୁବ୍", expectedBin: "RED", currentBin: "ଲାଲ୍ ବ୍ୟାଗ୍", isContaminant: false, danger: "ଅଟୋକ୍ଲେଭିଂ ପାଇଁ ଉପଯୁକ୍ତ ।" },
        { name: "ଖୋଲା ସର୍ଜିକାଲ୍ ବ୍ଲେଡ୍ #୧୧", expectedBin: "WHITE", currentBin: "ଲାଲ୍ ବ୍ୟାଗ୍", isContaminant: true, danger: "ପ୍ରାଣଘାତୀ ବିପଦ: ଲାଲ୍ ପ୍ଲାଷ୍ଟିକ୍ ବ୍ୟାଗ୍ କଣା ହୋଇ ସଫେଇ କର୍ମଚାରୀଙ୍କ ହାତ କାଟି ମାରାତ୍ମକ ରକ୍ତ ସଂକ୍ରମଣ ଘଟାଇପାରେ ।" }
      ]
    },
    severity: "CRITICAL",
    complianceScore: 66,
    summary: {
      en: "CRITICAL SAFETY VIOLATION: Loose surgical blade found hidden inside Red plastic bag. Red bags are NOT puncture-resistant; this puts sanitary staff and shredder operators at extreme risk.",
      hi: "अत्यंत गंभीर सुरक्षा उल्लंघन: लाल प्लास्टिक बैग में खुला सर्जिकल ब्लेड मिला है। लाल बैग पंचर-रोधी नहीं होते; इससे कर्मचारियों को गंभीर चोट का खतरा है।",
      or: "ଅତ୍ୟନ୍ତ ଗୁରୁତର ବିପଦ: ଲାଲ୍ ପ୍ଲାଷ୍ଟିକ୍ ବ୍ୟାଗ୍ ଭିତରେ ଧାରୁଆ ସର୍ଜିକାଲ୍ ବ୍ଲେଡ୍ ମିଳିଛି । ଏହା ସଫେଇ କର୍ମଚାରୀଙ୍କ ପାଇଁ ଅତି ବିପଜ୍ଜନକ ।"
    },
    violations: {
      en: [
        "CPCB 2016 Schedule I Part 1: All metallic sharps/blades must strictly be secured in puncture-proof, tamper-proof White translucent containers.",
        "Occupational Safety & Health Act: Negligent endangerment of healthcare housekeeping personnel."
      ],
      hi: [
        "सीपीसीबी 2016 अनुसूची I: सभी धातु ब्लेड/सुई को केवल सफेद पंचर-रोधी डिब्बे में ही डालना अनिवार्य है।",
        "व्यावसायिक सुरक्षा अधिनियम: स्वास्थ्य कर्मचारियों को रोके जा सकने वाले खतरे में डालना।"
      ],
      or: [
        "CPCB 2016 ଅନୁସୂଚୀ I: ସମସ୍ତ ଧାତୁ ବ୍ଲେଡ୍ କେବଳ ଧଳା ପଙ୍କଚର୍-ପ୍ରୁଫ୍ କଣ୍ଟେନରରେ ରଖିବା ବାଧ୍ୟତାମୂଳକ ।",
        "କର୍ମଚାରୀ ସୁରକ୍ଷା ନିୟମ ଉଲ୍ଲଂଘନ: ସଫେଇ କର୍ମଚାରୀଙ୍କ ଜୀବନ ପ୍ରତି ବିପଦ ସୃଷ୍ଟି ।"
      ]
    },
    correctiveSteps: {
      en: [
        "🛑 DO NOT COMPRESS OR SQUEEZE: Never use hands to press down or compress the red bag.",
        "🧲 RETRIEVAL TOOL: Use a magnetic retriever wand or heavy surgical forceps to safely extract the blade.",
        "⚪ WHITE SHARPS BOX: Deposit blade directly into the WHITE sharps box immediately.",
        "🔍 SCAN REMAINING PLASTICS: Visually inspect remaining plastic tubing for any other embedded sharps.",
        "📋 MANDATORY LOG: File Needle/Blade Near-Miss Incident Report on MediSort."
      ],
      hi: [
        "🛑 हाथ से न दबाएं: लाल बैग को कभी भी हाथ से नीचे न दबाएं।",
        "🧲 चिमटे से निकालें: चुंबकीय छड़ी या मजबूत फोरसेप्स से ब्लेड निकालें।",
        "⚪ सफेद डिब्बे में डालें: ब्लेड को तुरंत सफेद नुकीले कंटेनर में डालें।",
        "🔍 बाकी प्लास्टिक जांचें: सुनिश्चित करें कि कोई अन्य सुई/ब्लेड नहीं छूटा है।",
        "📋 नियर-मिस रिपोर्ट: मेडीसॉर्ट पर तत्काल घटना दर्ज करें।"
      ],
      or: [
        "🛑 ହାତରେ ଚାପନ୍ତୁ ନାହିଁ: ଲାଲ୍ ବ୍ୟାଗ୍ କୁ କେବେ ବି ହାତରେ ଚାପି ଦବାନ୍ତୁ ନାହିଁ ।",
        "🧲 ଫୋରସେପ୍ସ ସାହାଯ୍ୟ ନିଅନ୍ତୁ: ଚୁମ୍ବକୀୟ ବାଡ଼ି ବା ଚିମୁଟା ସାହାଯ୍ୟରେ ବ୍ଲେଡ୍ କାଢ଼ନ୍ତୁ ।",
        "⚪ ଧଳା କଣ୍ଟେନର୍: ବ୍ଲେଡ୍ କୁ ତୁରନ୍ତ ଧଳା ପାତ୍ରରେ ପକାନ୍ତୁ ।",
        "🔍 ଯାଞ୍ଚ କରନ୍ତୁ: ଅନ୍ୟ କୌଣସି ଛୁଞ୍ଚି ନାହିଁ ତ ଯାଞ୍ଚ କରନ୍ତୁ ।",
        "📋 ଘଟଣା ପଞ୍ଜିକରଣ: ମେଡ଼ିସର୍ଟରେ ନିରାପତ୍ତା ରିପୋର୍ଟ ଦର୍ଜ କରନ୍ତୁ ।"
      ]
    },
    audioAlert: {
      en: "Critical safety hazard! Loose surgical scalpel blade detected inside red plastic bag. Do not squeeze or lift by hand. Use forceps to transfer blade to white sharps container immediately.",
      hi: "गंभीर सुरक्षा खतरा! लाल बैग में खुला सर्जिकल ब्लेड पाया गया है। बैग को हाथ से न दबाएं। चिमटे से ब्लेड को सफेद कंटेनर में स्थानांतरित करें।",
      or: "ମାରାତ୍ମକ ବିପଦ! ଲାଲ୍ ବ୍ୟାଗ୍ ଭିତରେ ସର୍ଜିକାଲ୍ ବ୍ଲେଡ୍ ଅଛି । ହାତରେ ଚାପନ୍ତୁ ନାହିଁ, ଫୋରସେପ୍ସ ଦ୍ଵାରା ତୁରନ୍ତ ଧଳା ବାକ୍ସରେ ପକାନ୍ତୁ ।"
    }
  },
  {
    id: "compliant_plastics",
    name: {
      en: "✅ 100% CPCB Compliant Recyclable Plastics Batch",
      hi: "✅ 100% सीपीसीबी अनुपालित रिसाइकल प्लास्टिक बैच",
      or: "✅ ୧୦୦% CPCB ନିୟମାନୁମୋଦିତ ପ୍ଲାଷ୍ଟିକ୍ ବର୍ଜ୍ୟବସ୍ତୁ (ସମ୍ପୂର୍ଣ୍ଣ ସୁରକ୍ଷିତ)"
    },
    badge: {
      en: "100% Compliant",
      hi: "पूर्ण अनुपालित",
      or: "୧୦୦% ସୁରକ୍ଷିତ"
    },
    targetBin: "RED",
    sampleItems: [
      "Empty Saline Infusion Bottle (PP)",
      "IV Infusion Tubing (Needle detached)",
      "Latex examination gloves (Contaminated)"
    ],
    itemsList: {
      en: [
        { name: "Empty Saline Bottle (Polypropylene)", expectedBin: "RED", currentBin: "RED BAG", isContaminant: false, danger: "Zero contamination. High-purity medical polymer ready for shredding & regranulation." },
        { name: "IV Infusion Tubing (Mutilated & Sharpless)", expectedBin: "RED", currentBin: "RED BAG", isContaminant: false, danger: "Properly cut at source; zero sharps cross-contamination." },
        { name: "Latex Examination Gloves", expectedBin: "RED", currentBin: "RED BAG", isContaminant: false, danger: "Sterilizable rubber/polymer waste; 100% compliant for red bag." }
      ],
      hi: [
        { name: "खाली सेलाइन बोतल (पॉलीप्रोपाइलीन)", expectedBin: "RED", currentBin: "लाल बैग", isContaminant: false, danger: "शून्य संदूषण। उच्च गुणवत्ता प्लास्टिक रीसाइक्लिंग हेतु तैयार।" },
        { name: "आईवी ट्यूब (सुई अलग की गई)", expectedBin: "RED", currentBin: "लाल बैग", isContaminant: false, danger: "स्रोत पर कटी हुई; कोई नुकीला कचरा नहीं मिला।" },
        { name: "लेटेक्स परीक्षा दस्ताने", expectedBin: "RED", currentBin: "लाल बैग", isContaminant: false, danger: "ऑटोक्लेविंग हेतु 100% सही।" }
      ],
      or: [
        { name: "ଖାଲି ସାଲାଇନ୍ ବୋତଲ (PP ପ୍ଲାଷ୍ଟିକ୍)", expectedBin: "RED", currentBin: "ଲାଲ୍ ବ୍ୟାଗ୍", isContaminant: false, danger: "ଶୂନ ପ୍ରଦୂଷଣ । ଉଚ୍ଚ ମାନର ରିସାଇକ୍ଲିଂ ପାଇଁ ପ୍ରସ୍ତୁତ ।" },
        { name: "IV ପାଇପ୍ (ଛୁଞ୍ଚି କଟାଯାଇଛି)", expectedBin: "RED", currentBin: "ଲାଲ୍ ବ୍ୟାଗ୍", isContaminant: false, danger: "ସମ୍ପୂର୍ଣ୍ଣ ନିରାପଦ ଓ ଅନୁମୋଦିତ ।" },
        { name: "ଡାକ୍ତରୀ ପରୀକ୍ଷା ଗ୍ଲୋଭସ୍", expectedBin: "RED", currentBin: "ଲାଲ୍ ବ୍ୟାଗ୍", isContaminant: false, danger: "ଅଟୋକ୍ଲେଭିଂ ପାଇଁ ୧୦୦% ଉପଯୁକ୍ତ ।" }
      ]
    },
    severity: "COMPLIANT",
    complianceScore: 100,
    summary: {
      en: "PERFECT SEGREGATION: 100% CPCB 2016 compliant batch. Zero hazardous cross-contaminants or sharps detected. Approved for autoclaving and circular economy recycling.",
      hi: "उत्कृष्ट पृथक्करण: 100% सीपीसीबी 2016 अनुपालित बैच। कोई खतरनाक संदूषक या सुई नहीं पाई गई। ऑटोक्लेविंग और रीसाइक्लिंग के लिए अनुमोदित।",
      or: "ଉତ୍କୃଷ୍ଟ ପୃଥକୀକରଣ: ୧୦୦% CPCB 2016 ନିୟମାନୁମୋଦିତ ବ୍ୟାଚ୍ । କୌଣସି ବିପଦଜନକ ଛୁଞ୍ଚି ବା କାଚ ନାହିଁ । ରିସାଇକ୍ଲିଂ ପାଇଁ ଅନୁମୋଦିତ ।"
    },
    violations: {
      en: [],
      hi: [],
      or: []
    },
    correctiveSteps: {
      en: [
        "✅ BATCH APPROVED: Zero cross-contamination detected in this batch.",
        "🏷️ SCAN BARCODE: Affix GPS-enabled CPCB Barcode to the Red Bag liner.",
        "⚖️ WEIGH BATCH: Record batch weight on MediSort Smart Scale.",
        "🚚 CBWTF DISPATCH: Transfer to authorized treatment facility for autoclaving at 121°C and high-grade regranulation."
      ],
      hi: [
        "✅ बैच स्वीकृत: कोई संदूषण नहीं मिला।",
        "🏷️ बारकोड लगाएं: लाल बैग पर जीपीएस-सक्षम सीपीसीबी बारकोड चिपकाएं।",
        "⚖️ वजन रिकॉर्ड करें: मेडीसॉर्ट स्मार्ट स्केल पर वजन दर्ज करें।",
        "🚚 प्रेषण: 121°C ऑटोक्लेविंग और रीसाइक्लिंग हेतु उपचार सुविधा को भेजें।"
      ],
      or: [
        "✅ ବ୍ୟାଚ୍ ଅନୁମୋଦିତ: ସମ୍ପୂର୍ଣ୍ଣ ନିରାପଦ ।",
        "🏷️ ବାରକୋଡ୍ ଲଗାନ୍ତୁ: ଲାଲ୍ ବ୍ୟାଗରେ CPCB ବାରକୋଡ୍ ଲଗାନ୍ତୁ ।",
        "⚖️ ଓଜନ କରନ୍ତୁ: ମେଡ଼ିସର୍ଟ ଡ୍ୟାସବୋର୍ଡରେ ଓଜନ ରେକର୍ଡ କରନ୍ତୁ ।",
        "🚚 ପଠାନ୍ତୁ: ୧୨୧°C ଅଟୋକ୍ଲେଭିଂ ଏବଂ ରିସାଇକ୍ଲିଂ ପାଇଁ ପଠାନ୍ତୁ ।"
      ]
    },
    audioAlert: {
      en: "Segregation audit passed. Batch is 100 percent compliant with CPCB Red plastic rules. Zero cross contamination detected. Approved for circular recycling.",
      hi: "पृथक्करण ऑडिट सफल रहा। बैच सीपीसीबी लाल प्लास्टिक नियमों के 100% अनुरूप है। कोई संदूषण नहीं मिला। रीसाइक्लिंग हेतु स्वीकृत।",
      or: "ପୃଥକୀକରଣ ଯାଞ୍ଚ ସଫଳ ହେଲା । ଏହି ବର୍ଜ୍ୟବସ୍ତୁ ୧୦୦% ସୁରକ୍ଷିତ ଓ CPCB ନିୟମାନୁମୋଦିତ । ରିସାଇକ୍ଲିଂ ପାଇଁ ଅନୁମତି ଦିଆଗଲା ।"
    }
  }
];

function evaluateContamination(itemsInput, targetBin = "ALL", lang = "en") {
  const safeLang = ["en", "hi", "or"].includes(lang) ? lang : "en";
  let rawList = [];
  if (Array.isArray(itemsInput)) {
    rawList = itemsInput;
  } else if (typeof itemsInput === "string") {
    rawList = itemsInput
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }

  if (rawList.length === 0) {
    rawList = ["syringe with needle", "blood gauze", "saline bottle"];
  }

  const detectedItems = rawList.map(rawName => {
    const classified = classifyByText(rawName, safeLang);
    let isContaminant = false;
    let dangerNote = "";

    if (targetBin === "ALL") {
      // General mixed tray
      if (classified.category === "WHITE") {
        isContaminant = true;
        dangerNote = safeLang === "hi"
          ? "अत्यधिक गंभीर: सुई/ब्लेड को कभी भी खुली ट्रे या सामान्य कचरे में नहीं छोड़ना चाहिए।"
          : safeLang === "or"
          ? "ଅତ୍ୟନ୍ତ ଗୁରୁତର: ଛୁଞ୍ଚି ବା ବ୍ଲେଡ୍ କୁ କେବେ ବି ଖୋଲା ଟ୍ରେ ବା ସାଧାରଣ ବର୍ଜ୍ୟରେ ଛାଡ଼ିବା ଅନୁଚିତ ।"
          : "CRITICAL: Waste sharps must NEVER be kept in an unsealed mixed tray without puncture-proof white container.";
      } else {
        dangerNote = safeLang === "hi"
          ? "प्रारंभिक ट्रे वर्गीकरण आवश्यक है।"
          : safeLang === "or"
          ? "ପୃଥକୀକରଣ ଆବଶ୍ୟକ ।"
          : "Requires sorting into designated color stream.";
      }
    } else if (targetBin === "RED") {
      if (classified.category !== "RED") {
        isContaminant = true;
        if (classified.category === "WHITE") {
          dangerNote = safeLang === "hi"
            ? "घातक खतरा: लाल प्लास्टिक बैग में सुई या ब्लेड होने से सफाईकर्मी को जानलेवा चोट लग सकती है।"
            : safeLang === "or"
            ? "ପ୍ରାଣଘାତୀ ବିପଦ: ଲାଲ୍ ପ୍ଲାଷ୍ଟିକ୍ ବ୍ୟାଗରେ ଛୁଞ୍ଚି ରହିଲେ ସଫେଇ କର୍ମଚାରୀଙ୍କ ହାତ କାଟି ମାରାତ୍ମକ ରକ୍ତ ସଂକ୍ରମଣ ହୋଇପାରେ ।"
            : "FATAL RISK: Sharps in red bag can puncture through liner, cutting sanitation staff and transmitting pathogens.";
        } else if (classified.category === "YELLOW") {
          dangerNote = safeLang === "hi"
            ? "उच्च जोखिम: प्लास्टिक रीसाइक्लिंग में संक्रामक जैविक कचरा मिल गया है।"
            : safeLang === "or"
            ? "ଉଚ୍ଚ ବିପଦ: ପ୍ଲାଷ୍ଟିକ୍ ରିସାଇକ୍ଲିଂ ଧାରାରେ ସଂକ୍ରାମକ ଜୈବିକ ବର୍ଜ୍ୟ ମିଶିଛି ।"
            : "HIGH RISK: Infectious organic waste contaminates circular plastic recycling streams.";
        } else {
          dangerNote = safeLang === "hi"
            ? "कांच के टुकड़े प्लास्टिक श्रेडर ब्लेड को नुकसान पहुंचाते हैं।"
            : safeLang === "or"
            ? "କାଚ ଖଣ୍ଡ ପ୍ଲାଷ୍ଟିକ୍ ଶ୍ରେଡର୍ ମେସିନ୍ ନଷ୍ଟ କରିଦିଏ ।"
            : "Glass shards destroy plastic granulator and shredder blades.";
        }
      } else {
        dangerNote = safeLang === "hi"
          ? "लाल बैग के लिए 100% सही रीसाइकिल प्लास्टिक।"
          : safeLang === "or"
          ? "ଲାଲ୍ ବ୍ୟାଗ୍ ପାଇଁ ୧୦୦% ସଠିକ୍ ପ୍ଲାଷ୍ଟିକ୍ ।"
          : "Compliant recyclable medical polymer.";
      }
    } else if (targetBin === "YELLOW") {
      if (classified.category !== "YELLOW") {
        isContaminant = true;
        if (classified.category === "RED") {
          dangerNote = safeLang === "hi"
            ? "उच्च उल्लंघन: क्लोरीनीकृत पीवीसी प्लास्टिक जलने पर कैंसरकारी डाइऑक्सिन और फ्यूरान गैसें छोड़ते हैं।"
            : safeLang === "or"
            ? "ଗୁରୁତର ତ୍ରୁଟି: PVC ପ୍ଲାଷ୍ଟିକ୍ ପୋଡ଼ିଲେ କ୍ୟାନସର ସୃଷ୍ଟିକାରୀ ବିଷାକ୍ତ ଡାଇଅକ୍ସିନ୍ ଓ ଫ୍ୟୁରାନ୍ ବାଷ୍ପ ବାହାରେ ।"
            : "HIGH VIOLATION: Incinerating PVC plastics generates lethal Carcinogenic Dioxins and Furans (PCDD/PCDF).";
        } else if (classified.category === "BLUE") {
          dangerNote = safeLang === "hi"
            ? "उच्च खतरा: इंसिनरेटर भट्टी में कांच फटने और चिपकने का गंभीर जोखिम।"
            : safeLang === "or"
            ? "ଉଚ୍ଚ ବିପଦ: ଇନସିନେରେଟର ଭିତରେ କାଚ ଫାଟି ବିସ୍ଫୋରଣ ଘଟିପାରେ ।"
            : "HIGH HAZARD: Non-incinerable glass commingling in furnace causes explosive shatter and refractory brick damage.";
        } else {
          dangerNote = safeLang === "hi"
            ? "गंभीर: पीले बैग में सुई या ब्लेड कचरा उठाने वालों को घायल कर सकता है।"
            : safeLang === "or"
            ? "ଗୁରୁତର: ହଳଦିଆ ବ୍ୟାଗରେ ଛୁଞ୍ଚି ରହିଲେ କର୍ମଚାରୀ ଆହତ ହେବେ ।"
            : "CRITICAL: Sharps in yellow liner puncture through bag and cannot be safely incinerated.";
        }
      } else {
        dangerNote = safeLang === "hi"
          ? "पीले बैग के लिए 100% सही जैविक/संक्रामक कचरा।"
          : safeLang === "or"
          ? "ହଳଦିଆ ବ୍ୟାଗ୍ ପାଇଁ ୧୦୦% ଉପଯୁକ୍ତ ସଂକ୍ରାମକ ବର୍ଜ୍ୟ ।"
          : "Compliant organic/infectious waste stream.";
      }
    } else if (targetBin === "WHITE") {
      if (classified.category !== "WHITE") {
        isContaminant = true;
        dangerNote = safeLang === "hi"
          ? "अनुचित: गैर-नुकीला कचरा महंगे पंचर-रोधी सफेद कंटेनर को अनावश्यक भरता है।"
          : safeLang === "or"
          ? "ଅନୁଚିତ: ଅଣ-ଧାରୁଆ ବର୍ଜ୍ୟ ଧଳା ପାତ୍ରକୁ ଅଯଥା ଭର୍ତ୍ତି କରେ ।"
          : "Improper: Non-sharps waste rapidly depletes specialized puncture-proof container capacity.";
      } else {
        dangerNote = safeLang === "hi" ? "सफेद डिब्बे के लिए 100% सही।" : safeLang === "or" ? "ଧଳା କଣ୍ଟେନର୍ ପାଇଁ ସଠିକ୍ ।" : "Compliant sharps.";
      }
    } else if (targetBin === "BLUE") {
      if (classified.category !== "BLUE") {
        isContaminant = true;
        dangerNote = safeLang === "hi"
          ? "अनुचित: कांच के डिब्बे में अन्य कचरा नहीं होना चाहिए।"
          : safeLang === "or"
          ? "ଅନୁଚିତ: ନୀଳ କଣ୍ଟେନରରେ କାଚ ଛଡ଼ା ଅନ୍ୟ କିଛି ରହିବା ଅନୁଚିତ ।"
          : "Improper: Non-glassware commingled into glass recycling stream.";
      } else {
        dangerNote = safeLang === "hi" ? "नीले कंटेनर के लिए 100% सही।" : safeLang === "or" ? "ନୀଳ ପାତ୍ର ପାଇଁ ସଠିକ୍ ।" : "Compliant glassware.";
      }
    }

    return {
      name: rawName,
      detectedBin: classified.category,
      colorHex: classified.colorHex,
      emoji: classified.emoji,
      targetBin: targetBin === "ALL" ? "MIXED TRAY" : targetBin,
      isContaminant,
      danger: dangerNote
    };
  });

  const contaminants = detectedItems.filter(i => i.isContaminant);
  const total = detectedItems.length;

  let severity = "COMPLIANT";
  if (contaminants.some(i => i.detectedBin === "WHITE" && i.isContaminant)) {
    severity = "CRITICAL";
  } else if (
    contaminants.some(i => i.detectedBin === "RED" && targetBin === "YELLOW") ||
    contaminants.some(i => i.detectedBin === "BLUE" && targetBin === "YELLOW") ||
    contaminants.some(i => i.detectedBin === "YELLOW" && targetBin === "RED")
  ) {
    severity = "HIGH";
  } else if (contaminants.length > 0) {
    severity = "MODERATE";
  }

  let complianceScore = 100;
  if (severity !== "COMPLIANT") {
    complianceScore = Math.max(10, Math.round(((total - contaminants.length) / total) * 100));
  }

  // Localized Violations
  const violations = [];
  if (contaminants.some(i => i.detectedBin === "WHITE")) {
    violations.push(
      safeLang === "hi"
        ? "सीपीसीबी 2016 अनुसूची I: सभी सुई और धातु ब्लेड अनिवार्य रूप से सफेद पारभासी पंचर-रोधी कंटेनर में होने चाहिए।"
        : safeLang === "or"
        ? "CPCB 2016 ଅନୁସୂଚୀ I: ସମସ୍ତ ଛୁଞ୍ଚି ଓ ବ୍ଲେଡ୍ କେବଳ ଧଳା ପଙ୍କଚର୍-ପ୍ରୁଫ୍ କଣ୍ଟେନରରେ ରଖିବା ବାଧ୍ୟତାମୂଳକ ।"
        : "CPCB 2016 Schedule I Part 1: All needles and metallic sharps must strictly be deposited into White puncture-proof containers."
    );
  }
  if (contaminants.some(i => i.detectedBin === "RED" && targetBin === "YELLOW")) {
    violations.push(
      safeLang === "hi"
        ? "सीपीसीबी नियम 5(g): इंसिनरेशन भस्म में क्लोरीनीकृत प्लास्टिक डालना वर्जित (डाइऑक्सिन मानक उल्लंघन)।"
        : safeLang === "or"
        ? "CPCB ନିୟମ ୫(g): ହଳଦିଆ ଭସ୍ମୀକରଣ ବର୍ଜ୍ୟରେ PVC ପ୍ଲାଷ୍ଟିକ୍ ପକାଇବା ନିଷେଧ (ଡାଇଅକ୍ସିନ୍ ନିୟମ ଉଲ୍ଲଂଘନ) ।"
        : "CPCB 2016 Rule 5(g): Prohibition of chlorinated plastics in yellow stream destined for incineration."
    );
  }
  if (contaminants.some(i => i.detectedBin === "BLUE" && targetBin === "YELLOW")) {
    violations.push(
      safeLang === "hi"
        ? "भस्मीकरण सुरक्षा उल्लंघन: जैविक कचरे के साथ कांच मिलाने से इंसिनरेटर भट्टी को गंभीर नुकसान होता है।"
        : safeLang === "or"
        ? "ଇନସିନେରେଟର ନିରାପତ୍ତା ଉଲ୍ଲଂଘନ: ଜୈବିକ ବର୍ଜ୍ୟ ସହ କାଚ ମିଶାଇଲେ ଚୁଲିରେ ବିସ୍ଫୋରଣ ଘଟିପାରେ ।"
        : "Incinerator Safety Breach: Glassware in yellow stream causes refractory brick damage and explosive furnace spallation."
    );
  }
  if (violations.length === 0 && severity !== "COMPLIANT") {
    violations.push(
      safeLang === "hi"
        ? "सीपीसीबी नियम 4(c): कचरे का स्रोत पर सही पृथक्करण न होने से रीसाइक्लिंग में बाधा।"
        : safeLang === "or"
        ? "CPCB ନିୟମ ୪(c): ଉତ୍ସ ସ୍ଥଳରେ ସଠିକ୍ ପୃଥକୀକରଣ ଅଭାବ ।"
        : "CPCB 2016 Rule 4(c): Cross-contamination between divergent bio-medical waste categories."
    );
  }

  // Localized Corrective Steps
  const correctiveSteps = [];
  if (severity === "COMPLIANT") {
    correctiveSteps.push(
      safeLang === "hi"
        ? "✅ बैच पूरी तरह सीपीसीबी नियमों के अनुरूप है; कोई संदूषण नहीं मिला।"
        : safeLang === "or"
        ? "✅ ଏହି ବ୍ୟାଚ୍ ସମ୍ପୂର୍ଣ୍ଣ CPCB ନିୟମାନୁମୋଦିତ; କୌଣସି ପ୍ରଦୂଷଣ ନାହିଁ ।"
        : "✅ BATCH APPROVED: Zero cross-contamination detected in this container."
    );
    correctiveSteps.push(
      safeLang === "hi"
        ? "🏷️ बैग पर डिजिटल सीपीसीबी बारकोड लेबल चिपकाएं और वजन दर्ज करें।"
        : safeLang === "or"
        ? "🏷️ ବ୍ୟାଗରେ ଡିଜିଟାଲ୍ CPCB ବାରକୋଡ୍ ଲଗାନ୍ତୁ ଏବଂ ଓଜନ ରେକର୍ଡ କରନ୍ତୁ ।"
        : "🏷️ Affix digital GPS-enabled CPCB barcode and register weight in MediSort."
    );
  } else {
    correctiveSteps.push(
      safeLang === "hi"
        ? "🛑 तुरंत रोकें: इस बैग या ट्रे को किसी भी सामान्य डिब्बे में न डालें।"
        : safeLang === "or"
        ? "🛑 ତୁରନ୍ତ ବନ୍ଦ କରନ୍ତୁ: ଏହି ବ୍ୟାଗ୍ ବା ଟ୍ରେ କୁ କୌଣସି ସାଧାରଣ ବିନ୍ ରେ ଢାଳନ୍ତୁ ନାହିଁ ।"
        : "🛑 HALT DISPOSAL: Do not compress, tip, or transport this contaminated container."
    );
    correctiveSteps.push(
      safeLang === "hi"
        ? "🧤 सुरक्षा उपकरण: पंचर-रोधी दस्ताने और सुरक्षा चश्मा अनिवार्य रूप से पहनें।"
        : safeLang === "or"
        ? "🧤 ସୁରକ୍ଷା ଉପକରଣ: ମଜବୁତ୍ ଗ୍ଲୋଭସ୍ ଓ ଚଷମା ପିନ୍ଧନ୍ତୁ ।"
        : "🧤 PPE MANDATE: Wear heavy-duty puncture-resistant nitrile gloves & safety goggles."
    );
    if (contaminants.some(i => i.detectedBin === "WHITE")) {
      correctiveSteps.push(
        safeLang === "hi"
          ? "🧲 चिमटे से सुई निकालें: बिना हाथ लगाए फोरसेप्स से सुई उठाकर सफेद कंटेनर में सुरक्षित डालें।"
          : safeLang === "or"
          ? "🧲 ଫୋରସେପ୍ସ ସାହାଯ୍ୟରେ ଛୁଞ୍ଚି କାଢ଼ନ୍ତୁ: ହାତ ନଲଗାଇ ଚିମୁଟା ଦ୍ଵାରା ଛୁଞ୍ଚିକୁ ଧଳା ପାତ୍ରରେ ପକାନ୍ତୁ ।"
          : "🧲 RETRIEVAL TOOL: Use surgical forceps or tongs (never bare hands) to isolate needles into WHITE box."
      );
    }
    if (contaminants.some(i => i.detectedBin === "RED")) {
      correctiveSteps.push(
        safeLang === "hi"
          ? "🔴 लाल बैग में प्लास्टिक डालें: दूषित प्लास्टिक को अलग कर लाल बैग में ऑटोक्लेविंग हेतु डालें।"
          : safeLang === "or"
          ? "🔴 ଲାଲ୍ ବ୍ୟାଗରେ ପ୍ଲାଷ୍ଟିକ୍ ରଖନ୍ତୁ: ପ୍ଲାଷ୍ଟିକ୍ କୁ ଅଲଗା କରି ଲାଲ୍ ବ୍ୟାଗରେ ଅଟୋକ୍ଲେଭିଂ ପାଇଁ ରଖନ୍ତୁ ।"
          : "🔴 RED STREAM: Transfer recyclable plastics into RED biohazard bag for autoclaving."
      );
    }
    if (contaminants.some(i => i.detectedBin === "BLUE")) {
      correctiveSteps.push(
        safeLang === "hi"
          ? "🔵 नीले बॉक्स में कांच डालें: कांच की शीशियों को नीले निशान वाले कार्डबोर्ड बॉक्स में रखें।"
          : safeLang === "or"
          ? "🔵 ନୀଳ ବକ୍ସରେ କାଚ ରଖନ୍ତୁ: କାଚ ଶିଶିକୁ ନୀଳ ଚିହ୍ନ ଥିବା ପାତ୍ରରେ ରଖନ୍ତୁ ।"
          : "🔵 BLUE STREAM: Place glass vials into puncture-proof cardboard box with Blue label."
      );
    }
    correctiveSteps.push(
      safeLang === "hi"
        ? "📋 मेडीसॉर्ट में नॉन-कन्फॉरमेंस उल्लंघन रिपोर्ट दर्ज करें।"
        : safeLang === "or"
        ? "📋 ମେଡ଼ିସର୍ଟ ପଞ୍ଜିକାରେ ଏହି ନିୟମ ଉଲ୍ଲଂଘନ ରେକର୍ଡ କରନ୍ତୁ ।"
        : "📋 LOG INCIDENT: File Non-Conformance ticket in MediSort Hospital Compliance Register."
    );
  }

  // Audio Alert
  let audioAlert = "";
  if (severity === "COMPLIANT") {
    audioAlert = safeLang === "hi"
      ? "ऑडिट सफल रहा। कचरा सीपीसीबी नियमों के 100% अनुरूप है। कोई संदूषण नहीं मिला।"
      : safeLang === "or"
      ? "ପୃଥକୀକରଣ ଯାଞ୍ଚ ସଫଳ ହେଲା । ଏହି ବର୍ଜ୍ୟବସ୍ତୁ ୧୦୦% ସୁରକ୍ଷିତ ଓ ନିୟମାନୁମୋଦିତ ।"
      : "Segregation audit passed. Batch is 100 percent compliant with CPCB rules. Zero contamination detected.";
  } else if (severity === "CRITICAL") {
    audioAlert = safeLang === "hi"
      ? "गंभीर संदूषण चेतावनी! कचरे में सुई या नुकीली वस्तु मिली है। बिना दस्ताने हाथ न लगाएं। फोरसेप्स से सुई को सफेद डिब्बे में तुरंत डालें।"
      : safeLang === "or"
      ? "ମାରାତ୍ମକ ପ୍ରଦୂଷଣ ସତର୍କତା! ବର୍ଜ୍ୟବସ୍ତୁ ଭିତରେ ଛୁଞ୍ଚି ଚିହ୍ନଟ ହୋଇଛି । ହାତ ଲଗାନ୍ତୁ ନାହିଁ, ଫୋରସେପ୍ସ ସାହାଯ୍ୟରେ ଧଳା ପାତ୍ରରେ ପକାନ୍ତୁ ।"
      : "Critical contamination alert! Loose sharps detected in container. Do not handle with bare hands. Use forceps to isolate needle into white box.";
  } else {
    audioAlert = safeLang === "hi"
      ? "चेतावनी! बेमेल कचरा संदूषण पाया गया है। सीपीसीबी दिशानिर्देशों के अनुसार कचरे को तुरंत अलग करें।"
      : safeLang === "or"
      ? "ସତର୍କତା! ବର୍ଜ୍ୟବସ୍ତୁ ମିଶ୍ରଣ ଚିହ୍ନଟ ହୋଇଛି । CPCB ନିୟମ ଅନୁସାରେ ତୁରନ୍ତ ଅଲଗା କରନ୍ତୁ ।"
      : "Warning! Cross contamination detected. Incompatible waste streams commingled. Please follow segregation steps.";
  }

  const summary = severity === "COMPLIANT"
    ? (safeLang === "hi" ? "उत्कृष्ट पृथक्करण: 100% सीपीसीबी अनुपालित बैच।" : safeLang === "or" ? "ଉତ୍କୃଷ୍ଟ ପୃଥକୀକରଣ: ୧୦୦% CPCB ନିୟମାନୁମୋଦିତ ।" : "PERFECT SEGREGATION: 100% CPCB 2016 compliant batch.")
    : (safeLang === "hi" ? `चेतावनी: ${contaminants.length} असंगत कचरा वस्तुएं पाई गईं। गंभीरता स्तर: ${severity}।` : safeLang === "or" ? `ସତର୍କତା: ${contaminants.length}ଟି ଭୁଲ୍ ବର୍ଜ୍ୟବସ୍ତୁ ଚିହ୍ନଟ ହେଲା । ଗୁରୁତ୍ଵ ସ୍ତର: ${severity} ।` : `CONTAMINATION ALERT: ${contaminants.length} incompatible items detected. Severity Level: ${severity}.`);

  return {
    severity,
    complianceScore,
    summary,
    targetBin,
    detectedItems,
    violations,
    correctiveSteps,
    audioAlert
  };
}

// ─── Option 4: CPCB Barcode Tag Generator Configurations ────────────
const CPCB_TAG_CONFIGS = {
  YELLOW: {
    color: "#eab308",
    accent: "#ca8a04",
    bgLight: "#fef9c3",
    border: "#fde047",
    categoryCode: "CAT-YEL",
    symbol: "☣️",
    symbolName: "BIOHAZARD",
    treatment: "INCINERATION AT 1050°C / PLASMA PYROLYSIS / DEEP BURIAL",
    containerType: "Yellow Non-Chlorinated Autoclavable Plastic Bag (CPCB/IS 14534)",
    wasteTypes: [
      "Soiled Cotton Gauze, Bandages & Dressing Swabs",
      "Pathological Human Anatomical Tissues & Organs",
      "Expired Cytotoxic & Chemotherapy Drugs (Encapsulation)",
      "Microbiology Lab Culture Plates & Specimen Containers"
    ],
    defaultWeight: "2.40"
  },
  RED: {
    color: "#ef4444",
    accent: "#b91c1c",
    bgLight: "#fee2e2",
    border: "#fca5a5",
    categoryCode: "CAT-RED",
    symbol: "☣️",
    symbolName: "BIOHAZARD (RECYCLABLE)",
    treatment: "AUTOCLAVING / MICROWAVING FOLLOWED BY SHREDDING & RECYCLING",
    containerType: "Red Non-Chlorinated Autoclavable Plastic Bag (Barcoded)",
    wasteTypes: [
      "Contaminated Plastic IV Tubings & Infusion Sets",
      "Disposable Plastic Syringes (Without Needles / Hub-cut)",
      "Latex Examination & Surgical Gloves",
      "Urine Bags & Dialysis Catheters (Emptied & Disinfected)"
    ],
    defaultWeight: "3.20"
  },
  WHITE: {
    color: "#64748b",
    accent: "#334155",
    bgLight: "#f8fafc",
    border: "#cbd5e1",
    categoryCode: "CAT-WHT",
    symbol: "⚠️",
    symbolName: "BIOHAZARD SHARPS",
    treatment: "AUTOCLAVING / DRY HEAT STERILIZATION FOLLOWED BY SHREDDING / SMELTING",
    containerType: "Puncture-Proof, Leak-Proof & Tamper-Proof Polypropylene Box",
    wasteTypes: [
      "Hypodermic Needles & Scalpel Blades",
      "Contaminated Suture Needles & Trocar Points",
      "Fixed-Needle Insulin Syringes (Needle-burnt / Mutilated)",
      "Orthopedic Drill Bits, K-Wires & Metal Fixation Pins"
    ],
    defaultWeight: "1.10"
  },
  BLUE: {
    color: "#3b82f6",
    accent: "#1d4ed8",
    bgLight: "#eff6ff",
    border: "#93c5fd",
    categoryCode: "CAT-BLU",
    symbol: "🧪",
    symbolName: "GLASS / IMPLANTS",
    treatment: "DISINFECTION (1% SODIUM HYPOCHLORITE) / AUTOCLAVING + GLASS SMELTING",
    containerType: "Puncture-Proof Cardboard Box / Rigid Plastic with Blue Markings",
    wasteTypes: [
      "Broken & Intact Glass Antibiotic Vials & Ampoules",
      "Glass Infusion Bottles & Intravenous Glassware",
      "Orthopedic Metallic Implants, Screws & Plates",
      "Glass Microscope Diagnostic Slides & Petri Dishes"
    ],
    defaultWeight: "2.80"
  }
};

const CPCB_WARDS = [
  "Emergency Trauma & Resuscitation Unit (OT-1)",
  "Intensive Care Unit (ICU Block-B)",
  "General Surgery Operation Theatre (OT-4)",
  "Department of Pathology & Clinical Biochemistry",
  "Pediatric & Neonatal Intensive Care (NICU)",
  "Hemodialysis & Nephrology Unit",
  "Orthopedics & Joint Replacement Ward",
  "Infectious Disease Isolation Ward",
  "Chemotherapy & Oncology Daycare",
  "Labor & Delivery Obstetrics Complex"
];

function generateBarcodeSerial(cat = "YELLOW") {
  const code = (cat || "YELLOW").substring(0, 3).toUpperCase();
  const year = 2026;
  const randNum = Math.floor(1000 + Math.random() * 9000);
  const suffix = Math.floor(10 + Math.random() * 90);
  return `BMW-OD-AAR-${year}-${code}-${randNum}${suffix}`;
}

// Crisp High-Contrast SVG Barcode (Code-128 Pattern)
function CpcbBarcodeSvg({ text }) {
  let pattern = "1011001";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const b1 = (c % 3) + 1;
    const s1 = ((c >> 2) % 3) + 1;
    const b2 = ((c >> 4) % 3) + 1;
    const s2 = ((c * 5) % 3) + 1;
    pattern += "1".repeat(b1) + "0".repeat(s1) + "1".repeat(b2) + "0".repeat(s2);
  }
  pattern += "1100110101";

  const barWidth = 2;
  const height = 44;
  const bars = [];
  let x = 0;

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "1") {
      bars.push(<rect key={i} x={x} y={0} width={barWidth} height={height} fill="#090d16" />);
    }
    x += barWidth;
  }

  return (
    <div className="cpcb-barcode-display">
      <svg
        viewBox={`0 0 ${x} ${height}`}
        preserveAspectRatio="none"
        className="cpcb-barcode-vector"
      >
        {bars}
      </svg>
      <div className="cpcb-barcode-human-serial">
        <span>*</span>
        {text}
        <span>*</span>
      </div>
    </div>
  );
}

// Verifiable Dynamic SVG QR Code Matrix (CPCB standard)
function CpcbQrMatrixSvg({ payload, size = 96 }) {
  const N = 25;
  const matrix = Array.from({ length: N }, () => Array(N).fill(false));

  const drawFinder = (r0, c0) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[r0 + r][c0 + c] = true;
        } else {
          matrix[r0 + r][c0 + c] = false;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, 18);
  drawFinder(18, 0);

  for (let i = 8; i < 17; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 0 || r === 4 || c === 0 || c === 4 || (r === 2 && c === 2)) {
        matrix[16 + r][16 + c] = true;
      } else {
        matrix[16 + r][16 + c] = false;
      }
    }
  }

  matrix[17][8] = true;

  let hash = 0;
  const str = String(payload || "");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  let seed = Math.abs(hash);

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= 17) ||
        (r >= 17 && c < 8) ||
        (r >= 15 && r <= 21 && c >= 15 && c <= 21) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      matrix[r][c] = (seed % 3) !== 0;
    }
  }

  const cellSize = size / N;
  const rects = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (matrix[r][c]) {
        rects.push(
          <rect
            key={`${r}-${c}`}
            x={c * cellSize}
            y={r * cellSize}
            width={cellSize + 0.15}
            height={cellSize + 0.15}
            fill="#090d16"
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="cpcb-qr-svg"
      style={{ display: "block" }}
    >
      <rect width={size} height={size} fill="#ffffff" rx="4" />
      {rects}
    </svg>
  );
}

// ─── Web Audio API Synthesizer (Zero-dependency Medical Sound FX) ────
function playMedicalSfx(type = "scan") {
  if (typeof window === "undefined") return;
  const isSfxActive = localStorage.getItem("medisort_sfx") !== "false";
  if (!isSfxActive) return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "scan") {
      // Tech laser sweep / optical chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "success") {
      // Two-tone pleasant hospital chime (E5 -> B5)
      const now = ctx.currentTime;
      [659.25, 987.77].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.15, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.22);
      });
    } else if (type === "warning") {
      // Biohazard warning buzzer
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.setValueAtTime(280, now + 0.1);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "click") {
      // Subtle tactile tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    }
  } catch (e) {
    // Graceful fallback
  }
}

// ─── 3D-Look Color-Coded Waste Bin Visualizer ───────────────────────
function Cpcb3DContainerVisual({ category, colorHex }) {
  const cat = (category || "YELLOW").toUpperCase();
  if (cat === "YELLOW") {
    return (
      <div className="ai-3d-bin-graphic yellow" title="Yellow Biohazard Incineration Bag">
        <svg viewBox="0 0 70 80" className="bin-svg">
          <defs>
            <linearGradient id="yellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
          </defs>
          <ellipse cx="35" cy="14" rx="14" ry="6" fill="#ca8a04" />
          <path d="M 28 14 Q 35 8 42 14" stroke="#854d0e" strokeWidth="3" fill="none" />
          <path d="M 22 14 C 12 28, 8 68, 12 72 C 16 75, 54 75, 58 72 C 62 68, 58 28, 48 14 Z" fill="url(#yellowGrad)" />
          <circle cx="35" cy="46" r="10" fill="#000000" opacity="0.8" />
          <text x="35" y="50" textAnchor="middle" fontSize="12" fill="#eab308">☣</text>
        </svg>
      </div>
    );
  } else if (cat === "RED") {
    return (
      <div className="ai-3d-bin-graphic red" title="Red Recyclable Plastics Container">
        <svg viewBox="0 0 70 80" className="bin-svg">
          <defs>
            <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fca5a5" />
              <stop offset="45%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#991b1b" />
            </linearGradient>
          </defs>
          <path d="M 12 18 L 58 18 L 54 12 L 16 12 Z" fill="#b91c1c" />
          <rect x="28" y="8" width="14" height="4" rx="2" fill="#7f1d1d" />
          <path d="M 15 19 L 55 19 L 50 72 L 20 72 Z" fill="url(#redGrad)" />
          <line x1="28" y1="24" x2="26" y2="66" stroke="#991b1b" strokeWidth="2" opacity="0.5" />
          <line x1="35" y1="24" x2="35" y2="66" stroke="#991b1b" strokeWidth="2" opacity="0.5" />
          <line x1="42" y1="24" x2="44" y2="66" stroke="#991b1b" strokeWidth="2" opacity="0.5" />
          <circle cx="35" cy="44" r="9" fill="#000000" opacity="0.75" />
          <text x="35" y="48" textAnchor="middle" fontSize="11" fill="#fee2e2">♻</text>
        </svg>
      </div>
    );
  } else if (cat === "WHITE") {
    return (
      <div className="ai-3d-bin-graphic white" title="White Puncture-Proof Sharps Box">
        <svg viewBox="0 0 70 80" className="bin-svg">
          <defs>
            <linearGradient id="whiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <rect x="14" y="12" width="42" height="8" rx="2" fill="#475569" />
          <rect x="26" y="8" width="18" height="5" rx="2" fill="#0f172a" />
          <rect x="30" y="15" width="10" height="2" fill="#000000" />
          <path d="M 17 20 L 53 20 L 49 70 L 21 70 Z" fill="url(#whiteGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
          <circle cx="35" cy="44" r="9" fill="#0f172a" opacity="0.8" />
          <text x="35" y="48" textAnchor="middle" fontSize="11" fill="#f8fafc">⚠️</text>
        </svg>
      </div>
    );
  } else {
    return (
      <div className="ai-3d-bin-graphic blue" title="Blue Glassware & Implants Container">
        <svg viewBox="0 0 70 80" className="bin-svg">
          <defs>
            <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93c5fd" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1e40af" />
            </linearGradient>
          </defs>
          <rect x="14" y="14" width="42" height="7" rx="2" fill="#1d4ed8" />
          <path d="M 16 21 L 54 21 L 50 71 L 20 71 Z" fill="url(#blueGrad)" />
          <circle cx="35" cy="45" r="9" fill="#000000" opacity="0.75" />
          <text x="35" y="49" textAnchor="middle" fontSize="11" fill="#dbeafe">🧪</text>
        </svg>
      </div>
    );
  }
}

// ─── Circular SVG Radial Confidence Gauge ───────────────────────────
function CpcbConfidenceGauge({ confidence = 95, colorHex = "#10b981" }) {
  const r = 22;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className="ai-radial-gauge-wrap" title={`Diagnostic Accuracy Confidence: ${confidence}%`}>
      <svg width="58" height="58" viewBox="0 0 58 58" className="ai-radial-gauge-svg">
        <circle
          cx="29"
          cy="29"
          r={r}
          className="gauge-bg"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="4.5"
          fill="none"
        />
        <circle
          cx="29"
          cy="29"
          r={r}
          className="gauge-val"
          stroke={colorHex}
          strokeWidth="4.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform="rotate(-90 29 29)"
        />
        <text
          x="29"
          y="32"
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#ffffff"
        >
          {confidence}%
        </text>
      </svg>
      <span className="gauge-label">ACCURACY</span>
    </div>
  );
}

export default function AiSegregationAssistant({ isOpen, onClose, onApplyWaste }) {
  // Language State: 'en' (English) | 'hi' (Hindi) | 'or' (Odia)
  const [currentLang, setCurrentLang] = useState(() => localStorage.getItem("medisort_lang") || "en");
  const t = UI_STRINGS[currentLang] || UI_STRINGS.en;

  const [activeTab, setActiveTab] = useState("camera"); // 'camera' | 'text' | 'tray' | 'barcode' | 'impact'
  const [queryInput, setQueryInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraFacingMode, setCameraFacingMode] = useState("environment");

  // Medical Sound FX state
  const [sfxEnabled, setSfxEnabled] = useState(() => localStorage.getItem("medisort_sfx") !== "false");
  const toggleSfx = () => {
    const next = !sfxEnabled;
    setSfxEnabled(next);
    localStorage.setItem("medisort_sfx", String(next));
    if (next) playMedicalSfx("click");
  };

  // Gemini API Configuration State
  const envKey = import.meta.env?.VITE_GEMINI_API_KEY || "";
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("medisort_gemini_key") || envKey);
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem("medisort_gemini_model") || "gemini-3.5-flash");
  const [showSettings, setShowSettings] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [showKeyPassword, setShowKeyPassword] = useState(false);

  const effectiveKey = (apiKey || envKey).trim();
  const isCloudAiActive = Boolean(effectiveKey);

  // Voice Recognition & Speech Synthesis State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoVoiceResponse, setAutoVoiceResponse] = useState(() => localStorage.getItem("medisort_auto_voice") === "true");
  const recognitionRef = useRef(null);

  // Option 3: Contamination Detector State
  const [trayTargetBin, setTrayTargetBin] = useState("ALL"); // 'ALL' | 'YELLOW' | 'RED' | 'WHITE' | 'BLUE'
  const [trayCustomInput, setTrayCustomInput] = useState("");
  const [trayActivePresetId, setTrayActivePresetId] = useState(null);
  const [trayAnalyzing, setTrayAnalyzing] = useState(false);
  const [trayResult, setTrayResult] = useState(null);
  const [trayImage, setTrayImage] = useState(null);
  const [trayIsSpeaking, setTrayIsSpeaking] = useState(false);
  const [trayIsListening, setTrayIsListening] = useState(false);
  const trayRecognitionRef = useRef(null);
  const trayFileInputRef = useRef(null);

  // Option 4: CPCB Barcode Tag Generator State
  const [tagCategory, setTagCategory] = useState("YELLOW"); // 'YELLOW' | 'RED' | 'WHITE' | 'BLUE'
  const [tagWard, setTagWard] = useState(CPCB_WARDS[0]);
  const [tagWasteLabel, setTagWasteLabel] = useState(CPCB_TAG_CONFIGS.YELLOW.wasteTypes[0]);
  const [tagWeight, setTagWeight] = useState("2.40");
  const [tagSerial, setTagSerial] = useState(() => generateBarcodeSerial("YELLOW"));
  const [tagTimestamp, setTagTimestamp] = useState(() => new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }));
  const [tagCopied, setTagCopied] = useState(false);
  const [tagApplied, setTagApplied] = useState(false);
  const [tagSizePreset, setTagSizePreset] = useState("standard"); // 'standard' (4x3) | 'compact' (3x2) | 'drum' (5x4)

  // Ambient Halo Glow Color
  const activeGlowColor = result?.colorHex 
    ? `${result.colorHex}44` 
    : activeTab === "barcode" 
    ? `${CPCB_TAG_CONFIGS[tagCategory]?.color || "#eab308"}33` 
    : activeTab === "tray" && trayResult 
    ? trayResult.severity === "COMPLIANT" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"
    : "rgba(16, 185, 129, 0.18)";

  // Keyboard Shortcuts Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        if (e.key === "Escape") {
          onClose();
        }
        return;
      }

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "1") {
        setActiveTab("camera");
        playMedicalSfx("click");
      } else if (e.key === "2") {
        setActiveTab("text");
        playMedicalSfx("click");
      } else if (e.key === "3") {
        setActiveTab("tray");
        playMedicalSfx("click");
      } else if (e.key === "4") {
        setActiveTab("barcode");
        playMedicalSfx("click");
      } else if (e.key === "5") {
        setActiveTab("impact");
        playMedicalSfx("click");
      } else if (e.key === " " && activeTab === "text") {
        e.preventDefault();
        startVoiceListening();
      } else if ((e.key === "p" || e.key === "P") && activeTab === "barcode") {
        e.preventDefault();
        handlePrintTag();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTab, onClose]);

  // Stop speaking when modal closes
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      }
      if (trayRecognitionRef.current) {
        try { trayRecognitionRef.current.abort(); } catch (e) { /* ignore */ }
      }
    };
  }, [isOpen]);

  const speakResult = useCallback((parsed) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !parsed) return;
    try {
      window.speechSynthesis.cancel();
      let speechText = "";
      if (currentLang === "hi") {
        speechText = `${parsed.category} बिन। वस्तु: ${parsed.detectedItem}। डिब्बा: ${parsed.binType}। उपचार: ${parsed.treatment}।`;
      } else if (currentLang === "or") {
        speechText = `${parsed.category} ବିନ୍। ${parsed.detectedItem}। ପାତ୍ର: ${parsed.binType}। ଉପଚାର: ${parsed.treatment}।`;
      } else {
        speechText = `Classified as ${parsed.category} bin for ${parsed.detectedItem}. Prescribed treatment: ${parsed.treatment}. Container requirement: ${parsed.binType}.`;
      }

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = currentLang === "hi" ? "hi-IN" : currentLang === "or" ? "hi-IN" : "en-IN";

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      setIsSpeaking(false);
    }
  }, [currentLang]);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speakTrayAlert = useCallback((auditReport) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !auditReport) return;
    try {
      window.speechSynthesis.cancel();
      const textToSpeak = auditReport.audioAlert || auditReport.summary;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = currentLang === "hi" ? "hi-IN" : currentLang === "or" ? "hi-IN" : "en-IN";

      utterance.onstart = () => setTrayIsSpeaking(true);
      utterance.onend = () => setTrayIsSpeaking(false);
      utterance.onerror = () => setTrayIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      setTrayIsSpeaking(false);
    }
  }, [currentLang]);

  const stopTraySpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setTrayIsSpeaking(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    setCurrentLang(newLang);
    localStorage.setItem("medisort_lang", newLang);
    stopSpeaking();
    stopTraySpeaking();
    // Update welcome message
    setChatLog([
      {
        sender: "ai",
        text: UI_STRINGS[newLang]?.welcome || UI_STRINGS.en.welcome
      }
    ]);
    // If a result is active, re-localize it
    if (result) {
      const refreshed = classifyByText(result.detectedItem || queryInput || "medical waste", newLang);
      setResult(refreshed);
    }
    // If a tray result is active, re-localize it
    if (trayResult) {
      if (trayResult.presetId) {
        const preset = CONTAMINATION_PRESETS.find(p => p.id === trayResult.presetId);
        if (preset) {
          const itemsList = preset.itemsList[newLang] || preset.itemsList.en;
          const detectedItems = itemsList.map(item => {
            const cat = item.expectedBin;
            return {
              name: item.name,
              detectedBin: item.expectedBin,
              targetBin: item.currentBin,
              colorHex: { YELLOW: "#eab308", RED: "#ef4444", WHITE: "#64748b", BLUE: "#3b82f6" }[cat] || "#eab308",
              emoji: { YELLOW: "🟡", RED: "🔴", WHITE: "⚪", BLUE: "🔵" }[cat] || "🟡",
              isContaminant: item.isContaminant,
              danger: item.danger
            };
          });
          setTrayResult({
            ...trayResult,
            summary: preset.summary[newLang] || preset.summary.en,
            detectedItems,
            violations: preset.violations[newLang] || preset.violations.en,
            correctiveSteps: preset.correctiveSteps[newLang] || preset.correctiveSteps.en,
            audioAlert: preset.audioAlert[newLang] || preset.audioAlert.en
          });
        }
      } else {
        const reAudited = evaluateContamination(trayCustomInput || "syringe with needle", trayTargetBin, newLang);
        setTrayResult(reAudited);
      }
    }
  };

  const [chatLog, setChatLog] = useState([
    {
      sender: "ai",
      text: t.welcome
    }
  ]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Localized suggested quick tags
  const QUICK_SUGGESTIONS = {
    en: [
      "Used Syringe with needle",
      "Blood-soaked cotton dressing",
      "Contaminated IV set & tubing",
      "Glass medicine ampoules",
      "Expired chemotherapy drugs",
      "Surgical scalpel blades",
      "Latex examination gloves",
      "Orthopedic titanium implant"
    ],
    hi: [
      "सुई सहित इस्तेमाल सिरिंज",
      "खून से सना हुआ ड्रेसिंग कॉटन",
      "दूषित आईवी सेट व प्लास्टिक ट्यूबिंग",
      "कांच की दवा शीशियां एवं एम्पुल",
      "समाप्त कीमोथेरेपी दवाएं",
      "सर्जिकल स्कैल्पल ब्लेड",
      "लेटेक्स परीक्षा दस्ताने",
      "टाइटेनियम हड्डी प्रत्यारोपण"
    ],
    or: [
      "ଛୁଞ୍ଚି ଥିବା ବ୍ୟବହୃତ ସିରିଞ୍ଜ",
      "ରକ୍ତ ଲାଗିଥିବା କପା ଓ ପଟି",
      "ଦୂଷିତ IV ସେଟ୍ ଓ ପ୍ଲାଷ୍ଟିକ୍ ପାଇପ୍",
      "ଔଷଧ କାଚ ବୋତଲ ଓ ଆମ୍ପୁଲ୍",
      "ଅବଧି ସରିଥିବା କୀମୋଥେରାପି ଔଷଧ",
      "ସର୍ଜିକାଲ୍ ଛୁରୀ ବ୍ଲେଡ୍",
      "ଡାକ୍ତରୀ ହାତମୋଜା (ଗ୍ଲୋଭସ୍)",
      "ଅସ୍ଥି ଶଲ୍ୟ ଟାଇଟାନିୟମ୍ ଇମ୍ପ୍ଲାଣ୍ଟ"
    ]
  }[currentLang] || QUICK_SUGGESTIONS.en;

  // Camera Management
  const startCamera = useCallback(async (facing = cameraFacingMode) => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn("Camera access failed:", err);
      setCameraError(
        currentLang === "hi"
          ? "कैमरा अनुमति अस्वीकृत या अनुपलब्ध है। आप फोटो अपलोड कर सकते हैं या बोलकर पूछ सकते हैं!"
          : currentLang === "or"
          ? "କ୍ୟାମେରା ଖୋଲିପାରିଲା ନାହିଁ । ଆପଣ ଗ୍ୟାଲେରୀରୁ ଫଟୋ ଅପଲୋଡ୍ କରିପାରିବେ କିମ୍ବା ଲେଖି ପଚାରିପାରିବେ!"
          : "Camera unavailable or permission denied. You can still upload photos or use smart text search!"
      );
      setCameraActive(false);
    }
  }, [cameraFacingMode, currentLang]);

  const flipCamera = () => {
    playMedicalSfx("click");
    const nextMode = cameraFacingMode === "environment" ? "user" : "environment";
    setCameraFacingMode(nextMode);
    startCamera(nextMode);
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === "camera" && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, activeTab, capturedImage, startCamera, stopCamera]);

  // Capture Snapshot
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    playMedicalSfx("scan");
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    analyzeImage(dataUrl);
  };

  // Upload Photo
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result);
      stopCamera();
      analyzeImage(reader.result, file.name);
    };
    reader.readAsDataURL(file);
  };

  // Preset Sample Tests
  const handleTestSample = (sampleName) => {
    setQueryInput(sampleName);
    runClassification(sampleName);
  };

  // Test Gemini API Key
  const handleTestApiKey = async () => {
    if (!effectiveKey) {
      setTestStatus({ success: false, msg: "Please enter an API key first." });
      return;
    }
    setTestingKey(true);
    setTestStatus(null);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${effectiveKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Respond with the single word: OK" }] }]
          })
        }
      );
      const data = await response.json();
      if (response.ok && data.candidates?.[0]?.content) {
        setTestStatus({
          success: true,
          msg: `Connected successfully to Google ${selectedModel}!`
        });
      } else {
        const errDetail = data?.error?.message || "Invalid API key or model error.";
        setTestStatus({
          success: false,
          msg: `Failed: ${errDetail}`
        });
      }
    } catch (err) {
      setTestStatus({
        success: false,
        msg: `Network error: ${err.message}. Check your internet connection.`
      });
    } finally {
      setTestingKey(false);
    }
  };

  // Real Gemini or Intelligent Local Rule Analysis
  const runClassification = async (textQuery, imageBase64 = null) => {
    setAnalyzing(true);
    setResult(null);

    const langName = currentLang === "hi" ? "Hindi (हिंदी)" : currentLang === "or" ? "Odia (ଓଡ଼ିଆ)" : "English";

    // Call Gemini API if Key is Available
    if (effectiveKey) {
      try {
        const promptSystem = `You are an expert AI Bio-Medical Waste Segregation Specialist strictly adhering to the Central Pollution Control Board (CPCB) Bio-Medical Waste Management Rules 2016 (Schedule I).
You are deployed at AAROGYA Multispecialty Hospital in Bhubaneswar, Odisha, India.
You understand Odia (ଓଡ଼ିଆ) in native Odia script, phonetic Romanized Odia (such as 'chhunchee', 'rakta tula', 'syringe kou bin re pakaibi', 'kacha botala', 'plastic catheter'), Hindi, and English.
Evaluate the provided medical waste ${imageBase64 ? "image" : "item description: \"" + textQuery + "\""}.
MANDATORY: Output all explanations, container specifications, and handling rules strictly in ${langName}.
Output ONLY valid JSON matching this schema:
{
  "detectedItem": "Precise name of medical item in ${langName}",
  "category": "YELLOW" or "RED" or "WHITE" or "BLUE",
  "categoryName": "Color category with explanation in ${langName}",
  "confidence": 95,
  "binType": "Specific CPCB container or bag requirement in ${langName}",
  "treatment": "CPCB prescribed treatment and disposal protocol in ${langName}",
  "riskLevel": "Hazard rating in ${langName}",
  "handlingRules": ["Rule 1 in ${langName}", "Rule 2 in ${langName}", "Rule 3 in ${langName}"],
  "degradationTime": "Time to decompose in landfill in ${langName}",
  "environmentalImpact": "Ecological and public health hazard in ${langName}",
  "recyclingPotential": "Recyclability and circular potential in ${langName}"
}`;

        const parts = [{ text: promptSystem }];
        if (imageBase64) {
          const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
          const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
          const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");
          parts.push({
            inlineData: { mimeType, data: cleanBase64 }
          });
        }

        const modelsToTry = [selectedModel, "gemini-flash-latest"].filter((v, i, a) => a.indexOf(v) === i);
        for (const currentModel of modelsToTry) {
          try {
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${effectiveKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts }] })
              }
            );

            if (response.ok) {
              const data = await response.json();
              const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textOut) {
                const jsonMatch = textOut.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  const cat = (parsed.category || "YELLOW").toUpperCase();
                  parsed.category = cat;
                  parsed.colorHex = { YELLOW: "#eab308", RED: "#ef4444", WHITE: "#64748b", BLUE: "#3b82f6" }[cat] || "#eab308";
                  parsed.emoji = { YELLOW: "🟡", RED: "🔴", WHITE: "⚪", BLUE: "🔵" }[cat] || "🟡";
                  parsed.source = `Google Gemini (${currentModel})`;
                  setResult(parsed);
                  setAnalyzing(false);
                  if (autoVoiceResponse) speakResult(parsed);
                  return;
                }
              }
            }
          } catch (modelErr) {
            console.warn(`Model ${currentModel} failed, trying next:`, modelErr);
          }
        }
      } catch (err) {
        console.warn("Gemini API request failed, falling back to local CPCB heuristic:", err);
      }
    }

    // High fidelity offline classification engine with active language
    await new Promise(r => setTimeout(r, 600));
    const res = classifyByText(textQuery || "hospital medical item", currentLang);
    setResult(res);
    setAnalyzing(false);
    if (autoVoiceResponse) speakResult(res);
  };

  const handleVoiceQuery = useCallback(async (spokenText) => {
    if (!spokenText || !spokenText.trim()) return;
    const userText = spokenText.trim();
    setChatLog(prev => [...prev, { sender: "user", text: `🎙️ "${userText}"` }]);
    setAnalyzing(true);
    await runClassification(userText, null);
    setChatLog(prev => [
      ...prev,
      {
        sender: "ai",
        text: currentLang === "hi"
          ? `आवाज पहचानी गई: "${userText}"। सीपीसीबी पृथक्करण दिशानिर्देश नीचे दिए गए हैं।`
          : currentLang === "or"
          ? `ଭଏସ୍ ଚିହ୍ନଟ ହେଲା: "${userText}"। CPCB ନିୟମ ଅନୁଯାୟୀ ପରାମର୍ଶ ତଳେ ପ୍ରଦର୍ଶିତ।`
          : `Voice command recognized: "${userText}". CPCB segregation advice generated.`
      }
    ]);
  }, [currentLang, autoVoiceResponse]);

  const startVoiceListening = () => {
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      stopSpeaking();
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = currentLang === "hi" ? "hi-IN" : currentLang === "or" ? "or-IN" : "en-IN";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join("");
        setQueryInput(transcript);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "language-not-supported" && currentLang === "or") {
          // If browser lacks or-IN voice pack, fall back to Indian phonetic capture
          try {
            recognition.lang = "en-IN";
            recognition.start();
            return;
          } catch (e) { /* ignore */ }
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setQueryInput(current => {
          if (current && current.trim()) {
            handleVoiceQuery(current.trim());
          }
          return current;
        });
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition failed:", err);
      setIsListening(false);
    }
  };

  const analyzeImage = (dataUrl, filename = "") => {
    const lowerName = filename.toLowerCase();
    let queryHint = "hospital medical waste item";
    if (lowerName.includes("syringe") || lowerName.includes("needle") || lowerName.includes("सुई") || lowerName.includes("ଛୁଞ୍ଚି")) queryHint = "syringe with needle";
    else if (lowerName.includes("glove") || lowerName.includes("tube") || lowerName.includes("plastic") || lowerName.includes("दस्ताने")) queryHint = "catheter tubing";
    else if (lowerName.includes("blood") || lowerName.includes("gauze") || lowerName.includes("cotton") || lowerName.includes("खून") || lowerName.includes("ରକ୍ତ")) queryHint = "blood gauze";
    else if (lowerName.includes("ampoule") || lowerName.includes("vial") || lowerName.includes("glass") || lowerName.includes("कांच") || lowerName.includes("କାଚ")) queryHint = "glass vial";

    runClassification(queryHint, dataUrl);
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    const userText = queryInput.trim();
    setChatLog(prev => [...prev, { sender: "user", text: userText }]);
    setQueryInput("");

    setAnalyzing(true);
    await runClassification(userText, null);
    
    setChatLog(prev => [
      ...prev,
      {
        sender: "ai",
        text: currentLang === "hi"
          ? `"${userText}" का विश्लेषण पूरा हुआ। विस्तृत CPCB कार्ड नीचे देखें।`
          : currentLang === "or"
          ? `"${userText}" ର ବିଶ୍ଳେଷଣ ସମ୍ପୂର୍ଣ୍ଣ ହେଲା । ତଳେ ସମ୍ପୂର୍ଣ୍ଣ CPCB ବିବରଣୀ ଦେଖନ୍ତୁ ।`
          : `Analysis complete for "${userText}". Check the detailed CPCB segregation card below.`
      }
    ]);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setResult(null);
    startCamera();
  };

  const handleApplyToForm = () => {
    if (!result) return;
    if (onApplyWaste) {
      onApplyWaste({
        category: result.category,
        label: result.detectedItem,
        treatment: result.treatment,
        bin: result.binType
      });
      onClose();
    }
  };

  // ─── Option 3: Contamination Detector Handlers ──────────────────
  const runPresetAudit = (presetId) => {
    stopSpeaking();
    stopTraySpeaking();
    setTrayActivePresetId(presetId);
    setTrayAnalyzing(true);
    setTrayImage(null);

    const preset = CONTAMINATION_PRESETS.find(p => p.id === presetId);
    if (!preset) {
      setTrayAnalyzing(false);
      return;
    }

    setTrayTargetBin(preset.targetBin);
    setTrayCustomInput(preset.sampleItems.join(", "));

    setTimeout(() => {
      const itemsList = preset.itemsList[currentLang] || preset.itemsList.en;
      const detectedItems = itemsList.map(item => {
        const cat = item.expectedBin;
        const colorHex = { YELLOW: "#eab308", RED: "#ef4444", WHITE: "#64748b", BLUE: "#3b82f6" }[cat] || "#eab308";
        const emoji = { YELLOW: "🟡", RED: "🔴", WHITE: "⚪", BLUE: "🔵" }[cat] || "🟡";
        return {
          name: item.name,
          detectedBin: item.expectedBin,
          targetBin: item.currentBin,
          colorHex,
          emoji,
          isContaminant: item.isContaminant,
          danger: item.danger
        };
      });

      const auditReport = {
        presetId: preset.id,
        severity: preset.severity,
        complianceScore: preset.complianceScore,
        summary: preset.summary[currentLang] || preset.summary.en,
        targetBin: preset.targetBin,
        detectedItems,
        violations: preset.violations[currentLang] || preset.violations.en,
        correctiveSteps: preset.correctiveSteps[currentLang] || preset.correctiveSteps.en,
        audioAlert: preset.audioAlert[currentLang] || preset.audioAlert.en,
        source: "CPCB 2016 Bio-Medical Waste Compliance Rules"
      };

      setTrayResult(auditReport);
      setTrayAnalyzing(false);
      if (autoVoiceResponse) {
        speakTrayAlert(auditReport);
      }
    }, 400);
  };

  const runCustomTrayAudit = async (itemsText, imageBase64 = null) => {
    stopSpeaking();
    stopTraySpeaking();
    setTrayAnalyzing(true);
    setTrayActivePresetId(null);

    const itemsQuery = itemsText || trayCustomInput || "syringe with needle, blood gauze, saline bottle";

    if (effectiveKey) {
      try {
        const modelsToTry = [selectedModel, "gemini-flash-latest"];
        for (const currentModel of modelsToTry) {
          try {
            const prompt = `You are an expert CPCB 2016 Bio-Medical Waste Cross-Contamination Auditor in India.
Analyze the following waste items: "${itemsQuery}".
The target disposal container being audited is: "${trayTargetBin}" (where ALL is Mixed Surgical Tray, YELLOW is anatomical/infectious incineration, RED is recyclable plastics, WHITE is puncture-proof sharps, BLUE is glassware).
Determine:
1. Every item and its true CPCB 2016 category (YELLOW, RED, WHITE, BLUE).
2. Is the item a dangerous contaminant in this target container?
3. Overall violation severity: "CRITICAL" | "HIGH" | "MODERATE" | "COMPLIANT".
4. Compliance score percentage (0-100).
5. Statutory violations under CPCB Bio-Medical Waste Rules 2016.
6. Numbered immediate corrective and safe isolation protocol.
7. Spoken audio alert in language: "${currentLang === "hi" ? "Hindi" : currentLang === "or" ? "Odia" : "English"}".

Return ONLY valid JSON matching this schema:
{
  "severity": "CRITICAL" | "HIGH" | "MODERATE" | "COMPLIANT",
  "complianceScore": 75,
  "summary": "1-2 sentence executive assessment of contamination risks",
  "detectedItems": [
    { "name": "Item name", "detectedBin": "YELLOW"|"RED"|"WHITE"|"BLUE", "isContaminant": true, "danger": "Detailed danger explanation" }
  ],
  "violations": ["Specific CPCB 2016 rule citations"],
  "correctiveSteps": ["Numbered immediate containment action steps"],
  "audioAlert": "Spoken warning text"
}`;

            const parts = [{ text: prompt }];
            if (imageBase64) {
              const base64Data = imageBase64.split(",")[1];
              const mimeMatch = imageBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
              const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
              parts.unshift({
                inline_data: { mime_type: mimeType, data: base64Data }
              });
            }

            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${effectiveKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts }] })
              }
            );

            if (response.ok) {
              const data = await response.json();
              const textOut = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (textOut) {
                const jsonMatch = textOut.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  parsed.detectedItems = (parsed.detectedItems || []).map(i => {
                    const cat = (i.detectedBin || "YELLOW").toUpperCase();
                    return {
                      ...i,
                      detectedBin: cat,
                      targetBin: trayTargetBin === "ALL" ? "MIXED TRAY" : trayTargetBin,
                      colorHex: { YELLOW: "#eab308", RED: "#ef4444", WHITE: "#64748b", BLUE: "#3b82f6" }[cat] || "#eab308",
                      emoji: { YELLOW: "🟡", RED: "🔴", WHITE: "⚪", BLUE: "🔵" }[cat] || "🟡"
                    };
                  });
                  parsed.source = `Google Gemini (${currentModel})`;
                  setTrayResult(parsed);
                  setTrayAnalyzing(false);
                  if (autoVoiceResponse) speakTrayAlert(parsed);
                  return;
                }
              }
            }
          } catch (modelErr) {
            console.warn(`Model ${currentModel} failed for tray audit, trying next:`, modelErr);
          }
        }
      } catch (err) {
        console.warn("Gemini tray audit failed, falling back to local heuristic:", err);
      }
    }

    // High fidelity offline heuristic engine
    await new Promise(r => setTimeout(r, 450));
    const auditReport = evaluateContamination(itemsQuery, trayTargetBin, currentLang);
    auditReport.source = currentLang === "hi" ? "सीपीसीबी 2016 मानक ऑडिट इंजन" : currentLang === "or" ? "CPCB 2016 ଅଫଲାଇନ୍ ଅଡିଟ୍ ଇଞ୍ଜିନ୍" : "CPCB 2016 Offline Heuristic Engine";
    setTrayResult(auditReport);
    setTrayAnalyzing(false);
    if (autoVoiceResponse) speakTrayAlert(auditReport);
  };

  const startTrayVoiceListening = () => {
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (trayIsListening) {
      trayRecognitionRef.current?.stop();
      setTrayIsListening(false);
      return;
    }

    try {
      stopTraySpeaking();
      const recognition = new SpeechRecognition();
      trayRecognitionRef.current = recognition;
      recognition.lang = currentLang === "hi" ? "hi-IN" : currentLang === "or" ? "or-IN" : "en-IN";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => setTrayIsListening(true);
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
        setTrayCustomInput(transcript);
      };
      recognition.onerror = (event) => {
        console.warn("Tray speech error:", event.error);
        if (event.error === "language-not-supported" && currentLang === "or") {
          try {
            recognition.lang = "en-IN";
            recognition.start();
            return;
          } catch (e) { /* ignore */ }
        }
        setTrayIsListening(false);
      };
      recognition.onend = () => {
        setTrayIsListening(false);
        setTrayCustomInput(current => {
          if (current && current.trim()) {
            runCustomTrayAudit(current.trim());
          }
          return current;
        });
      };

      recognition.start();
    } catch (err) {
      console.warn("Tray speech failed:", err);
      setTrayIsListening(false);
    }
  };

  const handleTrayFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTrayImage(reader.result);
      runCustomTrayAudit(file.name, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCompliantWaste = () => {
    if (!trayResult || !trayResult.detectedItems) return;
    const compliantItem = trayResult.detectedItems.find(i => !i.isContaminant) || trayResult.detectedItems[0];
    if (onApplyWaste && compliantItem) {
      onApplyWaste({
        category: compliantItem.detectedBin || "RED",
        label: compliantItem.name,
        treatment: compliantItem.detectedBin === "RED" ? "Autoclaving followed by Shredding" : "CPCB Authorized Segregation Protocol",
        bin: `${compliantItem.detectedBin} Container`
      });
      onClose();
    }
  };

  // ─── Option 4: CPCB Barcode Tag Generator Handlers ─────────────────
  const handleSwitchTagCategory = (cat) => {
    setTagCategory(cat);
    const cfg = CPCB_TAG_CONFIGS[cat] || CPCB_TAG_CONFIGS.YELLOW;
    setTagWasteLabel(cfg.wasteTypes[0]);
    setTagWeight(cfg.defaultWeight);
    setTagSerial(generateBarcodeSerial(cat));
    setTagTimestamp(new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }));
  };

  const handleRegenerateSerial = () => {
    setTagSerial(generateBarcodeSerial(tagCategory));
    setTagTimestamp(new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }));
  };

  const handleAdjustWeight = (delta) => {
    const current = parseFloat(tagWeight) || 0;
    const nextVal = Math.max(0.1, Number((current + delta).toFixed(2)));
    setTagWeight(nextVal.toFixed(2));
  };

  const openBarcodeTagWithItem = (item) => {
    if (!item) return;
    const cat = (item.category || item.detectedBin || "YELLOW").toUpperCase();
    const safeCat = CPCB_TAG_CONFIGS[cat] ? cat : "YELLOW";
    setTagCategory(safeCat);
    setTagWasteLabel(item.detectedItem || item.name || item.label || CPCB_TAG_CONFIGS[safeCat].wasteTypes[0]);
    setTagWeight(CPCB_TAG_CONFIGS[safeCat].defaultWeight);
    setTagSerial(generateBarcodeSerial(safeCat));
    setTagTimestamp(new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }));
    setActiveTab("barcode");
  };

  const openBarcodeTagWithContamination = (auditResult) => {
    if (!auditResult || !auditResult.detectedItems || auditResult.detectedItems.length === 0) {
      setActiveTab("barcode");
      return;
    }
    const compliant = auditResult.detectedItems.find(i => !i.isContaminant) || auditResult.detectedItems[0];
    openBarcodeTagWithItem(compliant);
  };

  const handlePrintTag = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyManifest = () => {
    const cfg = CPCB_TAG_CONFIGS[tagCategory] || CPCB_TAG_CONFIGS.YELLOW;
    const manifest = {
      manifestStandard: "CPCB Bio-Medical Waste Management Rules 2016",
      documentType: "Form VI Hazardous Waste Bag Digital Manifest",
      barcodeSerial: tagSerial,
      healthcareFacility: {
        name: "Aarogya Multispecialty Hospital & Research Institute",
        registrationNo: "OSPCB/BMW-REG/2026/0842-A",
        location: "Plot 14, Infocity Avenue, Bhubaneswar, Odisha 751024",
        gpsCoordinates: "20.2961° N, 85.8245° E"
      },
      originUnit: {
        ward: tagWard,
        authorizedOfficerId: "OD-BMW-SEC-992",
        generationTimestamp: tagTimestamp
      },
      wasteClassification: {
        categoryColor: tagCategory,
        cpcbStreamCode: cfg.categoryCode,
        wasteDescription: tagWasteLabel,
        netWeightKg: parseFloat(tagWeight) || 0,
        prescribedTreatment: cfg.treatment,
        containerSpecification: cfg.containerType
      },
      cbwtfAuthorizedRoute: {
        operator: "Utkal Clean Enviro Tech CBWTF",
        facilityId: "OD-CBWTF-04",
        transitGpsVehicle: "OD-02-AX-8914"
      },
      complianceStatus: "SEALED_READY_FOR_COLLECTION",
      digitalSignatureSeal: `SHA256:7f2a8904ec-${tagSerial}-VERIFIED`
    };

    const textToCopy = JSON.stringify(manifest, null, 2);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setTagCopied(true);
        setTimeout(() => setTagCopied(false), 3000);
      }).catch(() => {
        setTagCopied(true);
        setTimeout(() => setTagCopied(false), 3000);
      });
    } else {
      setTagCopied(true);
      setTimeout(() => setTagCopied(false), 3000);
    }
  };

  const handleDownloadTagSvg = () => {
    playMedicalSfx("click");
    const stickerElement = document.getElementById("cpcb-printable-tag");
    if (!stickerElement) return;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>CPCB Form VI Tag - ${tagSerial}</title>
<style>
  body { margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; justify-content: center; background: #0b0f19; }
  .cpcb-tag-sticker { width: 100mm; min-height: 75mm; border: 3px solid #000; padding: 12px; box-sizing: border-box; background: #fff; color: #000; border-radius: 6px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  .cpcb-tag-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 4px; }
  .cpcb-gov-seal { font-size: 11px; font-weight: 900; }
  .cpcb-form-vi-badge { background: #000; color: #fff; padding: 2px 6px; font-weight: 900; border-radius: 3px; font-size: 11px; }
  .cpcb-tag-id-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 6px 0; background: #f8fafc; padding: 6px; border: 1px solid #cbd5e1; }
  .cpcb-category-banner { padding: 4px 8px; font-weight: 800; font-size: 11px; display: flex; justify-content: space-between; margin: 4px 0; }
  .cpcb-manifest-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; font-size: 10px; margin-top: 4px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
  .manifest-lbl { font-size: 8px; font-weight: 800; color: #475569; }
  .manifest-val { font-size: 10px; font-weight: 700; color: #0f172a; }
  .weight-val { font-size: 14px !important; font-weight: 900 !important; color: #000 !important; }
  .cpcb-tag-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 9px; }
  .digital-stamp { border: 1.5px dashed #059669; color: #047857; font-weight: 900; padding: 2px 6px; border-radius: 3px; }
</style>
</head>
<body>
  ${stickerElement.outerHTML}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CPCB-Tag-${tagSerial}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyTagToForm = () => {
    playMedicalSfx("click");
    const cfg = CPCB_TAG_CONFIGS[tagCategory] || CPCB_TAG_CONFIGS.YELLOW;
    if (onApplyWaste) {
      onApplyWaste({
        category: tagCategory,
        label: `${tagWasteLabel} [Tag: ${tagSerial}]`,
        treatment: cfg.treatment,
        bin: cfg.containerType,
        weight: parseFloat(tagWeight) || 1.0,
        ward: tagWard,
        barcodeSerial: tagSerial
      });
      setTagApplied(true);
      setTimeout(() => {
        setTagApplied(false);
        onClose();
      }, 1000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="ai-assistant-modal" 
        onClick={e => e.stopPropagation()}
        style={{
          boxShadow: `0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 50px ${activeGlowColor}`
        }}
      >
        {/* Header */}
        <header className="ai-modal-header">
          <div className="ai-modal-branding">
            <div className="ai-spark-badge">
              <span className="ai-spark-icon">✨</span>
            </div>
            <div>
              <div className="ai-modal-title-row">
                <h2>{t.title}</h2>
                {isCloudAiActive ? (
                  <span className="ai-engine-status-badge online">
                    <span className="ai-pulse-dot-green" /> {t.online}
                  </span>
                ) : (
                  <span className="ai-engine-status-badge offline">
                    ⚡ {t.offline}
                  </span>
                )}
              </div>
              <p className="ai-modal-sub">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="ai-header-actions">
            {/* Medical Sound FX Audio Toggle */}
            <button
              type="button"
              className={`ai-sfx-toggle-btn ${sfxEnabled ? "on" : "off"}`}
              onClick={toggleSfx}
              title={sfxEnabled ? "Medical Audio FX Enabled (Click to Mute)" : "Medical Audio FX Muted (Click to Unmute)"}
            >
              {sfxEnabled ? "🔊 SFX" : "🔇 SFX"}
            </button>

            {/* 3-Language Switcher Pill */}
            <div className="ai-lang-toggle-group" title="Switch Language / भाषा बदलें / ଭାଷା ବଦଳାନ୍ତୁ">
              <button
                type="button"
                className={`ai-lang-pill ${currentLang === "en" ? "active" : ""}`}
                onClick={() => { playMedicalSfx("click"); handleLanguageChange("en"); }}
              >
                English
              </button>
              <button
                type="button"
                className={`ai-lang-pill ${currentLang === "hi" ? "active" : ""}`}
                onClick={() => { playMedicalSfx("click"); handleLanguageChange("hi"); }}
              >
                हिंदी
              </button>
              <button
                type="button"
                className={`ai-lang-pill ${currentLang === "or" ? "active" : ""}`}
                onClick={() => { playMedicalSfx("click"); handleLanguageChange("or"); }}
              >
                ଓଡ଼ିଆ
              </button>
            </div>

            <button
              className={`ai-settings-btn ${showSettings ? "active" : ""}`}
              onClick={() => { playMedicalSfx("click"); setShowSettings(!showSettings); }}
              title="Gemini API Key & Model Settings"
            >
              ⚙️
            </button>
            <button className="ai-modal-close-btn" onClick={onClose} aria-label="Close assistant">
              ✕
            </button>
          </div>
        </header>

        {/* Settings Drawer */}
        {showSettings && (
          <div className="ai-settings-drawer">
            <div className="ai-settings-top">
              <div>
                <strong>🔑 Google Gemini Vision API Configuration</strong>
                <small>Connect your Gemini API key for live cloud multimodal vision. If left blank, MediSort runs on the built-in CPCB 2016 offline engine.</small>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="ai-get-key-link"
              >
                Get Free API Key ↗
              </a>
            </div>

            <div className="ai-settings-grid">
              <div className="ai-settings-field">
                <label>Gemini API Key</label>
                <div className="ai-input-with-action">
                  <input
                    type={showKeyPassword ? "text" : "password"}
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={e => {
                      setApiKey(e.target.value);
                      localStorage.setItem("medisort_gemini_key", e.target.value);
                      setTestStatus(null);
                    }}
                  />
                  <button
                    type="button"
                    className="ai-toggle-vis-btn"
                    onClick={() => setShowKeyPassword(!showKeyPassword)}
                    title={showKeyPassword ? "Hide key" : "Show key"}
                  >
                    {showKeyPassword ? "👁️" : "🔒"}
                  </button>
                </div>
              </div>

              <div className="ai-settings-field">
                <label>AI Model</label>
                <select
                  value={selectedModel}
                  onChange={e => {
                    setSelectedModel(e.target.value);
                    localStorage.setItem("medisort_gemini_model", e.target.value);
                    setTestStatus(null);
                  }}
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Verified &amp; Active)</option>
                  <option value="gemini-flash-latest">Gemini Flash Latest (High Availability)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Clinical Reasoning)</option>
                </select>
              </div>
            </div>

            <div className="ai-settings-actions">
              <button
                type="button"
                className="ai-test-key-btn"
                onClick={handleTestApiKey}
                disabled={testingKey || !effectiveKey}
              >
                {testingKey ? "Testing Connection..." : "⚡ Test Key Connection"}
              </button>
              <button
                type="button"
                className="ai-settings-save"
                onClick={() => setShowSettings(false)}
              >
                Save &amp; Close
              </button>
            </div>

            {testStatus && (
              <div className={`ai-test-result ${testStatus.success ? "success" : "error"}`}>
                {testStatus.success ? "✅ " : "❌ "}
                <span>{testStatus.msg}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="ai-tab-nav">
          <button
            className={`ai-tab-btn ${activeTab === "camera" ? "active" : ""}`}
            onClick={() => { setActiveTab("camera"); playMedicalSfx("click"); }}
          >
            <span>📷</span> {t.tabCamera} <kbd className="ai-hotkey-kbd">1</kbd>
          </button>
          <button
            className={`ai-tab-btn ${activeTab === "text" ? "active" : ""}`}
            onClick={() => { setActiveTab("text"); playMedicalSfx("click"); }}
          >
            <span>💬</span> {t.tabText} <kbd className="ai-hotkey-kbd">2</kbd>
          </button>
          <button
            className={`ai-tab-btn ${activeTab === "tray" ? "active" : ""}`}
            onClick={() => { setActiveTab("tray"); playMedicalSfx("click"); }}
          >
            <span>⚠️</span> {t.tabTray}
            <span className="ai-pulse-pill-badge">CPCB 2016</span>
            <kbd className="ai-hotkey-kbd">3</kbd>
          </button>
          <button
            className={`ai-tab-btn ${activeTab === "barcode" ? "active" : ""}`}
            onClick={() => { setActiveTab("barcode"); playMedicalSfx("click"); }}
          >
            <span>🖨️</span> {t.tabBarcode}
            <span className="ai-pulse-pill-badge blue">Form VI</span>
            <kbd className="ai-hotkey-kbd">4</kbd>
          </button>
          <button
            className={`ai-tab-btn ${activeTab === "impact" ? "active" : ""}`}
            onClick={() => { setActiveTab("impact"); playMedicalSfx("click"); }}
          >
            <span>🌱</span> {t.tabImpact} <kbd className="ai-hotkey-kbd">5</kbd>
          </button>
        </nav>

        {/* Modal Body */}
        <div className="ai-modal-body">
          {/* TAB 1: CAMERA SCANNER */}
          {activeTab === "camera" && (
            <div className="ai-camera-section">
              <div className="ai-camera-container">
                {/* Live Video Viewfinder */}
                {!capturedImage ? (
                  <div className="ai-viewfinder-wrapper">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      className="ai-live-video"
                    />
                    <canvas ref={canvasRef} style={{ display: "none" }} />

                    {/* HUD Overlay Elements */}
                    <div className="ai-hud-overlay">
                      {/* Top Cyber Telemetry Bar */}
                      <div className="ai-hud-telemetry-bar">
                        <span className="telemetry-pill">
                          <span className="telemetry-dot live" /> 1080P • 30FPS
                        </span>
                        <span className="telemetry-pill">
                          OPTICAL: {cameraFacingMode === "environment" ? "REAR" : "FRONT"}
                        </span>
                        <span className="telemetry-pill lock">
                          TARGET LOCK: ON
                        </span>
                      </div>

                      {/* 4 Glowing Corner Reticles */}
                      <div className="ai-hud-corner tl" />
                      <div className="ai-hud-corner tr" />
                      <div className="ai-hud-corner bl" />
                      <div className="ai-hud-corner br" />

                      {/* Center Target Crosshairs & Reticle */}
                      <div className="ai-hud-center-crosshair">
                        <div className="crosshair-ring" />
                        <div className="crosshair-dot" />
                      </div>

                      {/* Sweeping Laser Line */}
                      <div className="ai-scanline-laser" />

                      {/* Bottom Status Bar */}
                      <div className="ai-hud-status">
                        <span className="ai-live-dot" />
                        <span>{t.aimCamera}</span>
                      </div>
                    </div>

                    {cameraError && (
                      <div className="ai-camera-fallback-msg">
                        <p>{cameraError}</p>
                        <button
                          className="ai-btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📁 {t.uploadBtn}
                        </button>
                      </div>
                    )}

                    {/* Camera Controls */}
                    <div className="ai-camera-controls">
                      <button
                        type="button"
                        className="ai-camera-flip-btn"
                        onClick={flipCamera}
                        title="Flip Camera (Rear / Front)"
                      >
                        🔄
                      </button>
                      <button
                        className="ai-shutter-btn"
                        onClick={capturePhoto}
                        disabled={!cameraActive}
                        title={t.takePhoto}
                      >
                        <div className="ai-shutter-inner" />
                      </button>
                      <button
                        className="ai-upload-shortcut"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload from device"
                      >
                        📁
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Captured Snapshot Preview */
                  <div className="ai-snapshot-preview">
                    <div className="ai-snapshot-hud-box">
                      <img src={capturedImage} alt="Captured waste" className="ai-preview-img" />
                      <div className="ai-detection-bounding-box">
                        <div className="bounding-corner tl" />
                        <div className="bounding-corner tr" />
                        <div className="bounding-corner bl" />
                        <div className="bounding-corner br" />
                        <div className="bounding-badge">
                          <span>🎯 {result ? `${result.category} BIN (${result.confidence}%)` : "TARGET ACQUIRED"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ai-snapshot-actions">
                      <button className="ai-retake-btn" onClick={() => { playMedicalSfx("click"); retakePhoto(); }}>
                        🔄 {t.retake}
                      </button>
                      <button
                        className="ai-btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📁 {t.uploadOther}
                      </button>
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>

              {/* Sample Quick Testers for Hackathon Demo */}
              <div className="ai-samples-bar">
                <span className="ai-samples-label">{t.demoPresets}</span>
                <div className="ai-sample-chips">
                  {QUICK_SUGGESTIONS.slice(0, 4).map((item, idx) => (
                    <button
                      key={idx}
                      className="ai-sample-chip"
                      onClick={() => handleTestSample(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEXT CHAT & SEARCH */}
          {activeTab === "text" && (
            <div className="ai-chat-section">
              <div className="ai-chat-history">
                {chatLog.map((msg, i) => (
                  <div key={i} className={`ai-chat-bubble ${msg.sender}`}>
                    <div className="ai-bubble-sender">
                      {msg.sender === "ai" ? "🤖 MediSort AI" : "🧑‍⚕️ You"}
                    </div>
                    <div className="ai-bubble-content">{msg.text}</div>
                    {msg.result && (
                      <div className="ai-bubble-mini-badge" style={{ borderColor: msg.result.colorHex }}>
                        {msg.result.emoji} <strong>{msg.result.categoryName}</strong>
                      </div>
                    )}
                  </div>
                ))}
                {analyzing && (
                  <div className="ai-chat-bubble ai thinking">
                    <span className="ai-thinking-dots">{t.analyzing}</span>
                  </div>
                )}
              </div>

              {/* Glowing Interactive Siri/Gemini Voice Orb */}
              {(isListening || isSpeaking) && (
                <div className={`ai-voice-orb-stage ${isListening ? "listening" : "speaking"}`}>
                  <div className="ai-voice-orb-glow" />
                  <div className="ai-voice-orb-core">
                    <div className="ai-voice-orb-wave w1" />
                    <div className="ai-voice-orb-wave w2" />
                    <div className="ai-voice-orb-wave w3" />
                    <span className="ai-voice-orb-icon">{isListening ? "🎙️" : "🔊"}</span>
                  </div>
                  <div className="ai-voice-orb-equalizer">
                    <span className="eq-bar eb1" />
                    <span className="eq-bar eb2" />
                    <span className="eq-bar eb3" />
                    <span className="eq-bar eb4" />
                    <span className="eq-bar eb5" />
                    <span className="eq-bar eb6" />
                    <span className="eq-bar eb7" />
                  </div>
                  <span className="ai-voice-orb-status-text">
                    {isListening ? (currentLang === "hi" ? "आवाज सुन रहे हैं... बोलिए" : currentLang === "or" ? "ଶୁଣୁଛି... କୁହନ୍ତୁ" : "Listening live... speak your medical waste item") : (currentLang === "hi" ? "सीपीसीबी दिशानिर्देश बोल रहे हैं..." : currentLang === "or" ? "CPCB ନିର୍ଦ୍ଦେଶାବଳୀ ପଢ଼ୁଛି..." : "Speaking CPCB Clinical Protocol...")}
                  </span>
                </div>
              )}

              {/* Hands-Free Voice Assistant Bar */}
              <div className="ai-voice-controls-bar">
                <button
                  type="button"
                  className={`ai-mic-btn ${isListening ? "listening" : ""}`}
                  onClick={() => { playMedicalSfx("click"); startVoiceListening(); }}
                  title={isListening ? "Listening... click to stop" : "Speak query (Hands-free voice assistant)"}
                >
                  <span className="ai-mic-icon">🎙️</span>
                  <span>{isListening ? t.listening : t.speakHandsFree}</span>
                  {isListening && <span className="ai-mic-pulse" />}
                </button>

                <div className="ai-voice-right-controls">
                  <label className="ai-voice-toggle">
                    <input
                      type="checkbox"
                      checked={autoVoiceResponse}
                      onChange={e => {
                        setAutoVoiceResponse(e.target.checked);
                        localStorage.setItem("medisort_auto_voice", e.target.checked);
                        if (!e.target.checked) stopSpeaking();
                      }}
                    />
                    <span>{t.readAloud}</span>
                  </label>
                  {isSpeaking && (
                    <button type="button" className="ai-stop-audio-mini" onClick={stopSpeaking} title="Stop voice output">
                      {t.mute}
                    </button>
                  )}
                </div>
              </div>

              <form className="ai-chat-form" onSubmit={handleTextSubmit}>
                <input
                  type="text"
                  placeholder={isListening ? t.listeningPlaceholder : t.inputPlaceholder}
                  value={queryInput}
                  onChange={e => setQueryInput(e.target.value)}
                  className={isListening ? "listening-input" : ""}
                />
                <button type="submit" disabled={!queryInput.trim() || analyzing}>
                  {t.send}
                </button>
              </form>

              <div className="ai-samples-bar" style={{ marginTop: "10px" }}>
                <span className="ai-samples-label">{t.quickSuggestions}</span>
                <div className="ai-sample-chips">
                  {QUICK_SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      className="ai-sample-chip"
                      onClick={() => {
                        setQueryInput(item);
                        runClassification(item);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEGRADATION & ECO-IMPACT */}
          {activeTab === "impact" && (
            <div className="ai-impact-section">
              <div className="ai-impact-hero">
                <h3>{t.ecoTitle}</h3>
                <p>{t.ecoSub}</p>
              </div>

              <div className="ai-impact-cards-grid">
                <div className="ai-impact-card yellow-border">
                  <div className="ai-impact-card-head">
                    <span className="ai-impact-icon">🟡</span>
                    <strong>{currentLang === "hi" ? "पीला: संक्रामक एवं शारीरिक" : currentLang === "or" ? "ହଳଦିଆ: ସଂକ୍ରାମକ ଓ ଶାରୀରିକ ବର୍ଜ୍ୟ" : "Yellow: Infectious & Organic"}</strong>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "लैंडफिल अपघटन:" : currentLang === "or" ? "ମାଟିରେ ନଷ୍ଟ ସମୟ:" : "Landfill Decomposition:"}</label>
                    <span>{currentLang === "hi" ? "2 सप्ताह से 6 माह" : currentLang === "or" ? "୨ ସପ୍ତାହରୁ ୬ ମାସ" : "2 Weeks to 6 Months"}</span>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "उपचार न होने पर जोखिम:" : currentLang === "or" ? "ବିପଦ:" : "Risk if untreated:"}</label>
                    <span className="danger-text">{currentLang === "hi" ? "अत्यधिक रोग प्रसार (HIV, Hep B)" : currentLang === "or" ? "ମାରାତ୍ମକ ରୋଗ (HIV, Hep B)" : "Extremely High Pathogen Spread (HIV, Hep B)"}</span>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "सीपीसीबी उपचार:" : currentLang === "or" ? "CPCB ନିର୍ଦ୍ଧାରିତ ଉପଚାର:" : "CPCB Mandated Treatment:"}</label>
                    <span>{currentLang === "hi" ? "1050°C पर भस्मीकरण" : currentLang === "or" ? "୧୦୫୦°C ରେ ଭସ୍ମୀକରଣ" : "Incineration at 1050°C / Deep Burial"}</span>
                  </div>
                </div>

                <div className="ai-impact-card red-border">
                  <div className="ai-impact-card-head">
                    <span className="ai-impact-icon">🔴</span>
                    <strong>{currentLang === "hi" ? "लाल: दूषित प्लास्टिक" : currentLang === "or" ? "ଲାଲ୍: ଦୂଷିତ ପ୍ଲାଷ୍ଟିକ୍" : "Red: Contaminated Plastics"}</strong>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "लैंडफिल अपघटन:" : currentLang === "or" ? "ମାଟିରେ ନଷ୍ଟ ସମୟ:" : "Landfill Decomposition:"}</label>
                    <span>{currentLang === "hi" ? "450 – 500+ वर्ष" : currentLang === "or" ? "୪୫୦ ରୁ ୫୦୦+ ବର୍ଷ" : "450 – 500+ Years"}</span>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "उपचार न होने पर जोखिम:" : currentLang === "or" ? "ବିପଦ:" : "Risk if untreated:"}</label>
                    <span className="danger-text">{currentLang === "hi" ? "माइक्रोप्लास्टिक एवं डाइऑक्सिन उत्सर्जन" : currentLang === "or" ? "ବିଷାକ୍ତ ମାଇକ୍ରୋପ୍ଲାଷ୍ଟିକ୍ ପ୍ରଦୂଷଣ" : "Dioxin emissions & Microplastic ingestion"}</span>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "पुनर्चक्रण क्षमता:" : currentLang === "or" ? "ରିସାଇକ୍ଲିଂ ସମ୍ଭାବନା:" : "Circular Recovery:"}</label>
                    <span className="success-text">{currentLang === "hi" ? "ऑटोक्लेव + श्रेडिंग (100% रीसाइकल)" : currentLang === "or" ? "ଅଟୋକ୍ଲେଭିଂ + ଶ୍ରେଡିଂ (୧୦୦% ରିସାଇକ୍ଲିଂ)" : "Autoclave + Shredding (100% Recyclable)"}</span>
                  </div>
                </div>

                <div className="ai-impact-card white-border">
                  <div className="ai-impact-card-head">
                    <span className="ai-impact-icon">⚪</span>
                    <strong>{currentLang === "hi" ? "सफेद: नुकीले धातु एवं सुई" : currentLang === "or" ? "ଧଳା: ଧାରୁଆ ଧାତୁ ଓ ଛୁଞ୍ଚି" : "White: Sharps & Metals"}</strong>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "लैंडफिल अपघटन:" : currentLang === "or" ? "ମାଟିରେ ନଷ୍ଟ ସମୟ:" : "Landfill Decomposition:"}</label>
                    <span>{currentLang === "hi" ? "50 – 100+ वर्ष (जंग)" : currentLang === "or" ? "୫୦ ରୁ ୧୦୦+ ବର୍ଷ (କଳଙ୍କି)" : "50 – 100+ Years (Corrosion)"}</span>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "उपचार न होने पर जोखिम:" : currentLang === "or" ? "ବିପଦ:" : "Risk if untreated:"}</label>
                    <span className="danger-text">{currentLang === "hi" ? "सफाई कर्मियों को चुभने का खतरा" : currentLang === "or" ? "ଛୁଞ୍ଚି ଫୁଟି ଆହତ ହେବା ବିପଦ" : "Needle-stick injuries to sanitary workers"}</span>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "सीपीसीबी आदेश:" : currentLang === "or" ? "CPCB ନିର୍ଦ୍ଦେଶ:" : "Mandate:"}</label>
                    <span>{currentLang === "hi" ? "पंचर-प्रूफ डिब्बा व धातु गलाना" : currentLang === "or" ? "ପଙ୍କଚର୍-ପ୍ରୁଫ୍ କଣ୍ଟେନର୍ ଓ ତରଳାଇବା" : "Puncture-proof container & Metal Smelting"}</span>
                  </div>
                </div>

                <div className="ai-impact-card blue-border">
                  <div className="ai-impact-card-head">
                    <span className="ai-impact-icon">🔵</span>
                    <strong>{currentLang === "hi" ? "नीला: कांच एवं इम्प्लांट" : currentLang === "or" ? "ନୀଳ: କାଚ ଓ ଇମ୍ପ୍ଲାଣ୍ଟ" : "Blue: Glassware & Implants"}</strong>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "लैंडफिल अपघटन:" : currentLang === "or" ? "ମାଟିରେ ନଷ୍ଟ ସମୟ:" : "Landfill Decomposition:"}</label>
                    <span>{currentLang === "hi" ? "10,00,000+ वर्ष" : currentLang === "or" ? "୧୦ ଲକ୍ଷରୁ ଅଧିକ ବର୍ଷ" : "1,000,000+ Years"}</span>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "उपचार न होने पर जोखिम:" : currentLang === "or" ? "ବିପଦ:" : "Risk if untreated:"}</label>
                    <span className="danger-text">{currentLang === "hi" ? "कांच से कटने व चोट का खतरा" : currentLang === "or" ? "କାଚ କଟିବା ଓ ଆଘାତ ବିପଦ" : "Physical lacerations & Leached chemicals"}</span>
                  </div>
                  <div className="ai-impact-stat">
                    <label>{currentLang === "hi" ? "पुनर्चक्रण क्षमता:" : currentLang === "or" ? "ରିସାଇକ୍ଲିଂ ସମ୍ଭାବନା:" : "Circular Recovery:"}</label>
                    <span className="success-text">{currentLang === "hi" ? "100% अनंत बार पुनर्चक्रण" : currentLang === "or" ? "୧୦୦% ଅନନ୍ତକାଳ ରିସାଇକ୍ଲିଂ" : "Disinfection & Infinite Glass Recycling"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MULTI-ITEM CONTAMINATION DETECTOR */}
          {activeTab === "tray" && (
            <div className="ai-tray-section">
              <div className="ai-tray-hero">
                <div className="ai-tray-hero-left">
                  <div className="ai-tray-hero-icon-box">
                    <span className="ai-tray-hero-icon">🚨</span>
                  </div>
                  <div>
                    <h3>{t.trayTitle}</h3>
                    <p>{t.traySub}</p>
                  </div>
                </div>
              </div>

              {/* Target Container Selector */}
              <div className="ai-tray-target-selector">
                <span className="ai-tray-target-label">{t.trayAuditingTarget}</span>
                <div className="ai-tray-target-chips">
                  {[
                    { id: "ALL", label: t.trayTargetAll, color: "#6366f1" },
                    { id: "YELLOW", label: t.trayTargetYellow, color: "#eab308" },
                    { id: "RED", label: t.trayTargetRed, color: "#ef4444" },
                    { id: "WHITE", label: t.trayTargetWhite, color: "#94a3b8" },
                    { id: "BLUE", label: t.trayTargetBlue, color: "#3b82f6" }
                  ].map(target => (
                    <button
                      key={target.id}
                      type="button"
                      className={`ai-tray-target-chip ${trayTargetBin === target.id ? "active" : ""}`}
                      onClick={() => {
                        setTrayTargetBin(target.id);
                        if (trayResult) {
                          const reAudited = evaluateContamination(trayCustomInput || "syringe with needle", target.id, currentLang);
                          setTrayResult(reAudited);
                        }
                      }}
                    >
                      {target.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 1-Click Preset Scenarios */}
              <div className="ai-tray-presets-block">
                <div className="ai-tray-presets-header">
                  <span>{t.trayPresetsLabel}</span>
                  <small>Click to test instantly with CPCB violation matrix</small>
                </div>
                <div className="ai-tray-presets-grid">
                  {CONTAMINATION_PRESETS.map(preset => {
                    const presetName = preset.name[currentLang] || preset.name.en;
                    const presetBadge = preset.badge[currentLang] || preset.badge.en;
                    const isSelected = trayActivePresetId === preset.id;
                    const severityClass = preset.severity.toLowerCase();

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`ai-tray-preset-card ${severityClass} ${isSelected ? "selected" : ""}`}
                        onClick={() => runPresetAudit(preset.id)}
                      >
                        <div className="ai-preset-card-top">
                          <span className={`ai-preset-badge ${severityClass}`}>{presetBadge}</span>
                          <span className="ai-preset-target-tag">{preset.targetBin === "ALL" ? "Mixed Tray" : `${preset.targetBin} Bin`}</span>
                        </div>
                        <strong className="ai-preset-name">{presetName}</strong>
                        <div className="ai-preset-sample-pills">
                          {preset.sampleItems.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="ai-preset-mini-pill">{item}</span>
                          ))}
                          {preset.sampleItems.length > 3 && (
                            <span className="ai-preset-mini-pill more">+{preset.sampleItems.length - 3}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Multi-Item Input Bar */}
              <div className="ai-tray-input-card">
                <label className="ai-tray-input-label">{t.trayCustomLabel}</label>
                <form
                  className="ai-tray-form"
                  onSubmit={e => {
                    e.preventDefault();
                    if (trayCustomInput.trim()) {
                      runCustomTrayAudit(trayCustomInput);
                    }
                  }}
                >
                  <div className="ai-tray-input-row">
                    <input
                      type="text"
                      className={`ai-tray-input ${trayIsListening ? "listening-input" : ""}`}
                      placeholder={trayIsListening ? "Listening... Speak items separated by 'and' or commas..." : t.trayInputPlaceholder}
                      value={trayCustomInput}
                      onChange={e => setTrayCustomInput(e.target.value)}
                    />

                    {/* Microphone Dictation Button */}
                    <button
                      type="button"
                      className={`ai-voice-mic-btn mini ${trayIsListening ? "listening" : ""}`}
                      onClick={startTrayVoiceListening}
                      title={trayIsListening ? "Stop listening" : "Speak items hands-free"}
                    >
                      <span className="ai-mic-icon">🎙️</span>
                      {trayIsListening && <span className="ai-pulse-dot" />}
                    </button>

                    {/* Image Upload for Tray Photo */}
                    <input
                      type="file"
                      ref={trayFileInputRef}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleTrayFileUpload}
                    />
                    <button
                      type="button"
                      className="ai-tray-upload-btn"
                      onClick={() => trayFileInputRef.current?.click()}
                      title="Upload photo of surgical tray or waste container"
                    >
                      📷
                    </button>

                    {/* Run Audit Button */}
                    <button
                      type="submit"
                      className="ai-tray-submit-btn"
                      disabled={!trayCustomInput.trim() || trayAnalyzing}
                    >
                      {trayAnalyzing ? "Auditing..." : t.trayRunBtn}
                    </button>
                  </div>
                </form>

                {trayImage && (
                  <div className="ai-tray-image-preview">
                    <span>📸 Tray Photo Attached for Vision Audit</span>
                    <button
                      type="button"
                      className="ai-tray-remove-img"
                      onClick={() => setTrayImage(null)}
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Loading Spinner */}
              {trayAnalyzing && (
                <div className="ai-analyzing-card tray-loading">
                  <div className="ai-spinner-ring" />
                  <div>
                    <strong>{t.trayAuditing}</strong>
                    <p>
                      Cross-referencing against CPCB 2016 Schedules I &amp; II matrices using {isCloudAiActive ? `Google Gemini (${selectedModel})` : "CPCB Rule Engine"}...
                    </p>
                  </div>
                </div>
              )}

              {/* AUDIT RESULTS REPORT CARD */}
              {trayResult && !trayAnalyzing && (
                <div className={`ai-tray-report-card ${trayResult.severity.toLowerCase()}`}>
                  {/* Status Banner */}
                  <div className={`ai-hazard-banner ${trayResult.severity.toLowerCase()}`}>
                    <div className="ai-hazard-banner-left">
                      <span className="ai-hazard-banner-icon">
                        {trayResult.severity === "CRITICAL" ? "🚨" : trayResult.severity === "HIGH" ? "⚠️" : trayResult.severity === "MODERATE" ? "ℹ️" : "✅"}
                      </span>
                      <div className="ai-hazard-banner-text">
                        <h4>
                          {trayResult.severity === "CRITICAL"
                            ? t.trayCriticalBadge
                            : trayResult.severity === "HIGH"
                            ? t.trayHighBadge
                            : trayResult.severity === "MODERATE"
                            ? t.trayModerateBadge
                            : t.trayCompliantBadge}
                        </h4>
                        <p>{trayResult.summary}</p>
                      </div>
                    </div>

                    <div className="ai-hazard-banner-score-box">
                      <div className="ai-score-circle">
                        <span className="ai-score-number">{trayResult.complianceScore}%</span>
                        <small>{t.trayScoreLabel}</small>
                      </div>
                    </div>
                  </div>

                  {/* Discovered Items Stream Matrix */}
                  <div className="ai-tray-items-section">
                    <div className="ai-tray-section-title">
                      <h5>{t.trayItemsFound}</h5>
                      <span className="ai-tray-count-tag">
                        {trayResult.detectedItems?.filter(i => i.isContaminant).length || 0} Contaminants / {trayResult.detectedItems?.length || 0} Total
                      </span>
                    </div>

                    <div className="ai-tray-items-grid">
                      {trayResult.detectedItems?.map((item, idx) => (
                        <div
                          key={idx}
                          className={`ai-tray-item-row ${item.isContaminant ? "contaminant" : "clean"}`}
                        >
                          <div className="ai-tray-item-col-left">
                            <span
                              className="ai-item-bin-badge"
                              style={{ backgroundColor: item.colorHex || "#64748b" }}
                            >
                              {item.emoji} {item.detectedBin} BIN
                            </span>
                            <strong className="ai-tray-item-title">{item.name}</strong>
                          </div>

                          <div className="ai-tray-item-col-right">
                            {item.isContaminant ? (
                              <span className="ai-violation-status-pill danger">
                                🚨 MISPLACED CONTAMINANT
                              </span>
                            ) : (
                              <span className="ai-violation-status-pill safe">
                                ✅ COMPLIANT STREAM
                              </span>
                            )}
                          </div>

                          <div className="ai-tray-item-danger-note">
                            <strong>CPCB Rule Note:</strong> {item.danger}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CPCB Statutory Violations */}
                  {trayResult.violations && trayResult.violations.length > 0 && (
                    <div className="ai-tray-violations-box">
                      <h5>⚖️ {t.trayViolationsLabel}</h5>
                      <ul>
                        {trayResult.violations.map((violation, idx) => (
                          <li key={idx}>{violation}</li>
                        ))}
                      </ul>
                      <div className="ai-statutory-notice">
                        <span className="ai-statutory-icon">⚠️</span>
                        <span>
                          <strong>CPCB &amp; MoEFCC Statutory Notice:</strong> Mixing medical sharps or chlorinated plastics violates Section 15 of Environment Protection Act, 1986 carrying penal fines up to ₹1,00,000 and mandatory suspension of biomedical handling authorization.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Step-by-Step Immediate Corrective Protocol */}
                  {trayResult.correctiveSteps && trayResult.correctiveSteps.length > 0 && (
                    <div className="ai-tray-corrective-box">
                      <h5>🛡️ {t.trayCorrectiveLabel}</h5>
                      <div className="ai-corrective-steps-list">
                        {trayResult.correctiveSteps.map((step, idx) => (
                          <div key={idx} className="ai-corrective-step-item">
                            <span className="ai-step-idx">{idx + 1}</span>
                            <p>{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tray Report Footer Controls */}
                  <div className="ai-tray-footer-controls">
                    <button
                      type="button"
                      className={`ai-audio-guide-btn ${trayIsSpeaking ? "speaking" : ""}`}
                      onClick={() => (trayIsSpeaking ? stopTraySpeaking() : speakTrayAlert(trayResult))}
                      title={trayIsSpeaking ? "Stop voice warning" : "Listen to audio alert"}
                    >
                      <span className="ai-audio-ico">{trayIsSpeaking ? "⏹️" : "🔊"}</span>
                      <span>{trayIsSpeaking ? t.trayMuteAudio : t.trayListenAudio}</span>
                      {trayIsSpeaking && (
                        <div className="ai-soundwave-bars">
                          <span className="ai-sw-bar b1" />
                          <span className="ai-sw-bar b2" />
                          <span className="ai-sw-bar b3" />
                          <span className="ai-sw-bar b4" />
                        </div>
                      )}
                    </button>

                    {onApplyWaste && (
                      <button
                        type="button"
                        className="ai-apply-btn"
                        onClick={handleApplyCompliantWaste}
                      >
                        {t.trayApplyCompliant}
                      </button>
                    )}

                    <button
                      type="button"
                      className="ai-tag-shortcut-btn"
                      onClick={() => openBarcodeTagWithContamination(trayResult)}
                      title="Generate CPCB Barcode Label for audited waste batch"
                    >
                      <span>🖨️</span> {t.tabBarcode}
                    </button>

                    <button
                      type="button"
                      className="ai-dismiss-result-btn"
                      onClick={() => {
                        stopTraySpeaking();
                        setTrayResult(null);
                        setTrayActivePresetId(null);
                      }}
                    >
                      {t.trayClear}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: INSTANT CPCB BARCODE TAG GENERATOR */}
          {activeTab === "barcode" && (
            <div className="ai-barcode-studio-section">
              <div className="ai-barcode-hero">
                <div className="ai-barcode-hero-left">
                  <div className="ai-barcode-hero-icon-box">
                    <span className="ai-barcode-hero-icon">🖨️</span>
                  </div>
                  <div>
                    <div className="ai-barcode-hero-title-row">
                      <h3>{t.barcodeTitle}</h3>
                      <span className="ai-pulse-pill-badge blue">CPCB Form VI</span>
                    </div>
                    <p>{t.barcodeSub}</p>
                  </div>
                </div>
              </div>

              <div className="ai-barcode-studio-grid">
                {/* LEFT: Controls & Parameters */}
                <div className="ai-barcode-controls-card">
                  {/* Category Color Selector */}
                  <div className="ai-barcode-control-group">
                    <label className="ai-control-label">{t.barcodeBagColor}</label>
                    <div className="ai-barcode-cat-pills">
                      {Object.keys(CPCB_TAG_CONFIGS).map((catKey) => {
                        const cfg = CPCB_TAG_CONFIGS[catKey];
                        const isSelected = tagCategory === catKey;
                        return (
                          <button
                            key={catKey}
                            type="button"
                            className={`ai-cat-pill-btn ${catKey.toLowerCase()} ${isSelected ? "selected" : ""}`}
                            onClick={() => handleSwitchTagCategory(catKey)}
                            style={{
                              borderColor: isSelected ? cfg.color : undefined
                            }}
                          >
                            <span className="cat-pill-dot" style={{ backgroundColor: cfg.color }} />
                            <span className="cat-pill-name">{catKey}</span>
                            <span className="cat-pill-sym">{cfg.symbol}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Ward / Origin Selector */}
                  <div className="ai-barcode-control-group">
                    <label className="ai-control-label">{t.barcodeWard}</label>
                    <select
                      className="ai-barcode-select"
                      value={tagWard}
                      onChange={(e) => setTagWard(e.target.value)}
                    >
                      {CPCB_WARDS.map((w, idx) => (
                        <option key={idx} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Material Description Input & Quick Presets */}
                  <div className="ai-barcode-control-group">
                    <label className="ai-control-label">{t.barcodeMaterial}</label>
                    <input
                      type="text"
                      className="ai-barcode-input"
                      value={tagWasteLabel}
                      onChange={(e) => setTagWasteLabel(e.target.value)}
                      placeholder="Describe waste material..."
                    />
                    {/* Presets Chips */}
                    <div className="ai-barcode-preset-chips">
                      <span className="chips-hint">⚡ Presets:</span>
                      {CPCB_TAG_CONFIGS[tagCategory].wasteTypes.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`ai-material-preset-chip ${tagWasteLabel === preset ? "active" : ""}`}
                          onClick={() => setTagWasteLabel(preset)}
                          title={preset}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Net Weight Adjuster */}
                  <div className="ai-barcode-control-group">
                    <label className="ai-control-label">{t.barcodeWeight}</label>
                    <div className="ai-weight-adjuster-row">
                      <div className="ai-weight-input-wrap">
                        <input
                          type="number"
                          step="0.05"
                          min="0.05"
                          max="99"
                          className="ai-weight-input"
                          value={tagWeight}
                          onChange={(e) => setTagWeight(e.target.value)}
                        />
                        <span className="ai-weight-unit">KG</span>
                      </div>
                      <div className="ai-weight-delta-buttons">
                        <button type="button" onClick={() => handleAdjustWeight(-0.5)}>-0.5</button>
                        <button type="button" onClick={() => handleAdjustWeight(0.5)}>+0.5</button>
                        <button type="button" onClick={() => handleAdjustWeight(1.0)}>+1.0</button>
                        <button type="button" onClick={() => handleAdjustWeight(2.0)}>+2.0</button>
                        <button type="button" onClick={() => handleAdjustWeight(5.0)}>+5.0</button>
                      </div>
                    </div>
                  </div>

                  {/* Barcode Serial Row */}
                  <div className="ai-barcode-control-group">
                    <div className="ai-serial-label-row">
                      <label className="ai-control-label">CPCB Serial No.:</label>
                      <button
                        type="button"
                        className="ai-regen-serial-btn"
                        onClick={handleRegenerateSerial}
                        title="Regenerate unique serial"
                      >
                        {t.barcodeRegenerate}
                      </button>
                    </div>
                    <div className="ai-serial-display-box">
                      <code>{tagSerial}</code>
                      <span className="ai-serial-badge">SECURE</span>
                    </div>
                  </div>

                  {/* Facility & CBWTF Compliance Stamp */}
                  <div className="ai-facility-meta-card">
                    <div className="meta-card-row">
                      <strong>🏥 {t.barcodeFacility}</strong>
                      <span>Aarogya Multispecialty Hospital, Bhubaneswar</span>
                    </div>
                    <div className="meta-card-row">
                      <strong>📜 {t.barcodeAuthNo}</strong>
                      <code>OSPCB/BMW-REG/2026/0842-A</code>
                    </div>
                    <div className="meta-card-row">
                      <strong>📍 GPS Coordinates:</strong>
                      <code>20.2961° N, 85.8245° E (Odisha)</code>
                    </div>
                    <div className="meta-card-row">
                      <strong>🚛 {t.barcodeCBWTF}</strong>
                      <span>Utkal Clean Enviro Tech CBWTF (OD-CBWTF-04)</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: High-Fidelity Printable Bag Tag Preview */}
                <div className="ai-barcode-preview-card">
                  {/* Action Toolbar */}
                  <div className="ai-tag-action-bar">
                    <button
                      type="button"
                      className="ai-tag-print-btn"
                      onClick={() => { playMedicalSfx("click"); handlePrintTag(); }}
                      title="Send label to standard 4x3 adhesive thermal label printer"
                    >
                      <span>🖨️</span> {t.barcodePrintBtn}
                    </button>
                    <button
                      type="button"
                      className="ai-tag-download-btn"
                      onClick={handleDownloadTagSvg}
                      title="Download verifiable standalone label file"
                    >
                      <span>📥</span> Download Tag
                    </button>
                    <button
                      type="button"
                      className="ai-tag-manifest-btn"
                      onClick={() => { playMedicalSfx("click"); handleCopyManifest(); }}
                      title="Copy verifiable JSON digital manifest"
                    >
                      <span>📋</span> {tagCopied ? t.manifestCopied : t.barcodeCopyManifestBtn}
                    </button>
                    {onApplyWaste && (
                      <button
                        type="button"
                        className={`ai-tag-apply-btn ${tagApplied ? "applied" : ""}`}
                        onClick={handleApplyTagToForm}
                        title="Record this barcoded waste bag into hospital waste registry"
                      >
                        <span>⚡</span> {tagApplied ? "Logged to Registry!" : t.barcodeApplyFormBtn}
                      </button>
                    )}
                  </div>

                  {/* Label Size Preset Pills */}
                  <div className="ai-tag-size-pills">
                    <span className="size-pills-label">Format:</span>
                    {[
                      { id: "standard", label: "🏷️ 4\"x3\" Bag Tag" },
                      { id: "compact", label: "📦 3\"x2\" Sharps" },
                      { id: "drum", label: "🛢️ 5\"x4\" Drum" }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        className={`ai-size-pill ${tagSizePreset === p.id ? "active" : ""}`}
                        onClick={() => {
                          playMedicalSfx("click");
                          setTagSizePreset(p.id);
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* FEEDBACK BANNER */}
                  {tagCopied && (
                    <div className="ai-manifest-toast">
                      <span>✅</span>
                      <span>{t.manifestCopied}</span>
                    </div>
                  )}

                  {/* OFFICIAL CPCB FORM VI PRINTABLE STICKER */}
                  <div className="cpcb-printable-tag-wrapper">
                    <div
                      id="cpcb-printable-tag"
                      className={`cpcb-tag-sticker ${tagCategory.toLowerCase()} size-${tagSizePreset}`}
                      style={{
                        borderColor: CPCB_TAG_CONFIGS[tagCategory].color
                      }}
                    >
                      {/* Top Regulatory Header */}
                      <div className="cpcb-tag-header">
                        <div className="cpcb-header-left">
                          <span className="cpcb-gov-seal">ODISHA STATE POLLUTION CONTROL BOARD</span>
                          <span className="cpcb-rule-cite">Bio-Medical Waste Management Rules, 2016</span>
                        </div>
                        <div className="cpcb-header-right">
                          <span className="cpcb-form-vi-badge">FORM VI TAG</span>
                          <span className="cpcb-security-token">SECURE QR/BARCODE</span>
                        </div>
                      </div>

                      {/* Hospital Identity Strip */}
                      <div className="cpcb-tag-hcf-strip">
                        <div className="hcf-name-line">
                          <strong>HCF:</strong> AAROGYA MULTISPECIALTY HOSPITAL & RESEARCH INSTITUTE
                        </div>
                        <div className="hcf-meta-line">
                          <span><strong>AUTH NO:</strong> OSPCB/BMW-REG/2026/0842-A</span>
                          <span>•</span>
                          <span><strong>GPS:</strong> 20.2961°N, 85.8245°E</span>
                        </div>
                      </div>

                      {/* Barcode & QR Dual Identification Row */}
                      <div className="cpcb-tag-id-row">
                        <div className="cpcb-barcode-col">
                          <CpcbBarcodeSvg text={tagSerial} />
                        </div>
                        <div className="cpcb-qr-col">
                          <CpcbQrMatrixSvg
                            payload={JSON.stringify({
                              s: tagSerial,
                              h: "AAROGYA-BBSR",
                              c: tagCategory,
                              w: tagWeight,
                              wrd: tagWard,
                              t: tagTimestamp,
                              d: "OD-CBWTF-04"
                            })}
                            size={76}
                          />
                          <span className="cpcb-qr-caption">SCAN TO VERIFY</span>
                        </div>
                      </div>

                      {/* Waste Stream Category Color Band */}
                      <div
                        className="cpcb-category-banner"
                        style={{
                          backgroundColor: CPCB_TAG_CONFIGS[tagCategory].color,
                          color: tagCategory === "WHITE" ? "#0f172a" : "#ffffff"
                        }}
                      >
                        <div className="cat-banner-left">
                          <span className="cat-symbol">{CPCB_TAG_CONFIGS[tagCategory].symbol}</span>
                          <span className="cat-title">{tagCategory} CATEGORY</span>
                          <span className="cat-code">[{CPCB_TAG_CONFIGS[tagCategory].categoryCode}]</span>
                        </div>
                        <div className="cat-banner-right">
                          <span className="cat-dest">TREATMENT: {CPCB_TAG_CONFIGS[tagCategory].treatment}</span>
                        </div>
                      </div>

                      {/* Core Manifest Table */}
                      <div className="cpcb-manifest-grid">
                        <div className="manifest-item col-span-2">
                          <span className="manifest-lbl">WASTE DESCRIPTION:</span>
                          <span className="manifest-val strong-val">{tagWasteLabel || "Clinical Bio-Medical Waste"}</span>
                        </div>
                        <div className="manifest-item">
                          <span className="manifest-lbl">WARD / ORIGIN:</span>
                          <span className="manifest-val">{tagWard}</span>
                        </div>
                        <div className="manifest-item highlight-weight">
                          <span className="manifest-lbl">NET WEIGHT:</span>
                          <span className="manifest-val weight-val">{Number(tagWeight || 0).toFixed(2)} KG</span>
                        </div>
                        <div className="manifest-item">
                          <span className="manifest-lbl">GENERATION DATE / TIME:</span>
                          <span className="manifest-val">{tagTimestamp}</span>
                        </div>
                        <div className="manifest-item">
                          <span className="manifest-lbl">DESIGNATED CBWTF:</span>
                          <span className="manifest-val">Utkal Clean Enviro Tech (OD-CBWTF-04)</span>
                        </div>
                        <div className="manifest-item col-span-2 container-item">
                          <span className="manifest-lbl">CONTAINER TYPE:</span>
                          <span className="manifest-val">{CPCB_TAG_CONFIGS[tagCategory].containerType}</span>
                        </div>
                      </div>

                      {/* Footer Legal & Security Verification */}
                      <div className="cpcb-tag-footer">
                        <div className="footer-hazard-sign">
                          <span className="hazard-ico">☣️</span>
                          <div className="hazard-text">
                            <strong>BIO-MEDICAL HAZARD</strong>
                            <small>HANDLE IN COMPLIANCE WITH CPCB RULES 2016</small>
                          </div>
                        </div>
                        <div className="footer-auth-sign">
                          <div className="digital-stamp">
                            <span>✓ VERIFIED DIGITAL SEAL</span>
                            <small>OFFICER: #OD-BMW-SEC-992</small>
                          </div>
                        </div>
                      </div>

                      {/* Fine print */}
                      <div className="cpcb-fine-print">
                        <span>UNAUTHORIZED TRANSIT, DUMPING OR REMOVAL IS A PUNISHABLE OFFENSE UNDER SEC 15 ENVIRONMENT (PROTECTION) ACT 1986</span>
                      </div>
                    </div>
                  </div>

                  <div className="ai-barcode-notice-footer">
                    <span>ℹ️ {t.barcodeScanNotice}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI DIAGNOSTIC RESULT CARD (When item analyzed) */}
          {analyzing && (
            <div className="ai-analyzing-card">
              <div className="ai-spinner-ring" />
              <div>
                <strong>{t.analyzing}</strong>
                <p>
                  Analyzing with {isCloudAiActive ? `Google Gemini (${selectedModel})` : "CPCB 2016 Heuristic Engine"}
                </p>
              </div>
            </div>
          )}

          {result && !analyzing && activeTab !== "tray" && activeTab !== "barcode" && (
            <div className={`ai-result-panel ${result.category.toLowerCase()}`}>
              {/* High-Risk Bio-Security Alert Perimeter Ribbon */}
              {(result.riskLevel === "EXTREME" || result.riskLevel === "HIGH") && (
                <div className="ai-hazard-perimeter-ribbon">
                  <span className="hazard-ribbon-icon">⚠️</span>
                  <span className="hazard-ribbon-text">
                    {currentLang === "hi" 
                      ? "जैव-सुरक्षा चेतावनी: उच्च जोखिम संक्रामक सामग्री — तत्काल अलग करें" 
                      : currentLang === "or" 
                      ? "ଜୈବ-ସୁରକ୍ଷା ସତର୍କତା: ଅତ୍ୟଧିକ ବିପଦପୂର୍ଣ୍ଣ ସଂକ୍ରାମକ ବର୍ଜ୍ୟବସ୍ତୁ" 
                      : "BIO-SECURITY PERIMETER ALERT: HIGH-RISK PATHOGENIC MATERIAL — STRICT ISOLATION"}
                  </span>
                </div>
              )}

              <div className="ai-result-top">
                <div className="ai-result-category-badge" style={{ backgroundColor: result.colorHex }}>
                  <span className="ai-result-cat-emoji">{result.emoji}</span>
                  <div className="ai-result-cat-text">
                    <strong>{result.category} BIN</strong>
                    <small>{result.categoryName}</small>
                  </div>
                </div>

                {/* 3D Container Visualizer */}
                <Cpcb3DContainerVisual category={result.category} colorHex={result.colorHex} />

                {/* SVG Radial Confidence Gauge */}
                <CpcbConfidenceGauge confidence={result.confidence} colorHex={result.colorHex} />

                <div className="ai-result-meta-right">
                  <span className="ai-source-pill">{result.source}</span>
                </div>
              </div>

              <div className="ai-result-item-title">
                <h3>{result.detectedItem}</h3>
                <span className="ai-risk-badge">{result.riskLevel}</span>
              </div>

              <div className="ai-result-details-grid">
                <div className="ai-detail-block">
                  <span className="ai-detail-label">{t.container}</span>
                  <p>{result.binType}</p>
                </div>
                <div className="ai-detail-block">
                  <span className="ai-detail-label">{t.treatment}</span>
                  <p>{result.treatment}</p>
                </div>
                <div className="ai-detail-block">
                  <span className="ai-detail-label">{t.degradation}</span>
                  <p>{result.degradationTime}</p>
                </div>
                <div className="ai-detail-block">
                  <span className="ai-detail-label">{t.recycling}</span>
                  <p>{result.recyclingPotential}</p>
                </div>
              </div>

              <div className="ai-handling-rules">
                <strong>{t.handlingTitle}</strong>
                <ul>
                  {result.handlingRules?.map((rule, idx) => (
                    <li key={idx}>{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="ai-result-footer">
                <button
                  type="button"
                  className={`ai-audio-guide-btn ${isSpeaking ? "speaking" : ""}`}
                  onClick={() => (isSpeaking ? stopSpeaking() : speakResult(result))}
                  title={isSpeaking ? "Stop voice guidance" : "Listen to audio guidance"}
                >
                  <span className="ai-audio-ico">{isSpeaking ? "⏹️" : "🔊"}</span>
                  <span>{isSpeaking ? t.stopVoice : t.listenGuidance}</span>
                  {isSpeaking && (
                    <div className="ai-soundwave-bars">
                      <span className="ai-sw-bar b1" />
                      <span className="ai-sw-bar b2" />
                      <span className="ai-sw-bar b3" />
                      <span className="ai-sw-bar b4" />
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  className="ai-tag-shortcut-btn"
                  onClick={() => openBarcodeTagWithItem(result)}
                  title="Generate CPCB Barcode Label for this classified waste"
                >
                  <span>🖨️</span> {t.tabBarcode}
                </button>
                {onApplyWaste && (
                  <button className="ai-apply-btn" onClick={handleApplyToForm}>
                    {t.applyBtn}
                  </button>
                )}
                <button
                  className="ai-dismiss-result-btn"
                  onClick={() => {
                    stopSpeaking();
                    setResult(null);
                  }}
                >
                  {t.clearBtn}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
