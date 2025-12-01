// firebase-config.js
// ==== IMPORTA FIREBASE APP ====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";

// ==== IMPORTA FIRESTORE ====
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ==== CONFIGURAÇÃO DO SEU PROJETO ====
const firebaseConfig = {
  apiKey: "AIzaSyCUux2w2vlbO71z9RKQ9lDUrxPs4dj3Nzk",
  authDomain: "tarefas-b3025.firebaseapp.com",
  projectId: "tarefas-b3025",
  storageBucket: "tarefas-b3025.firebasestorage.app",
  messagingSenderId: "929442140368",
  appId: "1:929442140368:web:e330a7e041a36c43b54ed5"
};

// ==== INICIALIZA APLICATIVO ====
export const app = initializeApp(firebaseConfig);

// ==== EXPORTA FIRESTORE ====
export const db = getFirestore(app);
