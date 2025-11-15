async function fetchStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

function createRadarChart(labels, values) {
  const ctx = document.getElementById("radarChart").getContext("2d");

  // 1) Find the highest stat value you currently have
  const rawMax = Math.max(...values, 0);

  // 2) Choose a "nice" upper bound, capped at 500
  let chartMax;
  if (rawMax <= 10) chartMax = 10;
  else if (rawMax <= 25) chartMax = 25;
  else if (rawMax <= 50) chartMax = 50;
  else if (rawMax <= 100) chartMax = 100;
  else if (rawMax <= 200) chartMax = 200;
  else if (rawMax <= 300) chartMax = 300;
  else if (rawMax <= 400) chartMax = 400;
  else chartMax = 500; // hard cap

  new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Current Stat Points",
          data: values,
          fill: true,
          backgroundColor: "rgba(255, 188, 141, 0.22)",  // soft peach glow
          borderColor: "#d98a52",                         // deeper peach outline
          pointBackgroundColor: "#d98a52",                // warm points
          pointBorderColor: "#fff7ee",
          pointHoverRadius: 5,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,

      plugins: {
        legend: { display: false }
      },
      layout: {
        padding: 4
      },
      animation: {
        duration: 700,
        easing: "easeOutQuad"
      },
      scales: {
        r: {
          min: 0,
          max: chartMax,  // 👈 dynamic, up to 500

          angleLines: {
            color: "rgba(255, 221, 189, 0.7)"           // very soft lines
          },
          grid: {
            color: "rgba(255, 224, 197, 0.55)"          // light peach rings
          },
          ticks: {
            display: false
          },
          pointLabels: {
            color: "#64473a",                            // Notion brown labels
            font: {
              size: 11,
              weight: "600"
            }
          }
        }
      }
    }
  });
}

(async () => {
  try {
    const { labels, values } = await fetchStats();
    createRadarChart(labels, values);
  } catch (err) {
    console.error(err);
    const wrap = document.querySelector(".wrap");
    wrap.insertAdjacentHTML(
      "beforeend",
      `<p style="color:#a33939;font-size:0.8rem;margin-top:8px;">Couldn’t load stats from Notion. Check integration, database share, and env vars.</p>`
    );
  }
})();
