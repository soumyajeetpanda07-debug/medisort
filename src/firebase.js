import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";



const firebaseConfig = {
  apiKey: "AIzaSyBuhv-6u6XG_NRgjLBHQfKnwDBiff7KhJs",
  authDomain: "medisort-3c367.firebaseapp.com",
  projectId: "medisort-3c367",
  storageBucket: "medisort-3c367.firebasestorage.app",
  messagingSenderId: "638221419228",
  appId: "1:638221419228:web:a67747c4ba9898ee032a19"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db }; 



