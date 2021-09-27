import { html } from "https://unpkg.com/htm/preact/index.mjs?module";
import { renderToString } from "https://cdn.pika.dev/preact-render-to-string";
import { getChartData } from "./asana.ts";

const fetchChartData = async () => {
  const data = await getChartData();
  const currentTime = new Date();
  const chartDataJson = {
    type: "bar",
    data,
    options: {
      plugins: {
        title: {
          display: true,
          text: `タスク完了数 at ${currentTime.toString()}`,
        },
      },
      responsive: true,
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
        },
      },
    },
  };

  return chartDataJson;
};

function Chart({ chartDataJson, id }) {
  const stringifyedData = JSON.stringify(chartDataJson);
  const modifiedJson = stringifyedData.replace(/"/g, "'");

  return html`
    <canvas id="${id}" style="max-height: 700px; max-width: 1000px;"></canvas>
    <script>
      var ctx = document.getElementById('${id}').getContext('2d');
      var myChart = new Chart(ctx, ${modifiedJson});
    </script>
  `;
}

addEventListener("fetch", async (event) => {
  const chartDataJson = await fetchChartData();
  const body = renderToString(html`
  <html>
    <head>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.5.1/chart.min.js" integrity="sha512-Wt1bJGtlnMtGP0dqNFH1xlkLBNpEodaiQ8ZN5JLA5wpc1sUlk/O5uuOMNgvzddzkpvZ9GLyYNa8w2s7rqiTk5Q==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    </head>
    <body>
      <${Chart} chartDataJson=${chartDataJson} id="test"/>
    </body>
  </html>
`);

  const response = new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });

  event.respondWith(response);
});
