document.addEventListener('DOMContentLoaded', () => {
    // === GESTION DU THÈME ===
    const themeToggleBtn = document.getElementById('theme-toggle');
    const iconSun = document.getElementById('icon-sun');
    const iconMoon = document.getElementById('icon-moon');
    const htmlElement = document.documentElement;

    // Récupérer le thème sauvegardé, ou définir "dark" par défaut
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    // Appliquer le thème au chargement
    applyTheme(savedTheme);

    // Écouteur d'événement sur le bouton de thème
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    /**
     * Applique un thème au document et met à jour l'UI (icônes, localStorage)
     * @param {string} theme - 'dark' ou 'light'
     */
    function applyTheme(theme) {
        // Appliquer l'attribut sur la balise <html>
        htmlElement.setAttribute('data-theme', theme);
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('theme', theme);

        // Gérer l'affichage des icônes
        if (theme === 'dark') {
            iconSun.classList.remove('hidden'); // Afficher le soleil (pour passer au mode clair)
            iconMoon.classList.add('hidden');
        } else {
            iconMoon.classList.remove('hidden'); // Afficher la lune (pour passer au mode sombre)
            iconSun.classList.add('hidden');
        }
    }

    // Initialisation des données simulées (pour la démonstration du MVP)
    initDashboardMocks();
});

function initDashboardMocks() {
    // Plus tard, ces données viendront de Firebase
    console.log("Healthy Companion initialisé. Prêt pour l'intégration de Firebase !");
}
