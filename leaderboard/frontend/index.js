// Replace with your Render URL once deployed (e.g., "https://your-app.onrender.com")
const API_URL = "https://researchandtest.onrender.com/";

const form = document.getElementById("score-form");
const nameInput = document.getElementById("name-input");
const scoreInput = document.getElementById("score-input");
const banner = document.getElementById("result-banner");
const tbody = document.getElementById("leaderboard-body");

function renderTable(entries) {
    tbody.innerHTML = "";
    if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="color: var(--muted);">No scores yet.</td></tr>`;
    return;
    }

    entries.forEach((entry, idx) => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${idx + 1}</td>
        <td></td>
        <td>${entry.score}</td>
    `;
    // Use textContent for user-submitted names to prevent XSS
    row.children[1].textContent = entry.name;
    tbody.appendChild(row);
    });
}

async function loadLeaderboard() {
    try {
    const res = await fetch(`${API_URL}/api/leaderboard`);
    const data = await res.json();
    renderTable(data.leaderboard);
    banner.textContent = "";
    } catch (err) {
    banner.textContent = "Could not reach backend (if on Render, it may be waking up).";
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    banner.textContent = "Submitting...";

    try {
    const res = await fetch(`${API_URL}/api/leaderboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        name: nameInput.value,
        score: Number(scoreInput.value)
        })
    });

    const data = await res.json();
    if (!res.ok) {
        banner.textContent = data.error || "Submission failed.";
        return;
    }

    renderTable(data.leaderboard);

    if (data.made_top_ten) {
        banner.textContent = `Nice! ${nameInput.value} placed #${data.rank}.`;
    } else {
        banner.textContent = `${nameInput.value} placed #? (outside the top 10).`;
    }

    form.reset();
    } catch (err) {
    banner.textContent = "Network error submitting score.";
    }
});

loadLeaderboard();
