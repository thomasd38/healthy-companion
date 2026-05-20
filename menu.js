// === GENERATION DE MENUS HEBDOMADAIRES ===
const menuStartDateInput = document.getElementById('menu-start-date');
const menuCheatCountInput = document.getElementById('menu-cheat-count');
const menuTargetCalsInput = document.getElementById('menu-target-cals');
const generateMenuBtn = document.getElementById('generate-menu-btn');
const weeklyMenuGrid = document.getElementById('weekly-menu-grid');
const menuSummary = document.getElementById('menu-summary');

let menuUserId = null;
let currentWeeklyMenu = null;

const mealSlots = [
    { key: 'breakfast', label: 'Petit-déj' },
    { key: 'lunch', label: 'Midi' },
    { key: 'snack', label: 'Goûter' },
    { key: 'dinner', label: 'Soir' }
];

const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

auth.onAuthStateChanged((user) => {
    if (user) {
        menuUserId = user.uid;
        initMenuDefaults();
        loadLatestWeeklyMenu();
    } else {
        menuUserId = null;
        currentWeeklyMenu = null;
        renderWeeklyMenu(null);
    }
});

document.querySelector('[data-target="menu-screen"]')?.addEventListener('click', () => {
    if (menuUserId && !currentWeeklyMenu) {
        loadLatestWeeklyMenu();
    }
});

if (generateMenuBtn) {
    generateMenuBtn.addEventListener('click', generateAndSaveWeeklyMenu);
}

function initMenuDefaults() {
    if (menuStartDateInput && !menuStartDateInput.value) {
        menuStartDateInput.value = getNextMondayDateString();
    }

    const goalInput = document.getElementById('journal-goal-cals');
    if (menuTargetCalsInput && goalInput && goalInput.value) {
        menuTargetCalsInput.value = goalInput.value;
    }
}

function getDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getNextMondayDateString() {
    const date = new Date();
    const day = date.getDay();
    const offset = day === 1 ? 0 : (8 - day) % 7;
    date.setDate(date.getDate() + offset);
    return getDateString(date);
}

function buildDateFromString(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function isCheatRecipe(recipe) {
    return recipe.isCheat || recipe.category === 'fastfood';
}

function getRandomItem(items) {
    if (!items.length) return null;
    return items[Math.floor(Math.random() * items.length)];
}

function pickMeal(slotKey, regularRecipes, cheatRecipes, shouldUseCheat) {
    const snackRecipes = regularRecipes.filter(r => r.category === 'snack' || r.category === 'dessert');
    const mainRecipes = regularRecipes.filter(r => r.category !== 'snack' && r.category !== 'dessert');
    const preferredPool = (slotKey === 'breakfast' || slotKey === 'snack') ? snackRecipes : mainRecipes;
    const fallbackPool = preferredPool.length ? preferredPool : regularRecipes;

    if (shouldUseCheat && cheatRecipes.length) {
        return getRandomItem(cheatRecipes);
    }

    return getRandomItem(fallbackPool.length ? fallbackPool : cheatRecipes);
}

function buildCheatSlots(maxCheats, cheatRecipes) {
    if (!cheatRecipes.length || maxCheats <= 0) return new Set();

    const mainSlots = [];
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        mainSlots.push(`${dayIndex}:lunch`, `${dayIndex}:dinner`);
    }

    const shuffledSlots = [...mainSlots].sort(() => Math.random() - 0.5);
    return new Set(shuffledSlots.slice(0, Math.min(maxCheats, shuffledSlots.length)));
}

function buildWeeklyMenu() {
    const recipes = Array.isArray(window.userRecipes) ? window.userRecipes : [];
    if (!recipes.length) {
        throw new Error("Ajoutez au moins une recette avant de générer un menu.");
    }

    const regularRecipes = recipes.filter(recipe => !isCheatRecipe(recipe));
    const cheatRecipes = recipes.filter(isCheatRecipe);
    const maxCheats = Math.max(0, Math.min(7, parseInt(menuCheatCountInput?.value, 10) || 0));
    const targetCals = Math.max(500, parseInt(menuTargetCalsInput?.value, 10) || 2000);
    const startDateStr = menuStartDateInput?.value || getNextMondayDateString();
    const startDate = buildDateFromString(startDateStr);
    let bestMenu = null;

    for (let attempt = 0; attempt < 80; attempt++) {
        const cheatSlots = buildCheatSlots(maxCheats, cheatRecipes);
        const days = [];

        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + dayIndex);

            const meals = {};
            let totalCalories = 0;

            mealSlots.forEach(slot => {
                const recipe = pickMeal(slot.key, regularRecipes, cheatRecipes, cheatSlots.has(`${dayIndex}:${slot.key}`));
                if (!recipe) return;

                meals[slot.key] = {
                    recipeId: recipe.id,
                    name: recipe.name,
                    calories: recipe.totalCalories || 0,
                    isCheat: isCheatRecipe(recipe),
                    category: recipe.category || 'plat'
                };
                totalCalories += recipe.totalCalories || 0;
            });

            days.push({
                date: getDateString(date),
                dayName: dayNames[date.getDay()],
                meals,
                totalCalories
            });
        }

        const weekTotal = days.reduce((sum, day) => sum + day.totalCalories, 0);
        const averageCalories = Math.round(weekTotal / days.length);
        const cheatCount = days.reduce((sum, day) => {
            return sum + Object.values(day.meals).filter(meal => meal.isCheat).length;
        }, 0);
        const candidate = {
            startDate: startDateStr,
            days,
            targetCalories: targetCals,
            averageCalories,
            weekTotal,
            cheatCount,
            createdAt: new Date().toISOString()
        };

        if (!bestMenu || Math.abs(candidate.averageCalories - targetCals) < Math.abs(bestMenu.averageCalories - targetCals)) {
            bestMenu = candidate;
        }
    }

    return bestMenu;
}

async function generateAndSaveWeeklyMenu() {
    if (!menuUserId) return;

    try {
        generateMenuBtn.disabled = true;
        if ((!window.userRecipes || !window.userRecipes.length) && typeof loadRecipes === 'function') {
            await loadRecipes();
        }
        const weeklyMenu = buildWeeklyMenu();

        const docRef = await db.collection("users").doc(menuUserId)
            .collection("generated_weeks")
            .add(weeklyMenu);

        weeklyMenu.id = docRef.id;
        currentWeeklyMenu = weeklyMenu;
        renderWeeklyMenu(weeklyMenu);
    } catch (error) {
        console.error("Erreur generation menu:", error);
        alert(error.message || "Erreur lors de la génération du menu.");
    } finally {
        generateMenuBtn.disabled = false;
    }
}

async function loadLatestWeeklyMenu() {
    if (!menuUserId) return;

    try {
        const snapshot = await db.collection("users").doc(menuUserId)
            .collection("generated_weeks")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        if (snapshot.empty) {
            renderWeeklyMenu(null);
            return;
        }

        const doc = snapshot.docs[0];
        currentWeeklyMenu = doc.data();
        currentWeeklyMenu.id = doc.id;

        if (menuStartDateInput && currentWeeklyMenu.startDate) {
            menuStartDateInput.value = currentWeeklyMenu.startDate;
        }
        if (menuTargetCalsInput && currentWeeklyMenu.targetCalories) {
            menuTargetCalsInput.value = currentWeeklyMenu.targetCalories;
        }

        renderWeeklyMenu(currentWeeklyMenu);
    } catch (error) {
        console.error("Erreur lecture menu:", error);
    }
}

function renderWeeklyMenu(weeklyMenu) {
    if (!weeklyMenuGrid || !menuSummary) return;

    if (!weeklyMenu) {
        menuSummary.innerHTML = '';
        weeklyMenuGrid.innerHTML = '<p class="muted">Aucun menu généré pour le moment.</p>';
        return;
    }

    menuSummary.innerHTML = `
        <article class="card menu-summary-card">
            <span>Moyenne</span>
            <strong>${weeklyMenu.averageCalories} kcal</strong>
        </article>
        <article class="card menu-summary-card">
            <span>Objectif moyen</span>
            <strong>${weeklyMenu.targetCalories} kcal</strong>
        </article>
        <article class="card menu-summary-card">
            <span>Total semaine</span>
            <strong>${weeklyMenu.weekTotal} kcal</strong>
        </article>
        <article class="card menu-summary-card">
            <span>Cheat meals</span>
            <strong>${weeklyMenu.cheatCount}</strong>
        </article>
    `;

    weeklyMenuGrid.innerHTML = '';
    weeklyMenu.days.forEach(day => {
        const card = document.createElement('article');
        card.className = 'card menu-day-card';

        const mealsHtml = mealSlots.map(slot => {
            const meal = day.meals[slot.key];
            if (!meal) {
                return `
                    <li class="menu-meal-row">
                        <span class="menu-meal-slot">${slot.label}</span>
                        <span class="muted">Non défini</span>
                    </li>
                `;
            }

            const cheatBadge = meal.isCheat ? '<span class="recipe-badge cheat">Cheat</span>' : '';
            return `
                <li class="menu-meal-row">
                    <span class="menu-meal-slot">${slot.label}</span>
                    <span class="menu-meal-name">${meal.name} ${cheatBadge}</span>
                    <span class="menu-meal-cals">${meal.calories} kcal</span>
                </li>
            `;
        }).join('');

        card.innerHTML = `
            <div class="menu-day-header">
                <div>
                    <h3>${day.dayName}</h3>
                    <span>${day.date}</span>
                </div>
                <strong>${day.totalCalories} kcal</strong>
            </div>
            <ul class="menu-meals-list">${mealsHtml}</ul>
        `;

        weeklyMenuGrid.appendChild(card);
    });
}
