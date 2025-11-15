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
          backgroundColor: "rgba(106, 184, 255, 0.18)", // soft blue fill
          borderColor: "rgba(106, 184, 255, 0.95)",
          pointBackgroundColor: "#ffb16a",
          pointBorderColor: "#ffffff",
          pointHoverRadius: 5,
          borderWidth: 2
        }
      ]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        r: {
          angleLines: {
            color: "rgba(255, 255, 255, 0.7)"
          },
          grid: {
            color: "rgba(255, 255, 255, 0.65)"
          },
          suggestedMin: 0,
          suggestedMax: Math.max(5, ...values) + 1,
          ticks: {
            display: false
          },
          pointLabels: {
            color: "#5a3a2a",
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
    const wrap = document.querySelector(".card");
    wrap.insertAdjacentHTML(
      "beforeend",
      `<p style="color:#a33939;font-size:0.8rem;margin-top:8px;">Couldn’t load stats from Notion. Check integration, database share, and env vars.</p>`
    );
  }
})();
