function calculateAndVisualize() {
    const inputStr = document.getElementById('inputArray').value;
    if (!inputStr) return alert("Please enter some values!");

    // Hide instructions, show results and legend
    document.getElementById('instructionBox').classList.add('hidden');
    document.getElementById('legend').classList.remove('hidden');
    document.getElementById('resultText').classList.remove('hidden');

    // Convert string "0,4,0..." to array [0, 4, 0...]
    const heights = inputStr.split(',').map(num => parseInt(num.trim()));

    // Calculate the trapping water levels
    const n = heights.length;
    const leftMax = new Array(n).fill(0);
    const rightMax = new Array(n).fill(0);
    
    leftMax[0] = heights[0];
    for (let i = 1; i < n; i++) leftMax[i] = Math.max(leftMax[i - 1], heights[i]);

    rightMax[n - 1] = heights[n - 1];
    for (let i = n - 2; i >= 0; i--) rightMax[i] = Math.max(rightMax[i + 1], heights[i]);

    let totalWater = 0;
    const waterLevels = []; // To store how much water is at each index

    for (let i = 0; i < n; i++) {
        const waterAtI = Math.min(leftMax[i], rightMax[i]) - heights[i];
        waterLevels.push(waterAtI > 0 ? waterAtI : 0);
        totalWater += waterLevels[i];
    }

    // Update the UI text
    document.getElementById('outputUnits').textContent = totalWater;

    // Call the SVG Generator
    renderSVG(heights, waterLevels);
}

function renderSVG(heights, waterLevels) {
    const container = document.getElementById('visualizationContainer');
    container.innerHTML = ''; // Clear previous drawing

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    
    // Setting SVG dimensions based on input size
    const padding = 40;  // Space for labels
    const barWidth = 45;
    const maxHeightValue = Math.max(...heights, 1) ;
    const chartHeight = 200;
    const chartWidth = heights.length * barWidth;

    svg.setAttribute("width", chartWidth + padding * 2);
    svg.setAttribute("height", chartHeight + padding * 2);

    // Create Y-Axis Labels
    for(let i = 0; i <= maxHeightValue; i++) {
        const yLabel = document.createElementNS(svgNS, "text");
        yLabel.setAttribute("x", padding - 10);
        yLabel.setAttribute("y", chartHeight + padding - (i * (chartHeight/maxHeightValue)));
        yLabel.setAttribute("class", "axis-label");
        yLabel.textContent = i;
        svg.appendChild(yLabel);
    }

    heights.forEach((h, i) => {
        const x = padding + (i * barWidth);
        const scaledH = (h / maxHeightValue) * chartHeight;
        const scaledW = (waterLevels[i] / maxHeightValue) * chartHeight;

        // Group for tooltip interaction
        const group = document.createElementNS(svgNS, "g");
        
        // Block (Wall)
        const wall = document.createElementNS(svgNS, "rect");
        wall.setAttribute("x", x);
        wall.setAttribute("y", chartHeight + padding - scaledH);
        wall.setAttribute("width", barWidth - 5);
        wall.setAttribute("height", scaledH);
        wall.setAttribute("class", "wall-bar");
        group.appendChild(wall);

        // Water with Animation
        if (waterLevels[i] > 0) {
            const water = document.createElementNS(svgNS, "rect");
            water.setAttribute("x", x);
            water.setAttribute("y", chartHeight + padding - scaledH); // Start at wall top
            water.setAttribute("width", barWidth - 5);
            water.setAttribute("height", 0); // Start with 0 height for animation
            water.setAttribute("class", "water-bar");
            
            // CSS Animation trigger
            setTimeout(() => {
                water.setAttribute("y", chartHeight + padding - scaledH - scaledW);
                water.setAttribute("height", scaledW);
            }, 100);
            
            group.appendChild(water);
        }

        // X-Axis Label (Index)
        const xLabel = document.createElementNS(svgNS, "text");
        xLabel.setAttribute("x", x + (barWidth/2) - 5);
        xLabel.setAttribute("y", chartHeight + padding + 20);
        xLabel.setAttribute("class", "axis-label");
        xLabel.textContent = i;
        svg.appendChild(xLabel);

        // Tooltip Interaction
        group.addEventListener('mouseover', (e) => showTooltip(e, i, h, waterLevels[i]));
        group.addEventListener('mouseout', hideTooltip);
        
        svg.appendChild(group);
    });

    container.appendChild(svg);
    saveToHistory(heights.join(','), waterLevels.reduce((a,b)=>a+b, 0));
}

function saveToHistory(input, total) {
    let history = JSON.parse(localStorage.getItem('waterHistory')) || [];
    history.unshift({ input, total, date: new Date().toLocaleTimeString() });
    history = history.slice(0, 5); // Keep last 5 entries
    localStorage.setItem('waterHistory', JSON.stringify(history));
    updateHistoryUI();
}

function updateHistoryUI() {
    const list = document.getElementById('historyList');
    const history = JSON.parse(localStorage.getItem('waterHistory')) || [];
    list.innerHTML = history.map(item => `<li>[${item.input}] → ${item.total} Units (${item.date})</li>`).join('');
}


function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-theme');
    const btn = document.getElementById('themeToggle');
    if (body.classList.contains('dark-theme')) {
        btn.innerHTML = "☀️ Click here for Light Mode";
    } else {
        btn.innerHTML = "🌙 Click here for Dark Mode";
    }
}

function showTooltip(event, index, height, water) {
    const tooltip = document.getElementById('tooltip');
    tooltip.innerHTML = `
        <strong>Index:</strong> ${index}<br>
        <strong>Wall Height:</strong> ${height}<br>
        <strong>Water Trapped:</strong> ${water}
    `;
    tooltip.classList.remove('hidden');
    tooltip.style.left = (event.pageX + 10) + 'px';
    tooltip.style.top = (event.pageY + 10) + 'px';
}

function hideTooltip() {
    document.getElementById('tooltip').classList.add('hidden');

}
