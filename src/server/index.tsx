import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { renderToString } from "react-dom/server";
import App from "../App";

const port = Number(process.env.PORT) || 3000;

const app = new Elysia();

// Serve static assets
app.use(
  staticPlugin({
    assets: "dist/public",
    prefix: "/",
  }),
);

// SSR handler
app.get("*", ({ path: _path }) => {
  const appHtml = renderToString(<App />);

  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Todo App</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <div id="root">${appHtml}</div>
  <script type="module" src="/entry-client.js"></script>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" } },
  );
});

app.listen(port);
console.log(`Server running at http://localhost:${port}`);
