async function fetchStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

function createRadarChart(labels, values) {
  const ctx = document.getElementById("radarChart").getContext("2d");

  new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          label: "Current Stat Points",
          data: values,
          fill: true,
          backgroundColor: "rgba(255, 188, 141, 0.22)",   // soft peach glow
          borderColor: "#d98a52",                          // deeper peach outline
          pointBackgroundColor: "#d98a52",                 // warm points
          pointBorderColor: "#fff7ee",
          pointHoverRadius: 5,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      
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
          angleLines: {
            color: "rgba(255, 221, 189, 0.7)"             // very soft lines
          },
          grid: {
            color: "rgba(255, 224, 197, 0.55)"            // light peach rings
          },
          suggestedMin: 0,
          suggestedMax: Math.max(5, ...values) + 1,
          ticks: {
            display: false
          },
          pointLabels: {
            color: "#64473a",                              // Notion brown labels
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
