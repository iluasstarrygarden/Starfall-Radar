// Vercel serverless function: /api/stats
// Calls Notion and returns labels + values for the radar chart

export default async function handler(req, res) {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.DATABASE_ID;

  if (!token || !databaseId) {
    return res.status(500).json({
      error: "Missing NOTION_TOKEN or DATABASE_ID env vars"
    });
  }

  try {
    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          page_size: 100,
          sorts: [
            {
              property: "Stat Name", // property name in your DB
              direction: "ascending"
            }
          ]
        })
      }
    );

    if (!notionRes.ok) {
      const text = await notionRes.text();
      console.error("Notion error:", text);
      return res.status(500).json({ error: "Failed to query Notion" });
    }

    const data = await notionRes.json();

    const labels = [];
    const values = [];

    for (const page of data.results) {
      const props = page.properties;

      const statNameProp = props["Stat Name"];
      const pointsProp = props["Points"];

      let label = "Unknown";
      if (
        statNameProp &&
        statNameProp.type === "title" &&
        statNameProp.title.length > 0
      ) {
        label = statNameProp.title.map(t => t.plain_text).join("");
      }

      let value = 0;
      if (pointsProp) {
  // Plain number property
  if (pointsProp.type === "number") {
    value = pointsProp.number ?? 0;
  }

  // Formula returning a number
  else if (
    pointsProp.type === "formula" &&
    pointsProp.formula &&
    pointsProp.formula.type === "number"
  ) {
    value = pointsProp.formula.number ?? 0;
  }

  // Rollup returning a number
  else if (
    pointsProp.type === "rollup" &&
    pointsProp.rollup &&
    pointsProp.rollup.type === "number"
  ) {
    value = pointsProp.rollup.number ?? 0;
  }
}

labels.push(label);
values.push(value);
    }

    return res.status(200).json({ labels, values });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Unexpected error calling Notion" });
  }
}
