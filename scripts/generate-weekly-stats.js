const fs = require("fs");

const username = "EgyptianMama";

async function run() {
  const query = `
  {
    user(login: "${username}") {
      contributionsCollection(
        from: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"
        to: "${new Date().toISOString()}"
      ) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
  `;

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();

  const calendar =
    data.data.user.contributionsCollection.contributionCalendar;

  const total = calendar.totalContributions;

  const days = calendar.weeks
    .flatMap(w => w.contributionDays)
    .slice(-7);

  const boxes = days
    .map((d, i) => {
      const intensity =
        d.contributionCount === 0
          ? "#161b22"
          : d.contributionCount < 3
          ? "#2f81f7"
          : d.contributionCount < 8
          ? "#6E56CF"
          : "#a371f7";

      return `
      <rect
        x="${120 + i * 75}"
        y="170"
        width="48"
        height="48"
        rx="8"
        fill="${intensity}"
      />
      <text
        x="${144 + i * 75}"
        y="240"
        fill="white"
        text-anchor="middle"
        font-size="14"
      >
        ${new Date(d.date).toLocaleDateString("en-US", {
          weekday: "short"
        })}
      </text>
      <text
        x="${144 + i * 75}"
        y="198"
        fill="white"
        text-anchor="middle"
        font-size="16"
        font-weight="bold"
      >
        ${d.contributionCount}
      </text>
      `;
    })
    .join("");

  const svg = `
  <svg width="900" height="320" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#0d1117"/>

    <text
      x="450"
      y="80"
      fill="#ffffff"
      text-anchor="middle"
      font-size="36"
      font-weight="bold"
    >
      ${total} Contributions This Week
    </text>

    <text
      x="450"
      y="120"
      fill="#8b949e"
      text-anchor="middle"
      font-size="18"
    >
      Last 7 Days Activity
    </text>

      ${boxes}
  </svg>
  `;

  fs.mkdirSync("output", { recursive: true });

  fs.writeFileSync("output/weekly-stats.svg", svg);
}

run();