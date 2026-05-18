// Plus besoin d'imports car on utilise les bibliothèques globales "compat" de Firebase
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authSwitchText = document.getElementById('auth-switch-text');
const authError = document.getElementById('auth-error');
const logoutBtn = document.getElementById('logout-btn');

let isLoginMode = true;

// Basculer entre Connexion et Inscription
authSwitchBtn.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.textContent = "Connexion";
        authSubmitBtn.textContent = "Se connecter";
        authSwitchText.textContent = "Pas encore de compte ?";
        authSwitchBtn.textContent = "S'inscrire";
    } else {
        authTitle.textContent = "Inscription";
        authSubmitBtn.textContent = "Créer un compte";
        authSwitchText.textContent = "Déjà un compte ?";
        authSwitchBtn.textContent = "Se connecter";
    }
    authError.classList.add('hidden');
});

// Gérer la soumission du formulaire
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    authError.classList.add('hidden');
    authSubmitBtn.disabled = true;
    
    try {
        if (isLoginMode) {
            // Connexion
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            // Inscription
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // TEST DE LA BASE DE DONNÉES: Créer un document utilisateur
            await db.collection("users").doc(user.uid).set({
                email: user.email,
                createdAt: new Date().toISOString(),
                themePreference: document.documentElement.getAttribute('data-theme') || "dark"
            });
            console.log("Document utilisateur créé avec succès !");
        }
    } catch (error) {
        console.error("Erreur d'authentification:", error);
        authError.textContent = getErrorMessage(error.code);
        authError.classList.remove('hidden');
    } finally {
        authSubmitBtn.disabled = false;
    }
});

// Déconnexion
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
        }
    });
}

// Écouter les changements d'état (connecté / déconnecté)
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Utilisateur connecté
        authScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        
        const mainNav = document.getElementById('main-nav');
        if (mainNav) mainNav.classList.remove('hidden');
        
        console.log("Utilisateur connecté:", user.email);
        
        // Tester la lecture Firestore
        try {
            const docSnap = await db.collection("users").doc(user.uid).get();
            if (docSnap.exists) {
                console.log("Données utilisateur lues depuis Firestore:", docSnap.data());
            } else {
                console.log("Aucune donnée utilisateur supplémentaire trouvée dans Firestore.");
            }
        } catch (error) {
            console.error("Erreur lors de la lecture Firestore:", error);
            if (error.code === 'permission-denied') {
                console.error("⚠️ PROBLÈME DE PERMISSION : Assure-toi que les règles Firestore sont en mode test.");
            }
        }
        
    } else {
        // Utilisateur déconnecté
        authScreen.classList.remove('hidden');
        dashboardScreen.classList.add('hidden');
        if (logoutBtn) logoutBtn.classList.add('hidden');
        
        const mainNav = document.getElementById('main-nav');
        if (mainNav) mainNav.classList.add('hidden');
        
        console.log("Utilisateur déconnecté.");
    }
});

function getErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-email': return "Adresse email invalide.";
        case 'auth/user-not-found': return "Aucun utilisateur trouvé avec cet email.";
        case 'auth/wrong-password': return "Mot de passe incorrect.";
        case 'auth/email-already-in-use': return "Cet email est déjà utilisé.";
        case 'auth/weak-password': return "Le mot de passe doit faire au moins 6 caractères.";
        case 'auth/invalid-credential': return "Identifiants invalides.";
        default: return "Une erreur est survenue (" + code + ").";
    }
}
