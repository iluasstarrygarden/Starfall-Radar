// script.js — full replacement
// Expects a canvas with id="radarChart" and a .wrap container in the HTML.
// Matches CSS that pins the canvas to 340x340 and centers it over the panel.

async function fetchStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

/**
 * Choose a "nice" upper bound for the radar based on the largest stat value.
 * Caps at 500.
 */
function chooseChartMax(values) {
  const rawMax = Math.max(...values, 0);

  if (rawMax <= 10) return 10;
  if (rawMax <= 25) return 25;
  if (rawMax <= 50) return 50;
  if (rawMax <= 100) return 100;
  if (rawMax <= 200) return 200;
  if (rawMax <= 300) return 300;
  if (rawMax <= 400) return 400;
  return 500;
}

function createRadarChart(labels, values) {
  // --- LOCK canvas pixel size to the CSS target (prevents Chart.js from resizing) ---
  // These numbers should match your CSS (#radarChart width/height).
  const CANVAS_PX = 340;
  const canvas = document.getElementById("radarChart");

  if (!canvas) {
    console.error("No canvas with id 'radarChart' found in the document.");
    return;
  }

  // Set the actual drawing buffer (pixel) size to guarantee consistent rendering.
  // This prevents Chart.js from auto-scaling the canvas when the iframe changes size.
  canvas.width = CANVAS_PX;
  canvas.height = CANVAS_PX;

  // Get 2D context
  const ctx = canvas.getContext("2d");

  // If a prior chart instance exists, destroy it to avoid duplicates
  if (window._radarChartInstance) {
    try {
      window._radarChartInstance.destroy();
    } catch (e) {
      // ignore
    }
    window._radarChartInstance = null;
  }

  // Choose dynamic max (capped at 500)
  const chartMax = chooseChartMax(values);

  // Create the Chart.js radar chart — note: responsive: false keeps canvas size fixed.
  window._radarChartInstance = new Chart(ctx, {
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
      // critical: Chart.js will not try to resize the canvas
      responsive: false,
      maintainAspectRatio: false,
      // preserve the aspect ratio when drawing (canvas buffer already square)
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
          max: chartMax, // dynamic based on values
          angleLines: {
            color: "rgba(255, 221, 189, 0.7)" // very soft lines
          },
          grid: {
            color: "rgba(255, 224, 197, 0.55)" // light peach rings
          },
          ticks: {
            display: false
          },
          pointLabels: {
            color: "#64473a", // Notion brown labels
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

/* Entry point: fetch stats and build the chart */
(async () => {
  try {
    const { labels, values } = await fetchStats();

    // Basic validation
    if (!Array.isArray(labels) || !Array.isArray(values) || labels.length !== values.length) {
      throw new Error("Invalid stats payload from /api/stats");
    }

    createRadarChart(labels, values);
  } catch (err) {
    console.error(err);
    const wrap = document.querySelector(".wrap");
    if (wrap) {
      wrap.insertAdjacentHTML(
        "beforeend",
        `<p style="color:#a33939;font-size:0.85rem;margin-top:8px;">Couldn’t load stats from Notion. Check integration, database share, and env vars.</p>`
      );
    }
  }
})();
