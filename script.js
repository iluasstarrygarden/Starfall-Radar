// script.js — complete replacement (updated: no dots, stronger outline, softer mesh)
// Expects:
//  - a <canvas id="radarChart"></canvas> in the page
//  - a .wrap container for error messages
// Canvas/CSS should pin visual size to 340x340 (CSS/HTML handles layout).

// --- Fetch stats from your /api/stats endpoint ---
async function fetchStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// --- Choose a "nice" upper bound for the chart (capped at 500) ---
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

// --- Build the radar chart (single changeable function for styling) ---
function createRadarChart(labels, rawValues) {
  // target canvas pixel size — keep consistent with your CSS
  const CANVAS_PX = 380;
  const canvas = document.getElementById("radarChart");
  if (!canvas) {
    console.error("createRadarChart: canvas #radarChart not found");
    return;
  }

  // force the drawing buffer size (prevents Chart.js from auto-resizing)
  canvas.width = CANVAS_PX;
  canvas.height = CANVAS_PX;

  const ctx = canvas.getContext("2d");

  // convert/clean values into numbers (protects against stringy Notion results)
  const values = rawValues.map(v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });

  // destroy previous instance if present
  if (window._radarChartInstance) {
    try { window._radarChartInstance.destroy(); } catch (e) {}
    window._radarChartInstance = null;
  }

  // choose a dynamic max based on data
  const chartMax = chooseChartMax(values);

  // create a warm radial gradient for the polygon fill
  const grad = ctx.createRadialGradient(
    CANVAS_PX / 2, CANVAS_PX / 2, CANVAS_PX * 0.05,
    CANVAS_PX / 2, CANVAS_PX / 2, CANVAS_PX * 0.6
  );
  grad.addColorStop(0, "rgba(255,215,170,0.30)");
  grad.addColorStop(0.55, "rgba(255,188,141,0.22)");
  grad.addColorStop(1, "rgba(255,188,141,0.02)");

  // dataset styling (no points, thin mesh, stronger outline)
  const dataset = {
    label: "Current Stat Points",
    data: values,
    fill: true,
    backgroundColor: grad,
    borderColor: "rgba(217,138,82,0.92)", // strong outline
    borderWidth: 1.1,                     // clean & defined
    pointRadius: 0,                       // NO visible dots
    pointHoverRadius: 0,
    tension: 0.08,                        // gentle smoothing
    hoverBorderWidth: 0
  };

  // Create chart instance (responsive false so canvas stays fixed)
  window._radarChartInstance = new Chart(ctx, {
    type: "radar",
    data: { labels, datasets: [dataset] },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      aspectRatio: 1,

      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "rgba(255,255,255,0.98)",
          titleColor: "#2b1a12",
          bodyColor: "#2b1a12",
          borderColor: "rgba(0,0,0,0.04)",
          borderWidth: 1
        }
      },

      layout: { padding: 6 },

      animation: { duration: 700, easing: "easeOutQuad" },

      elements: {
        line: { borderJoinStyle: "round" },
        point: { hoverBorderWidth: 0 }
      },

      scales: {
        r: {
          min: 0,
          max: chartMax,
          beginAtZero: true,

          // spokes
          angleLines: {
            color: "rgba(217,138,82,0.20)",
            lineWidth: 1
          },

          // inner mesh grid
          grid: {
            color: "rgba(217,138,82,0.10)",
            lineWidth: 1
          },

          ticks: { display: false },

          pointLabels: {
            color: "#6b4f42",
            font: { size: 11, weight: "600" },
            padding: 10
          }
        }
      }
    }
  });
}

// --- Entry point: fetch & render; friendly error message on failure ---
(async () => {
  try {
    const { labels, values } = await fetchStats();

    // Basic validation
    if (!Array.isArray(labels) || !Array.isArray(values) || labels.length !== values.length) {
      throw new Error("Invalid /api/stats payload — labels/values mismatch");
    }

    createRadarChart(labels, values);
  } catch (err) {
    console.error("Radar init error:", err);
    const wrap = document.querySelector(".wrap");
    if (wrap) {
      const prev = wrap.querySelector(".radar-error");
      if (prev) prev.remove();

      wrap.insertAdjacentHTML(
        "beforeend",
        `<p class="radar-error" style="color:#a33939;font-size:0.9rem;margin-top:8px;">Couldn’t load stats from Notion. Check integration, database share, and env vars.</p>`
      );
    }
  }
})();
