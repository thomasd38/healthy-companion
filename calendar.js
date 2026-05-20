const calendarScreen = document.getElementById('calendar-screen');
const calPrevMonth = document.getElementById('cal-prev-month');
const calNextMonth = document.getElementById('cal-next-month');
const calMonthYear = document.getElementById('cal-month-year');
const calendarGrid = document.getElementById('calendar-grid');

let currentDate = new Date();
let calendarUserId = null;
let currentGoal = 2000;

auth.onAuthStateChanged(async (user) => {
    if (user) {
        calendarUserId = user.uid;
        await loadCalendarGoal();
        renderCalendar();
    } else {
        calendarUserId = null;
        if(calendarGrid) calendarGrid.innerHTML = '';
    }
});

document.querySelector('[data-target="calendar-screen"]')?.addEventListener('click', () => {
    if(calendarUserId) {
        loadCalendarGoal().then(() => renderCalendar());
    }
});

calPrevMonth?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

calNextMonth?.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

async function loadCalendarGoal() {
    try {
        const docSnap = await db.collection("users").doc(calendarUserId).get();
        if (docSnap.exists) {
            const data = docSnap.data();
            if (data.goalCals) {
                currentGoal = data.goalCals;
            }
        }
    } catch (e) {
        console.error("Erreur lecture objectif calories:", e);
    }
}

async function renderCalendar() {
    if (!calendarUserId) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
    if(calMonthYear) calMonthYear.textContent = `${monthNames[month]} ${year}`;

    const startStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endStr = `${year}-${String(month + 1).padStart(2, '0')}-31`;

    let monthData = {};

    try {
        const snapshot = await db.collection("users").doc(calendarUserId)
            .collection("journal")
            .where("date", ">=", startStr)
            .where("date", "<=", endStr)
            .get();

        snapshot.forEach(doc => {
            const entry = doc.data();
            const date = entry.date;
            if (!monthData[date]) monthData[date] = 0;
            monthData[date] += entry.calories;
        });
    } catch(e) {
        console.error("Erreur chargement données mois:", e);
    }

    if(calendarGrid) calendarGrid.innerHTML = '';

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // getDay() => 0=Dimanche, on veut 1=Lundi
    let startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    for (let i = 0; i < startingDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell empty';
        if(calendarGrid) calendarGrid.appendChild(emptyCell);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    for (let d = 1; d <= lastDay.getDate(); d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const cals = monthData[dateStr] || 0;
        
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        
        let indicatorHtml = '';
        if (cals > 0) {
            const statusClass = cals > currentGoal ? 'bad' : 'good';
            indicatorHtml = `<div class="calendar-indicator ${statusClass}"></div>`;
        }
        
        if(dateStr === todayStr) {
            cell.style.borderColor = 'var(--accent-primary)';
        }

        cell.innerHTML = `
            <div class="calendar-date">${d}</div>
            ${cals > 0 ? `<div class="calendar-cals">${cals} kcal</div>` : ''}
            ${indicatorHtml}
        `;

        cell.addEventListener('click', () => {
            const journalDateInput = document.getElementById('journal-date');
            if(journalDateInput) {
                journalDateInput.value = dateStr;
                journalDateInput.dispatchEvent(new Event('change'));
            }
            document.querySelector('[data-target="journal-screen"]')?.click();
        });

        if(calendarGrid) calendarGrid.appendChild(cell);
    }
}
