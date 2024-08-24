let applications = JSON.parse(localStorage.getItem('jobApplications')) || [];
let chart;
let currentGrouping = 'none';
let currentSort = { column: null, direction: 'asc' };

const applicationsBody = document.getElementById('applications-body');
const addApplicationBtn = document.getElementById('add-application-btn');
const addApplicationModal = document.getElementById('add-application-modal');
const addApplicationForm = document.getElementById('add-application-form');
const viewOptions = document.getElementById('view-options');
const quoteElement = document.getElementById('motivational-quote');
const tableHeader = document.querySelector('table thead tr');

function saveApplications() {
    localStorage.setItem('jobApplications', JSON.stringify(applications));
}

function renderApplications() {
    applicationsBody.innerHTML = '';
    let groupedApplications;

    if (currentGrouping === 'company') {
        groupedApplications = groupByKey(applications, 'company');
    } else if (currentGrouping === 'stage') {
        groupedApplications = groupByKey(applications, 'stage');
    } else {
        groupedApplications = { 'All Applications': applications };
    }

    for (const [group, apps] of Object.entries(groupedApplications)) {
        const groupHeader = document.createElement('tr');
        groupHeader.innerHTML = `<th colspan="5">${group} (${apps.length})</th>`;
        applicationsBody.appendChild(groupHeader);

        const sortedApps = sortApplications(apps);

        sortedApps.forEach((app, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${app.date}</td>
                <td><span class="stage-tag ${app.stage.toLowerCase().replace(' ', '-')}">${app.stage}</span></td>
                <td>${app.company}</td>
                <td>${app.position}</td>
                <td>
                    <button class="action-btn edit-btn" data-id="${index}">Edit</button>
                    <button class="action-btn delete-btn" data-id="${index}">Delete</button>
                </td>
            `;
            applicationsBody.appendChild(row);
        });
    }
    updateCounts();
    updateChart();
}

function sortApplications(apps) {
    if (!currentSort.column) return apps;

    return apps.sort((a, b) => {
        let valueA = a[currentSort.column];
        let valueB = b[currentSort.column];

        if (currentSort.column === 'date') {
            valueA = new Date(valueA);
            valueB = new Date(valueB);
        }

        if (valueA < valueB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

function groupByKey(array, key) {
    return array.reduce((hash, obj) => {
        if (obj[key] === undefined) return hash;
        return Object.assign(hash, { [obj[key]]: (hash[obj[key]] || []).concat(obj) });
    }, {});
}

function updateCounts() {
    document.getElementById('values-count').textContent = applications.length;
    document.getElementById('in-progress-count').textContent = `${applications.filter(app => app.stage !== 'Rejected' && app.stage !== 'Offer').length}/${applications.length}`;
    document.getElementById('total-count').textContent = applications.length;
    document.getElementById('not-empty-count').textContent = applications.filter(app => app.company && app.position).length;
}

function addApplication(e) {
    e.preventDefault();
    const newApp = {
        date: document.getElementById('date').value,
        stage: document.getElementById('stage').value,
        company: document.getElementById('company').value,
        position: document.getElementById('position').value
    };
    applications.push(newApp);
    saveApplications();
    renderApplications();
    addApplicationModal.style.display = 'none';
    addApplicationForm.reset();
}

function deleteApplication(index) {
    applications.splice(index, 1);
    saveApplications();
    renderApplications();
}

function editApplication(index) {
    const app = applications[index];
    document.getElementById('date').value = app.date;
    document.getElementById('stage').value = app.stage;
    document.getElementById('company').value = app.company;
    document.getElementById('position').value = app.position;
    
    addApplicationModal.style.display = 'block';
    addApplicationForm.onsubmit = function(e) {
        e.preventDefault();
        app.date = document.getElementById('date').value;
        app.stage = document.getElementById('stage').value;
        app.company = document.getElementById('company').value;
        app.position = document.getElementById('position').value;
        saveApplications();
        renderApplications();
        addApplicationModal.style.display = 'none';
        addApplicationForm.onsubmit = addApplication;
    };
}

function updateChart() {
    const ctx = document.getElementById('applicationStatsChart').getContext('2d');
    const stageCounts = {
        'To apply': 0,
        'Applied': 0,
        'Interview': 0,
        'Offer': 0,
        'Rejected': 0
    };

    applications.forEach(app => {
        stageCounts[app.stage]++;
    });

    const data = {
        labels: Object.keys(stageCounts),
        datasets: [{
            data: Object.values(stageCounts),
            backgroundColor: [
                '#f1f3f4',
                '#fdecc8',
                '#e9d5ff',
                '#0f9d58',
                '#ea4335'
            ]
        }]
    };

    if (chart) {
        chart.data = data;
        chart.update();
    } else {
        chart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                    },
                    title: {
                        display: true,
                        text: 'Application Stages'
                    }
                }
            }
        });
    }
}

function fetchMotivationalQuote() {
    fetch('https://zenquotes.io/api/random')
        .then(response => response.json())
        .then(data => {
            const quote = data[0];
            quoteElement.innerHTML = `<p>"${quote.q}"</p><p>- ${quote.a}</p>`;
        })
        .catch(error => {
            console.error('Error fetching quote:', error);
            quoteElement.innerHTML = '<p>Stay motivated and keep applying!</p>';
        });
}

addApplicationBtn.onclick = () => {
    addApplicationModal.style.display = 'block';
    addApplicationForm.onsubmit = addApplication;
};

window.onclick = (event) => {
    if (event.target == addApplicationModal) {
        addApplicationModal.style.display = 'none';
    }
};

applicationsBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const index = e.target.getAttribute('data-id');
        deleteApplication(index);
    }
    if (e.target.classList.contains('edit-btn')) {
        const index = e.target.getAttribute('data-id');
        editApplication(index);
    }
});

viewOptions.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const grouping = e.target.getAttribute('data-grouping');
        currentGrouping = grouping;
        document.querySelectorAll('#view-options button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        renderApplications();
    }
});

tableHeader.addEventListener('click', (e) => {
    const column = e.target.getAttribute('data-column');
    if (column) {
        if (currentSort.column === column) {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.column = column;
            currentSort.direction = 'asc';
        }
        renderApplications();
        updateSortIndicators();
    }
});

function updateSortIndicators() {
    const headers = tableHeader.querySelectorAll('th[data-column]');
    headers.forEach(header => {
        const column = header.getAttribute('data-column');
        header.classList.remove('sort-asc', 'sort-desc');
        if (column === currentSort.column) {
            header.classList.add(`sort-${currentSort.direction}`);
        }
    });
}

renderApplications();
fetchMotivationalQuote();