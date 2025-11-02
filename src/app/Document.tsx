import styles from "../addons/route-calculator/styles.css?url";
import landingStyles from "./pages/landing/styles.css?url";

export const Document: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>See Jane Sell - Route Calculator</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Archivo+Black&family=Inter:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <link rel="modulepreload" href="/src/client.tsx" />
      <link rel="stylesheet" href={landingStyles} />
      <link rel="stylesheet" href={styles} />
    </head>
    <body>
      <div id="root">{children}</div>
      <script>import("/src/client.tsx")</script>
    </body>
  </html>
);
