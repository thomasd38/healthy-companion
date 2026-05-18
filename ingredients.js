// === LOGIQUE INGRÉDIENTS ===
const ingredientModal = document.getElementById('ingredient-modal');
const openIngredientModalBtn = document.getElementById('open-ingredient-modal-btn');
const closeIngredientModalBtn = document.getElementById('close-ingredient-modal-btn');
const cancelIngredientBtn = document.getElementById('cancel-ingredient-btn');
const ingredientForm = document.getElementById('ingredient-form');
const ingredientsGrid = document.getElementById('ingredients-grid');

let editingIngredientId = null;

// On va stocker les ingrédients globalement pour que recipes.js puisse les lire
window.userIngredients = [];

auth.onAuthStateChanged((user) => {
    if (user) {
        loadIngredients();
    } else {
        window.userIngredients = [];
        if (ingredientsGrid) ingredientsGrid.innerHTML = '';
    }
});

function openIngModal(isEdit = false) {
    ingredientModal.showModal();
    if (!isEdit) {
        ingredientForm.reset();
        document.getElementById('ingredient-modal-title').textContent = "Nouvel Ingrédient";
        editingIngredientId = null;
    }
}

function closeIngModal() {
    ingredientModal.close();
}

if (openIngredientModalBtn) openIngredientModalBtn.addEventListener('click', () => openIngModal(false));
if (closeIngredientModalBtn) closeIngredientModalBtn.addEventListener('click', closeIngModal);
if (cancelIngredientBtn) cancelIngredientBtn.addEventListener('click', closeIngModal);

// === SAUVEGARDE INGRÉDIENT ===
if (ingredientForm) {
    ingredientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const name = document.getElementById('ing-form-name').value.trim();
        const calories = parseFloat(document.getElementById('ing-form-cals').value) || 0;

        const ingData = {
            name,
            caloriesPer100: calories,
            updatedAt: new Date().toISOString()
        };

        try {
            const btn = ingredientForm.querySelector('button[type="submit"]');
            btn.disabled = true;

            if (editingIngredientId) {
                await db.collection("users").doc(user.uid).collection("ingredients").doc(editingIngredientId).update(ingData);
            } else {
                ingData.createdAt = new Date().toISOString();
                await db.collection("users").doc(user.uid).collection("ingredients").add(ingData);
            }

            closeIngModal();
            loadIngredients();
        } catch (error) {
            console.error("Erreur save ingredient:", error);
        } finally {
            const btn = ingredientForm.querySelector('button[type="submit"]');
            btn.disabled = false;
        }
    });
}

// === LECTURE ET AFFICHAGE ===
async function loadIngredients() {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const snapshot = await db.collection("users").doc(user.uid).collection("ingredients").orderBy("name").get();
        if (ingredientsGrid) ingredientsGrid.innerHTML = '';
        window.userIngredients = [];

        if (snapshot.empty) {
            if (ingredientsGrid) {
                ingredientsGrid.innerHTML = `<p class="muted" style="grid-column: 1/-1;">Aucun ingrédient pour le moment. Commencez par en ajouter !</p>`;
            }
            window.dispatchEvent(new Event('ingredientsLoaded'));
            return;
        }

        snapshot.forEach(doc => {
            const ing = doc.data();
            ing.id = doc.id;
            window.userIngredients.push(ing);
            renderIngredientCard(ing);
        });

        // Informer recipes.js que les ingrédients sont dispos pour rafraichir les options si besoin
        window.dispatchEvent(new Event('ingredientsLoaded'));

    } catch (error) {
        console.error("Erreur get ingredients:", error);
    }
}

function renderIngredientCard(ing) {
    if (!ingredientsGrid) return;
    const card = document.createElement('article');
    card.className = 'card recipe-card'; // On réutilise les styles des cards de recettes
    
    card.innerHTML = `
        <div style="flex: 2; font-weight: 500;">
            ${ing.name}
        </div>
        <div style="flex: 1; text-align: center;">
            <span style="font-weight: 700; color: var(--accent-primary); font-size: 1.1rem;">${ing.caloriesPer100}</span>
            <span style="font-size: 0.85rem; color: var(--text-secondary);"> kcal / 100g</span>
        </div>
        <div class="recipe-actions-inline">
            <button type="button" class="btn-icon edit-btn" title="Modifier">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>
            </button>
            <button type="button" class="btn-icon delete-btn" title="Supprimer" style="color: #ef4444;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
            </button>
        </div>
    `;

    card.querySelector('.delete-btn').addEventListener('click', async () => {
        if(confirm(`Supprimer l'ingrédient "${ing.name}" ? (Attention, il ne sera plus sélectionnable dans vos futures recettes).`)) {
            await db.collection("users").doc(auth.currentUser.uid).collection("ingredients").doc(ing.id).delete();
            loadIngredients();
        }
    });

    card.querySelector('.edit-btn').addEventListener('click', () => {
        openIngModal(true);
        editingIngredientId = ing.id;
        document.getElementById('ingredient-modal-title').textContent = "Modifier l'ingrédient";
        document.getElementById('ing-form-name').value = ing.name;
        document.getElementById('ing-form-cals').value = ing.caloriesPer100;
    });

    ingredientsGrid.appendChild(card);
}
