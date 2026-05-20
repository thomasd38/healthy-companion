// === LOGIQUE JOURNAL (CALORIES) ===
const journalScreen = document.getElementById('journal-screen');
const journalDateInput = document.getElementById('journal-date');
const openJournalModalBtn = document.getElementById('open-journal-modal-btn');
const closeJournalModalBtn = document.getElementById('close-journal-modal-btn');
const cancelJournalBtn = document.getElementById('cancel-journal-btn');
const journalModal = document.getElementById('journal-modal');
const journalForm = document.getElementById('journal-form');

const entryTypeSelect = document.getElementById('journal-entry-type');
const recipeGroup = document.getElementById('journal-recipe-group');
const recipeSelect = document.getElementById('journal-recipe-select');
const journalRecipeIngredients = document.getElementById('journal-recipe-ingredients');
const journalRecipeTotal = document.getElementById('journal-recipe-total');
const ingredientGroup = document.getElementById('journal-ingredient-group');
const ingredientSelect = document.getElementById('journal-ingredient-select');
const ingredientQty = document.getElementById('journal-ingredient-qty');
const customGroup = document.getElementById('journal-custom-group');
const customName = document.getElementById('journal-custom-name');
const customCals = document.getElementById('journal-custom-cals');
const mealTimeSelect = document.getElementById('journal-meal-time');

const step1 = document.getElementById('journal-step-1');
const step2 = document.getElementById('journal-step-2');
const step3 = document.getElementById('journal-step-3');
const prev2Btn = document.getElementById('journal-prev-2');
const prev3Btn = document.getElementById('journal-prev-3');
const dot1 = document.getElementById('dot-step-1');
const dot2 = document.getElementById('dot-step-2');
const dot3 = document.getElementById('dot-step-3');

const journalEntriesList = document.getElementById('journal-entries-list');
const journalTotalCalsDisplay = document.getElementById('journal-total-cals');
const journalGoalCalsInput = document.getElementById('journal-goal-cals');
const journalProgressBar = document.getElementById('journal-progress-bar');

let journalUserId = null;
let currentEntries = [];

// Initialisation de la date d'aujourd'hui
const today = new Date().toISOString().split('T')[0];
if(journalDateInput) {
    journalDateInput.value = today;
}

auth.onAuthStateChanged((user) => {
    if (user) {
        journalUserId = user.uid;
        loadJournalGoal();
        loadJournalEntries(journalDateInput.value);
    } else {
        journalUserId = null;
        if(journalEntriesList) journalEntriesList.innerHTML = '';
        currentEntries = [];
        updateJournalUI();
    }
});

if(journalDateInput) {
    journalDateInput.addEventListener('change', () => {
        if (journalUserId) {
            loadJournalEntries(journalDateInput.value);
        }
    });
}

const journalPrevDayBtn = document.getElementById('journal-prev-day');
const journalNextDayBtn = document.getElementById('journal-next-day');

function changeJournalDate(offset) {
    if(!journalDateInput.value) return;
    const [y, m, d] = journalDateInput.value.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + offset);
    
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    
    journalDateInput.value = `${newY}-${newM}-${newD}`;
    journalDateInput.dispatchEvent(new Event('change'));
}

if(journalPrevDayBtn) {
    journalPrevDayBtn.addEventListener('click', () => changeJournalDate(-1));
}
if(journalNextDayBtn) {
    journalNextDayBtn.addEventListener('click', () => changeJournalDate(1));
}

if(journalGoalCalsInput) {
    journalGoalCalsInput.addEventListener('change', async () => {
        const goal = parseInt(journalGoalCalsInput.value) || 2000;
        if (journalUserId) {
            try {
                await db.collection("users").doc(journalUserId).update({ goalCals: goal });
            } catch (e) {
                console.error(e);
            }
        }
        updateJournalUI();
    });
}

async function loadJournalGoal() {
    try {
        const docSnap = await db.collection("users").doc(journalUserId).get();
        if (docSnap.exists) {
            const data = docSnap.data();
            if (data.goalCals) {
                journalGoalCalsInput.value = data.goalCals;
            }
        }
    } catch (e) {
        console.error("Erreur lecture objectif calories:", e);
    }
}

// === MODAL ===
if(entryTypeSelect) {
    entryTypeSelect.addEventListener('change', () => {
        const val = entryTypeSelect.value;
        recipeGroup.style.display = val === 'recipe' ? 'block' : 'none';
        ingredientGroup.style.display = val === 'ingredient' ? 'flex' : 'none';
        customGroup.style.display = val === 'custom' ? 'flex' : 'none';
        
        // Gérer les champs obligatoires selon la sélection
        recipeSelect.required = (val === 'recipe');
        ingredientSelect.required = (val === 'ingredient');
        ingredientQty.required = (val === 'ingredient');
        customName.required = (val === 'custom');
        customCals.required = (val === 'custom');
    });
}

function showStep(step) {
    if(step1) step1.style.display = step === 1 ? 'block' : 'none';
    if(step2) step2.style.display = step === 2 ? 'block' : 'none';
    if(step3) step3.style.display = step === 3 ? 'block' : 'none';

    if(dot1) dot1.style.background = step >= 1 ? 'var(--accent-primary)' : 'var(--surface-hover)';
    if(dot2) dot2.style.background = step >= 2 ? 'var(--accent-primary)' : 'var(--surface-hover)';
    if(dot3) dot3.style.background = step >= 3 ? 'var(--accent-primary)' : 'var(--surface-hover)';
}

document.querySelectorAll('.selection-card').forEach(card => {
    card.addEventListener('click', (e) => {
        const step = card.getAttribute('data-step');
        const value = card.getAttribute('data-value');
        
        // Retirer la sélection précédente
        document.querySelectorAll(`.selection-card[data-step="${step}"]`).forEach(c => c.classList.remove('selected'));
        // Ajouter la sélection courante
        card.classList.add('selected');

        if (step === '1') {
            if(mealTimeSelect) mealTimeSelect.value = value;
            setTimeout(() => showStep(2), 200); // léger délai pour l'effet visuel
        } else if (step === '2') {
            if(entryTypeSelect) {
                entryTypeSelect.value = value;
                entryTypeSelect.dispatchEvent(new Event('change'));
            }
            setTimeout(() => showStep(3), 200);
        }
    });
});

if(prev2Btn) prev2Btn.addEventListener('click', () => showStep(1));
if(prev3Btn) prev3Btn.addEventListener('click', () => showStep(2));

function renderRecipeIngredientsForJournal() {
    if(!journalRecipeIngredients) return;
    journalRecipeIngredients.innerHTML = '';
    const recipeId = recipeSelect.value;
    if(!recipeId) {
        if(journalRecipeTotal) journalRecipeTotal.textContent = '0 kcal';
        return;
    }
    
    const recipe = window.userRecipes.find(r => r.id === recipeId);
    if(!recipe) return;

    let currentTotal = 0;

    recipe.ingredients.forEach((ing) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.alignItems = 'center';
        row.style.padding = '0.5rem';
        row.style.background = 'var(--bg-color)';
        row.style.borderRadius = 'var(--radius-md)';
        row.style.border = '1px solid var(--border-color)';

        const cals = ing.calories;
        currentTotal += cals;

        row.innerHTML = `
            <div style="flex: 2; font-size: 0.95rem; font-weight: 500;">${ing.name}</div>
            <div style="flex: 1; display: flex; align-items: center; gap: 0.5rem; justify-content: center;">
                <input type="number" class="form-input journal-recipe-ing-qty" data-calsper100="${ing.caloriesPer100}" value="${ing.quantity}" min="0" style="padding: 0.4rem; width: 70px; text-align: center;">
                <span style="font-size: 0.85rem; color: var(--text-secondary);">g</span>
            </div>
            <div style="flex: 1; text-align: right; font-weight: 500; color: var(--text-secondary);" class="journal-recipe-ing-cals" data-cals="${cals}">
                ${cals} kcal
            </div>
        `;

        const qtyInput = row.querySelector('.journal-recipe-ing-qty');
        const calsDisplay = row.querySelector('.journal-recipe-ing-cals');

        qtyInput.addEventListener('input', () => {
            const newQty = parseInt(qtyInput.value) || 0;
            const calsPer100 = parseFloat(qtyInput.getAttribute('data-calsper100')) || 0;
            const newCals = Math.round((calsPer100 * newQty) / 100);
            calsDisplay.textContent = `${newCals} kcal`;
            calsDisplay.setAttribute('data-cals', newCals);
            updateJournalRecipeTotal();
        });

        journalRecipeIngredients.appendChild(row);
    });

    if(journalRecipeTotal) journalRecipeTotal.textContent = `${currentTotal} kcal`;
}

function updateJournalRecipeTotal() {
    let total = 0;
    document.querySelectorAll('.journal-recipe-ing-cals').forEach(el => {
        total += parseInt(el.getAttribute('data-cals')) || 0;
    });
    if(journalRecipeTotal) journalRecipeTotal.textContent = `${total} kcal`;
}

if(recipeSelect) {
    recipeSelect.addEventListener('change', renderRecipeIngredientsForJournal);
}

function openJournalModal() {
    // Remplir les dropdowns depuis les variables globales
    recipeSelect.innerHTML = '<option value="" disabled selected>Choisir une recette</option>';
    if (window.userRecipes) {
        window.userRecipes.forEach(r => {
            recipeSelect.innerHTML += `<option value="${r.id}" data-cals="${r.totalCalories}">${r.name} (${r.totalCalories} kcal)</option>`;
        });
    } else {
        recipeSelect.innerHTML += '<option value="" disabled>Aucune recette trouvée</option>';
    }

    ingredientSelect.innerHTML = '<option value="" disabled selected>Choisir un ingrédient</option>';
    if (window.userIngredients) {
        window.userIngredients.forEach(i => {
            ingredientSelect.innerHTML += `<option value="${i.id}" data-cals="${i.caloriesPer100}">${i.name} (${i.caloriesPer100} kcal/100g)</option>`;
        });
    }

    journalForm.reset();
    if(mealTimeSelect) mealTimeSelect.value = '';
    if(entryTypeSelect) entryTypeSelect.value = '';
    document.querySelectorAll('.selection-card').forEach(c => c.classList.remove('selected'));
    
    if(journalRecipeIngredients) journalRecipeIngredients.innerHTML = '';
    if(journalRecipeTotal) journalRecipeTotal.textContent = '0 kcal';
    
    showStep(1);
    if(entryTypeSelect) entryTypeSelect.dispatchEvent(new Event('change'));
    journalModal.showModal();
}

function closeJournalModal() {
    journalModal.close();
}

if(openJournalModalBtn) openJournalModalBtn.addEventListener('click', openJournalModal);
if(closeJournalModalBtn) closeJournalModalBtn.addEventListener('click', closeJournalModal);
if(cancelJournalBtn) cancelJournalBtn.addEventListener('click', closeJournalModal);

// Soumission du formulaire du journal
if(journalForm) {
    journalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!journalUserId) return;

        const dateStr = journalDateInput.value;
        const type = entryTypeSelect.value;
        const mealTime = mealTimeSelect.value;
        
        let name = "";
        let calories = 0;

        let customIngredients = null;

        if (type === 'recipe') {
            const opt = recipeSelect.options[recipeSelect.selectedIndex];
            if(!opt.value) return alert("Sélectionnez une recette");
            name = opt.text.split(' (')[0];
            
            calories = 0;
            customIngredients = [];
            
            document.querySelectorAll('#journal-recipe-ingredients > div').forEach(row => {
                const ingName = row.children[0].textContent;
                const qtyInput = row.querySelector('.journal-recipe-ing-qty');
                const qty = parseInt(qtyInput.value) || 0;
                const cals = parseInt(row.querySelector('.journal-recipe-ing-cals').getAttribute('data-cals')) || 0;
                
                calories += cals;
                customIngredients.push({ name: ingName, quantity: qty, calories: cals });
            });
            
            if (calories === 0 && customIngredients.length === 0) {
                calories = parseInt(opt.getAttribute('data-cals')) || 0;
            }
        } else if (type === 'ingredient') {
            const opt = ingredientSelect.options[ingredientSelect.selectedIndex];
            if(!opt.value) return alert("Sélectionnez un ingrédient");
            name = opt.text.split(' (')[0];
            const calsPer100 = parseFloat(opt.getAttribute('data-cals')) || 0;
            const qty = parseInt(ingredientQty.value) || 0;
            name += ` (${qty}g)`;
            calories = Math.round((calsPer100 * qty) / 100);
        } else {
            name = customName.value.trim();
            calories = parseInt(customCals.value) || 0;
        }

        const entryData = {
            date: dateStr,
            type,
            name,
            calories,
            mealTime,
            createdAt: new Date().toISOString()
        };
        
        if (customIngredients) {
            entryData.ingredients = customIngredients;
        }

        try {
            const btn = journalForm.querySelector('button[type="submit"]');
            btn.disabled = true;

            await db.collection("users").doc(journalUserId).collection("journal").add(entryData);

            closeJournalModal();
            loadJournalEntries(dateStr);
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'ajout au journal.");
        } finally {
            const btn = journalForm.querySelector('button[type="submit"]');
            btn.disabled = false;
        }
    });
}

async function loadJournalEntries(dateStr) {
    if (!journalUserId) return;

    try {
        const snapshot = await db.collection("users").doc(journalUserId)
            .collection("journal")
            .where("date", "==", dateStr)
            .get();

        currentEntries = [];
        snapshot.forEach(doc => {
            const entry = doc.data();
            entry.id = doc.id;
            currentEntries.push(entry);
        });
        
        // Tri par date d'ajout
        currentEntries.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

        updateJournalUI();
        updateDashboardWidget(); // Mettre à jour le widget sur le Dashboard
    } catch(e) {
        console.error(e);
    }
}

function updateJournalUI() {
    let totalCals = 0;
    if(journalEntriesList) journalEntriesList.innerHTML = '';

    if (currentEntries.length === 0) {
        if(journalEntriesList) journalEntriesList.innerHTML = '<p class="muted">Aucun repas enregistré pour ce jour.</p>';
    } else {
        currentEntries.forEach(entry => {
            totalCals += entry.calories;
            
            let timeLabel = entry.mealTime;
            if(timeLabel === 'petit-dejeuner') timeLabel = 'Petit-déjeuner';
            else if(timeLabel === 'dejeuner') timeLabel = 'Déjeuner';
            else if(timeLabel === 'diner') timeLabel = 'Dîner';
            else if(timeLabel === 'collation') timeLabel = 'Collation';

            const card = document.createElement('div');
            card.className = 'card';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.padding = '1rem';
            
            card.innerHTML = `
                <div>
                    <strong style="display: block; font-size: 1.05rem; margin-bottom: 0.25rem;">${entry.name}</strong>
                    <span class="recipe-badge">${timeLabel}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="text-align: right;">
                        <span style="font-weight: 700; color: var(--accent-primary); font-size: 1.1rem;">${entry.calories}</span>
                        <span style="font-size: 0.85rem; color: var(--text-secondary);"> kcal</span>
                    </div>
                    <button class="btn-icon delete-entry-btn" title="Supprimer" style="color: #ef4444; padding: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;

            card.querySelector('.delete-entry-btn').addEventListener('click', async () => {
                if(confirm(`Supprimer l'entrée "${entry.name}" ?`)) {
                    await db.collection("users").doc(journalUserId).collection("journal").doc(entry.id).delete();
                    loadJournalEntries(journalDateInput.value);
                }
            });

            if(journalEntriesList) journalEntriesList.appendChild(card);
        });
    }

    if(journalTotalCalsDisplay) journalTotalCalsDisplay.textContent = totalCals;
    const goal = parseInt(journalGoalCalsInput ? journalGoalCalsInput.value : 2000) || 2000;
    
    let pct = (totalCals / goal) * 100;
    if (pct > 100) pct = 100;
    
    if(journalProgressBar) {
        journalProgressBar.style.width = pct + '%';
        if (totalCals > goal) {
            journalProgressBar.style.backgroundColor = '#ef4444'; // rouge si dépassement
        } else {
            journalProgressBar.style.backgroundColor = 'var(--accent-primary)';
        }
    }
}

// Fonction pour mettre à jour le Dashboard si c'est aujourd'hui
function updateDashboardWidget() {
    const todayStr = new Date().toISOString().split('T')[0];
    if (journalDateInput.value !== todayStr) return; // on ne met à jour le dashboard que pour le jour actuel

    // Widget Dashboard (doit exister dans index.html)
    const dashVal = document.querySelector('#dashboard-screen .main-stat .value');
    const dashUnit = document.querySelector('#dashboard-screen .main-stat .unit');
    const dashProgress = document.querySelector('#dashboard-screen .progress-bar');
    const dashMealList = document.querySelector('#dashboard-screen .meal-list');
    
    let totalCals = 0;
    currentEntries.forEach(e => totalCals += e.calories);
    
    if(dashVal) dashVal.textContent = totalCals;
    
    const goal = parseInt(journalGoalCalsInput.value) || 2000;
    if(dashUnit) dashUnit.textContent = `/ ${goal} kcal`;
    
    let pct = (totalCals / goal) * 100;
    if (pct > 100) pct = 100;
    
    if(dashProgress) {
        dashProgress.style.width = pct + '%';
        dashProgress.style.backgroundColor = totalCals > goal ? '#ef4444' : 'var(--accent-primary)';
    }

    if(dashMealList) {
        dashMealList.innerHTML = '';
        if (currentEntries.length === 0) {
            dashMealList.innerHTML = '<li class="meal-item empty">Aucun repas planifié</li>';
        } else {
            currentEntries.forEach(entry => {
                const li = document.createElement('li');
                li.className = 'meal-item';
                li.innerHTML = `
                    <span>${entry.name}</span>
                    <span style="font-weight:600;">${entry.calories} kcal</span>
                `;
                dashMealList.appendChild(li);
            });
        }
    }
}
