// === LOGIQUE SUIVI DU POIDS ===
const weightScreen = document.getElementById('weight-screen');
const weightModal = document.getElementById('weight-modal');
const openWeightModalBtn = document.getElementById('open-weight-modal-btn');
const closeWeightModalBtn = document.getElementById('close-weight-modal-btn');
const cancelWeightBtn = document.getElementById('cancel-weight-btn');
const weightForm = document.getElementById('weight-form');

const weightDateInput = document.getElementById('weight-date');
const weightValueInput = document.getElementById('weight-value');

const currentWeightDisplay = document.getElementById('current-weight-display');
const diffWeightDisplay = document.getElementById('diff-weight-display');
const bestWeightDisplay = document.getElementById('best-weight-display');
const weightHistoryList = document.getElementById('weight-history-list');

let weightUserId = null;
let weightChart = null;
let weightEntries = [];

// Initialisation de la date du jour pour le formulaire
if(weightDateInput) {
    weightDateInput.value = new Date().toISOString().split('T')[0];
}

auth.onAuthStateChanged((user) => {
    if (user) {
        weightUserId = user.uid;
        loadWeights();
    } else {
        weightUserId = null;
        weightEntries = [];
        updateWeightUI();
    }
});

// Écouteur sur le bouton de navigation pour recharger si besoin (optionnel)
document.querySelector('[data-target="weight-screen"]')?.addEventListener('click', () => {
    if(weightUserId && weightEntries.length === 0) {
        loadWeights();
    }
});

// === MODAL ===
function openWeightModal() {
    weightModal.showModal();
}

function closeWeightModal() {
    weightModal.close();
}

if(openWeightModalBtn) openWeightModalBtn.addEventListener('click', openWeightModal);
if(closeWeightModalBtn) closeWeightModalBtn.addEventListener('click', closeWeightModal);
if(cancelWeightBtn) cancelWeightBtn.addEventListener('click', closeWeightModal);

// === SOUMISSION DU POIDS ===
if(weightForm) {
    weightForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!weightUserId) return;

        const dateStr = weightDateInput.value;
        const weightValue = parseFloat(weightValueInput.value);

        if(!dateStr || isNaN(weightValue)) return;

        try {
            const btn = weightForm.querySelector('button[type="submit"]');
            btn.disabled = true;

            // Vérifier s'il y a déjà une entrée pour cette date
            const existing = weightEntries.find(w => w.date === dateStr);
            if (existing) {
                await db.collection("users").doc(weightUserId).collection("weights").doc(existing.id).update({
                    weight: weightValue,
                    updatedAt: new Date().toISOString()
                });
            } else {
                await db.collection("users").doc(weightUserId).collection("weights").add({
                    date: dateStr,
                    weight: weightValue,
                    createdAt: new Date().toISOString()
                });
            }

            closeWeightModal();
            loadWeights();
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du poids:", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            const btn = weightForm.querySelector('button[type="submit"]');
            btn.disabled = false;
        }
    });
}

// === LECTURE ===
async function loadWeights() {
    if (!weightUserId) return;

    try {
        const snapshot = await db.collection("users").doc(weightUserId)
            .collection("weights")
            .orderBy("date", "asc")
            .get();

        weightEntries = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            weightEntries.push(data);
        });

        updateWeightUI();
        updateDashboardWeight(); // Mettre à jour le widget sur le Dashboard
    } catch(e) {
        console.error("Erreur chargement des poids:", e);
    }
}

// === AFFICHAGE ET GRAPHIQUE ===
function updateWeightUI() {
    if (!weightScreen) return;

    if (weightEntries.length === 0) {
        if(currentWeightDisplay) currentWeightDisplay.textContent = "-- kg";
        if(diffWeightDisplay) {
            diffWeightDisplay.textContent = "--";
            diffWeightDisplay.className = "trend muted";
        }
        if(bestWeightDisplay) bestWeightDisplay.textContent = "-- kg";
        if(weightHistoryList) weightHistoryList.innerHTML = '<p class="muted">Aucune pesée enregistrée.</p>';
        updateChart();
        return;
    }

    // Statistiques
    const currentWeight = weightEntries[weightEntries.length - 1].weight;
    const firstWeight = weightEntries[0].weight;
    const bestWeight = Math.min(...weightEntries.map(w => w.weight));

    const diff = currentWeight - firstWeight;
    const isLoss = diff < 0;
    const isGain = diff > 0;
    
    let diffText = diff === 0 ? "Stable" : `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
    let diffClass = "trend " + (isLoss ? "down" : (isGain ? "up" : "muted"));

    if(currentWeightDisplay) currentWeightDisplay.textContent = `${currentWeight.toFixed(1)} kg`;
    if(diffWeightDisplay) {
        diffWeightDisplay.textContent = diffText;
        diffWeightDisplay.className = diffClass;
    }
    if(bestWeightDisplay) bestWeightDisplay.textContent = `${bestWeight.toFixed(1)} kg`;

    // Historique (du plus récent au plus ancien)
    if(weightHistoryList) {
        weightHistoryList.innerHTML = '';
        [...weightEntries].reverse().forEach((entry, index, arr) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.display = 'flex';
            card.style.justifyContent = 'space-between';
            card.style.alignItems = 'center';
            card.style.padding = '0.75rem 1rem';
            card.style.marginBottom = '0.5rem';

            // Formater la date (YYYY-MM-DD -> DD/MM/YYYY)
            const [y, m, d] = entry.date.split('-');
            const displayDate = `${d}/${m}/${y}`;

            // Calculer la différence avec la pesée précédente (qui est la suivante dans le tableau inversé)
            let prevDiffHtml = '';
            if (index < arr.length - 1) {
                const prevEntry = arr[index + 1];
                const wDiff = entry.weight - prevEntry.weight;
                if (wDiff !== 0) {
                    const color = wDiff < 0 ? 'var(--accent-secondary)' : '#ef4444';
                    const sign = wDiff > 0 ? '+' : '';
                    prevDiffHtml = `<span style="font-size: 0.85rem; color: ${color}; margin-left: 0.5rem;">(${sign}${wDiff.toFixed(1)} kg)</span>`;
                } else {
                    prevDiffHtml = `<span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 0.5rem;">(=)</span>`;
                }
            }

            card.innerHTML = `
                <div style="font-weight: 500;">${displayDate}</div>
                <div style="display: flex; align-items: center;">
                    <div style="text-align: right; margin-right: 1rem;">
                        <span style="font-weight: 700; color: var(--accent-primary); font-size: 1.1rem;">${entry.weight.toFixed(1)} kg</span>
                        ${prevDiffHtml}
                    </div>
                    <button class="btn-icon delete-weight-btn" title="Supprimer" style="color: #ef4444; padding: 0.25rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;

            card.querySelector('.delete-weight-btn').addEventListener('click', async () => {
                if(confirm(`Supprimer la pesée du ${displayDate} ?`)) {
                    await db.collection("users").doc(weightUserId).collection("weights").doc(entry.id).delete();
                    loadWeights();
                }
            });

            weightHistoryList.appendChild(card);
        });
    }

    updateChart();
}

function updateChart() {
    const ctx = document.getElementById('weight-chart');
    if (!ctx) return;

    if (weightChart) {
        weightChart.destroy();
    }

    const labels = weightEntries.map(e => {
        const [y, m, d] = e.date.split('-');
        return `${d}/${m}`;
    });
    const dataPoints = weightEntries.map(e => e.weight);

    // Récupération des couleurs CSS
    const rootStyles = getComputedStyle(document.documentElement);
    const primaryColor = rootStyles.getPropertyValue('--accent-primary').trim();
    const surfaceColor = rootStyles.getPropertyValue('--surface-color').trim();
    const textColor = rootStyles.getPropertyValue('--text-secondary').trim();

    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Poids (kg)',
                data: dataPoints,
                borderColor: primaryColor,
                backgroundColor: primaryColor + '33', // 20% opacity
                borderWidth: 3,
                pointBackgroundColor: surfaceColor,
                pointBorderColor: primaryColor,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: surfaceColor,
                    titleColor: rootStyles.getPropertyValue('--text-primary').trim(),
                    bodyColor: rootStyles.getPropertyValue('--text-primary').trim(),
                    borderColor: rootStyles.getPropertyValue('--border-color').trim(),
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return context.parsed.y + ' kg';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        maxTicksLimit: 10
                    }
                },
                y: {
                    grid: {
                        color: rootStyles.getPropertyValue('--border-color').trim(),
                        drawBorder: false,
                    },
                    ticks: {
                        color: textColor,
                        padding: 10
                    },
                    suggestedMin: Math.min(...dataPoints) - 2,
                    suggestedMax: Math.max(...dataPoints) + 2
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}

function updateDashboardWeight() {
    const dashWeightDisplay = document.querySelector('#dashboard-screen .widget-weight .value');
    const dashTrendDisplay = document.querySelector('#dashboard-screen .widget-weight .trend');

    if (weightEntries.length === 0) {
        if(dashWeightDisplay) dashWeightDisplay.textContent = '--';
        if(dashTrendDisplay) {
            dashTrendDisplay.textContent = 'En attente de données';
            dashTrendDisplay.className = 'trend muted';
        }
        return;
    }

    const currentWeight = weightEntries[weightEntries.length - 1].weight;
    if(dashWeightDisplay) dashWeightDisplay.textContent = currentWeight.toFixed(1);

    if (weightEntries.length >= 2) {
        const prevWeight = weightEntries[weightEntries.length - 2].weight;
        const diff = currentWeight - prevWeight;
        const isLoss = diff < 0;
        const isGain = diff > 0;
        
        let diffText = diff === 0 ? "Stable" : `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
        let diffClass = "trend " + (isLoss ? "down" : (isGain ? "up" : "muted"));

        if(dashTrendDisplay) {
            dashTrendDisplay.textContent = diffText;
            dashTrendDisplay.className = diffClass;
        }
    } else {
        if(dashTrendDisplay) {
            dashTrendDisplay.textContent = "Pesée initiale";
            dashTrendDisplay.className = "trend muted";
        }
    }
}
