// === NAVIGATION ===
const navBtns = document.querySelectorAll('.nav-btn');
const screens = {
    'dashboard-screen': document.getElementById('dashboard-screen'),
    'calendar-screen': document.getElementById('calendar-screen'),
    'journal-screen': document.getElementById('journal-screen'),
    'weight-screen': document.getElementById('weight-screen'),
    'recipes-screen': document.getElementById('recipes-screen'),
    'ingredients-screen': document.getElementById('ingredients-screen')
};

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Retirer la classe active de tous les boutons
        navBtns.forEach(b => b.classList.remove('active'));
        // Ajouter la classe active au bouton cliqué
        btn.classList.add('active');

        // Cacher tous les écrans
        Object.values(screens).forEach(screen => {
            if(screen) screen.classList.add('hidden');
        });

        // Afficher l'écran ciblé
        const targetId = btn.getAttribute('data-target');
        if (screens[targetId]) {
            screens[targetId].classList.remove('hidden');
        }
    });
});

// === LOGIQUE RECETTES ===
const recipeModal = document.getElementById('recipe-modal');
const openRecipeModalBtn = document.getElementById('open-recipe-modal-btn');
const closeRecipeModalBtn = document.getElementById('close-recipe-modal-btn');
const cancelRecipeBtn = document.getElementById('cancel-recipe-btn');
const recipeForm = document.getElementById('recipe-form');

const ingredientsList = document.getElementById('ingredients-list');
const addIngredientBtn = document.getElementById('add-ingredient-btn');
const recipeTotalDisplay = document.getElementById('recipe-total-display');
const recipesGrid = document.getElementById('recipes-grid');

let currentUserId = null;
let editingRecipeId = null;
window.userRecipes = [];

auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;
        loadRecipes();
    } else {
        currentUserId = null;
        window.userRecipes = [];
        if(recipesGrid) recipesGrid.innerHTML = ''; 
    }
});

// === MODAL RECETTE ===
function openModal(isEdit = false) {
    if(!window.userIngredients || window.userIngredients.length === 0) {
        alert("Pour créer une recette, vous devez d'abord ajouter des ingrédients dans l'onglet 'Ingrédients' !");
        // On switch l'UI sur Ingrédients
        document.querySelector('[data-target="ingredients-screen"]').click();
        return;
    }

    recipeModal.showModal();
    if (!isEdit) {
        recipeForm.reset();
        ingredientsList.innerHTML = '';
        addIngredientRow(); 
        updateTotalCalories();
        document.getElementById('recipe-modal-title').textContent = "Nouvelle Recette";
        editingRecipeId = null;
    }
}

function closeModal() {
    recipeModal.close();
}

if(openRecipeModalBtn) openRecipeModalBtn.addEventListener('click', () => openModal(false));
if(closeRecipeModalBtn) closeRecipeModalBtn.addEventListener('click', closeModal);
if(cancelRecipeBtn) cancelRecipeBtn.addEventListener('click', closeModal);

// === INGRÉDIENTS DANS LA RECETTE ===
function createIngredientRow(ingredientId = '', qty = '') {
    const row = document.createElement('div');
    row.className = 'ingredient-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '0.75rem';
    
    // Générer les options depuis la liste globale (venant de ingredients.js)
    let optionsHtml = '<option value="" disabled selected>Choisir un ingrédient</option>';
    if (window.userIngredients) {
        window.userIngredients.forEach(ing => {
            const isSelected = ing.id === ingredientId ? 'selected' : '';
            optionsHtml += `<option value="${ing.id}" data-cals="${ing.caloriesPer100}" ${isSelected}>${ing.name}</option>`;
        });
    }

    row.innerHTML = `
        <div style="flex: 2;">
            <select class="form-input ing-select" required style="padding: 0.6rem; font-size: 0.9rem;">
                ${optionsHtml}
            </select>
        </div>
        <div style="flex: 1;">
            <input type="number" class="form-input ing-qty" placeholder="Qte (g)" value="${qty}" required min="1" style="padding: 0.6rem; font-size: 0.9rem;">
        </div>
        <div style="flex: 1; text-align: right;">
            <span class="ing-cals-display" style="color:var(--text-secondary); font-weight: 500; font-size: 0.95rem;">0 kcal</span>
            <input type="hidden" class="ing-cals-hidden" value="0">
        </div>
        <button type="button" class="btn-icon remove-ing-btn" title="Supprimer" style="color: var(--text-secondary); padding: 0.4rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
    `;

    const selectEl = row.querySelector('.ing-select');
    const qtyEl = row.querySelector('.ing-qty');
    const displayEl = row.querySelector('.ing-cals-display');
    const hiddenEl = row.querySelector('.ing-cals-hidden');

    function updateRowCalories() {
        const option = selectEl.options[selectEl.selectedIndex];
        if (!option || !option.value) return;
        
        const calsPer100 = parseFloat(option.getAttribute('data-cals')) || 0;
        const q = parseFloat(qtyEl.value) || 0;
        const total = Math.round((calsPer100 * q) / 100);
        
        displayEl.textContent = `${total} kcal`;
        hiddenEl.value = total;
        updateTotalCalories();
    }

    selectEl.addEventListener('change', updateRowCalories);
    qtyEl.addEventListener('input', updateRowCalories);
    
    // Calcul initial si on est en modification
    if(ingredientId && qty) updateRowCalories();

    row.querySelector('.remove-ing-btn').addEventListener('click', () => {
        row.remove();
        updateTotalCalories();
    });

    return row;
}

function addIngredientRow() {
    ingredientsList.appendChild(createIngredientRow());
}

if(addIngredientBtn) addIngredientBtn.addEventListener('click', addIngredientRow);

// === CALORIES ===
function updateTotalCalories() {
    let total = 0;
    const hiddens = document.querySelectorAll('.ing-cals-hidden');
    hiddens.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    if(recipeTotalDisplay) recipeTotalDisplay.textContent = `${total} kcal`;
    return total;
}

// === SAUVEGARDE (FIRESTORE) ===
if(recipeForm) {
    recipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUserId) return;

        const name = document.getElementById('recipe-name').value.trim();
        const category = document.getElementById('recipe-category').value;
        const isCheat = document.getElementById('recipe-is-cheat').checked;
        
        const ingredients = [];
        let hasValidIngredients = false;
        
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const selectEl = row.querySelector('.ing-select');
            const option = selectEl.options[selectEl.selectedIndex];
            if(!option || !option.value) return;

            hasValidIngredients = true;
            ingredients.push({
                ingredientId: option.value,
                name: option.text,
                caloriesPer100: parseFloat(option.getAttribute('data-cals')) || 0,
                quantity: parseInt(row.querySelector('.ing-qty').value) || 0,
                calories: parseInt(row.querySelector('.ing-cals-hidden').value) || 0
            });
        });

        if(!hasValidIngredients) {
            alert("Veuillez sélectionner au moins un ingrédient.");
            return;
        }

        const totalCalories = updateTotalCalories();

        const recipeData = {
            name,
            category,
            isCheat,
            ingredients,
            totalCalories,
            updatedAt: new Date().toISOString()
        };

        try {
            const btn = recipeForm.querySelector('button[type="submit"]');
            btn.disabled = true;

            if (editingRecipeId) {
                await db.collection("users").doc(currentUserId).collection("recipes").doc(editingRecipeId).update(recipeData);
            } else {
                recipeData.createdAt = new Date().toISOString();
                await db.collection("users").doc(currentUserId).collection("recipes").add(recipeData);
            }

            closeModal();
            loadRecipes();
        } catch (error) {
            console.error("Erreur lors de la sauvegarde de la recette:", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            const btn = recipeForm.querySelector('button[type="submit"]');
            btn.disabled = false;
        }
    });
}

// === LECTURE ET AFFICHAGE ===
async function loadRecipes() {
    if (!currentUserId) return;

    try {
        const snapshot = await db.collection("users").doc(currentUserId).collection("recipes").orderBy("createdAt", "desc").get();
        
        if(recipesGrid) recipesGrid.innerHTML = '';

        if (snapshot.empty) {
            if(recipesGrid) recipesGrid.innerHTML = `<p class="muted" style="grid-column: 1/-1;">Aucune recette pour le moment. Créez-en une !</p>`;
            window.dispatchEvent(new Event('recipesLoaded'));
            return;
        }

        window.userRecipes = [];
        snapshot.forEach(doc => {
            const recipe = doc.data();
            recipe.id = doc.id;
            window.userRecipes.push(recipe);
            renderRecipeCard(doc.id, recipe);
        });
        window.dispatchEvent(new Event('recipesLoaded'));

    } catch (error) {
        console.error("Erreur lors de la récupération des recettes:", error);
    }
}

function renderRecipeCard(id, recipe) {
    if(!recipesGrid) return;
    const card = document.createElement('article');
    card.className = 'card recipe-card';
    
    const badgeCheat = recipe.isCheat ? `<span class="recipe-badge cheat">Cheat Meal</span>` : '';
    let categoryName = "Plat";
    if(recipe.category === "dessert") categoryName = "Dessert";
    if(recipe.category === "snack") categoryName = "Snack";
    if(recipe.category === "fastfood") categoryName = "Fast Food";

    card.innerHTML = `
        <div style="flex: 2; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <strong style="font-size: 1.05rem;">${recipe.name}</strong>
            <span class="recipe-badge">${categoryName}</span>
            ${badgeCheat}
        </div>
        
        <div style="flex: 1; text-align: center; display: flex; flex-direction: column; align-items: center;">
            <div>
                <span style="font-weight: 700; color: var(--accent-primary); font-size: 1.1rem;">${recipe.totalCalories}</span>
                <span style="font-size: 0.85rem; color: var(--text-secondary);"> kcal</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${recipe.ingredients.length} ing.</div>
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
        if(confirm(`Voulez-vous vraiment supprimer "${recipe.name}" ?`)) {
            await db.collection("users").doc(currentUserId).collection("recipes").doc(id).delete();
            loadRecipes();
        }
    });

    card.querySelector('.edit-btn').addEventListener('click', () => {
        openModal(true);
        editingRecipeId = id;
        document.getElementById('recipe-modal-title').textContent = "Modifier la recette";
        
        document.getElementById('recipe-name').value = recipe.name;
        document.getElementById('recipe-category').value = recipe.category;
        document.getElementById('recipe-is-cheat').checked = recipe.isCheat;
        
        ingredientsList.innerHTML = '';
        recipe.ingredients.forEach(ing => {
            ingredientsList.appendChild(createIngredientRow(ing.ingredientId, ing.quantity));
        });
        
        updateTotalCalories();
    });

    recipesGrid.appendChild(card);
}
