// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDqFFGftfrJw1xNbp5IbewcrrJyiXjoZ6M",
  authDomain: "healthy-companion-ac9be.firebaseapp.com",
  projectId: "healthy-companion-ac9be",
  storageBucket: "healthy-companion-ac9be.firebasestorage.app",
  messagingSenderId: "1087793086116",
  appId: "1:1087793086116:web:c229a3a38c595947fdf031"
};

// Initialisation via l'objet global 'firebase' (version Compat)
firebase.initializeApp(firebaseConfig);

// Création des variables globales pour la base de données et l'authentification
const db = firebase.firestore();
const auth = firebase.auth();