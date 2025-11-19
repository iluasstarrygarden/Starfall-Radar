// script.js — complete replacement
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

// --- Build the radar chart (entire function / single place to change styles) ---
function createRadarChart(labels, rawValues) {
  // target canvas pixel size — keep consistent with your CSS
  const CANVAS_PX = 340;
  const canvas = document.getElementById("radarChart");
  if (!canvas) {
    console.error("createRadarChart: canvas #radarChart not found");
    return;
  }

  // force the actual drawing buffer size (prevents Chart.js from auto-resizing)
  canvas.width = CANVAS_PX;
  canvas.height = CANVAS_PX;

  const ctx = canvas.getContext("2d");

  // convert/clean values into numbers (protect against string values)
  const values = rawValues.map(v => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });

  // destroy previous instance if present
  if (window._radarChartInstance) {
    try { window._radarChartInstance.destroy(); } catch (e) { /* ignore */ }
    window._radarChartInstance = null;
  }

  // determine dynamic max
  const chartMax = chooseChartMax(values);

  // create a warm radial gradient for the polygon fill
  // (center -> edges; alpha tuned for subtlety)
  const grad = ctx.createRadialGradient(
    CANVAS_PX / 2, CANVAS_PX / 2, CANVAS_PX * 0.05,
    CANVAS_PX / 2, CANVAS_PX / 2, CANVAS_PX * 0.6
  );
  grad.addColorStop(0, "rgba(255,215,170,0.28)");
  grad.addColorStop(0.55, "rgba(255,188,141,0.20)");
  grad.addColorStop(1, "rgba(255,188,141,0.02)");

  // dataset styling: thin outline, subtle fill, minimal points
  const dataset = {
    label: "Current Stat Points",
    data: values,
    fill: true,
    backgroundColor: grad,
    borderColor: "rgba(217,138,82,0.72)",
    borderWidth: 1.1,
    pointRadius: 3.2,
    pointStyle: "circle",
    pointBackgroundColor: "rgba(217,138,82,0.9)",
    pointBorderColor: "rgba(255,255,255,0)", // no thick point border
    pointHoverRadius: 5,
    tension: 0.15
  };

  // create chart (responsive disabled so canvas stays fixed)
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
          borderWidth: 1,
          /* subtle shadow handled by CSS in embed if desired */
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
          grid: {
            color: "rgba(255,224,197,0.16)", // faint rings
            lineWidth: 1
          },
          angleLines: {
            color: "rgba(255,224,197,0.08)"  // extremely faint spokes
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

// --- Entry point: fetch & render; show a friendly error message in .wrap on failure ---
(async () => {
  try {
    const { labels, values } = await fetchStats();

    // basic validation: arrays & equal length
    if (!Array.isArray(labels) || !Array.isArray(values) || labels.length !== values.length) {
      throw new Error("Invalid /api/stats payload — labels/values mismatch");
    }

    createRadarChart(labels, values);
  } catch (err) {
    console.error("Radar init error:", err);
    const wrap = document.querySelector(".wrap");
    if (wrap) {
      // remove any existing message first
      const prev = wrap.querySelector(".radar-error");
      if (prev) prev.remove();

      wrap.insertAdjacentHTML(
        "beforeend",
        `<p class="radar-error" style="color:#a33939;font-size:0.9rem;margin-top:8px;">Couldn’t load stats from Notion. Check integration, database share, and env vars.</p>`
      );
    }
  }
})();
