import { html, render } from 'https://unpkg.com/htm/preact/index.mjs?module'
import { renderToString } from "https://cdn.pika.dev/preact-render-to-string";

 function App (props) {
  return html`<h1>Hello ${props.name}!</h1>`;
}

const body = renderToString(html`
  <html>
    <head>
    </head>
    <body>
      <${App} name="World" />
    </body>
  </html>
`);

addEventListener("fetch", (event) => {
  // renderToString generates html string from JSX components.
  const response = new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });

  event.respondWith(response);
});
