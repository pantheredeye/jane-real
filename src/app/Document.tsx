import styles from "../addons/route-calculator/styles.css?url";
import footerStyles from "../addons/route-calculator/components/Footer.css?url";
import landingStyles from "./pages/landing/styles.css?url";
import demoContentStyles from "./pages/landing/components/demo/demo-content.css?url";
import comicStripStyles from "./pages/landing/components/screenshot-comic-strip.css?url";
import aboutStyles from "./pages/about/styles.css?url";
import authStyles from "./pages/user/auth.css?url";
import loginStyles from "./pages/user/login.css?url";
import signupStyles from "./pages/user/signup.css?url";
import accountStyles from "./pages/account/account.css?url";
import legalStyles from "./pages/legal/legal.css?url";
import subscriptionStyles from "../addons/subscription/pages/styles.css?url";
import theaterModalStyles from "./components/shared/theaterModal/theater-modal.css?url";
import theaterCloseStyles from "./components/shared/theaterModal/theater-close-button.css?url";
import voiceMicStyles from "../addons/agent/components/voice-mic.css?url";
import agentChatStyles from "../addons/agent/styles.css?url";
import { requestInfo } from "rwsdk/worker";
import type { AppContext } from "../worker";

export const Document: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const ctx = requestInfo.ctx as AppContext;
  const nonce = requestInfo.rw.nonce;
  const showChat = Boolean(ctx?.user);
  return (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {/* TODO: uncomment when Capacitor iOS app published with valid app-id */}
      {/* <meta name="apple-itunes-app" content="app-id=XXXXXXXXXX" /> */}
      <title>RouteFast - Route Calculator</title>
      <link rel="manifest" href="/manifest.json" />
      <meta name="theme-color" content="#3b82f6" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="RouteFast" />
      <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      <script
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`,
        }}
      />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Archivo+Black&family=Inter:wght@400;600;700&display=swap"
        rel="stylesheet"
      />
      <link rel="modulepreload" href="/src/client.tsx" />
      <link rel="stylesheet" href={landingStyles} />
      <link rel="stylesheet" href={demoContentStyles} />
      <link rel="stylesheet" href={comicStripStyles} />
      <link rel="stylesheet" href={aboutStyles} />
      <link rel="stylesheet" href={authStyles} />
      <link rel="stylesheet" href={loginStyles} />
      <link rel="stylesheet" href={signupStyles} />
      <link rel="stylesheet" href={accountStyles} />
      <link rel="stylesheet" href={legalStyles} />
      <link rel="stylesheet" href={subscriptionStyles} />
      <link rel="stylesheet" href={theaterModalStyles} />
      <link rel="stylesheet" href={theaterCloseStyles} />
      <link rel="stylesheet" href={styles} />
      <link rel="stylesheet" href={footerStyles} />
      <link rel="stylesheet" href={voiceMicStyles} />
      <link rel="stylesheet" href={agentChatStyles} />
    </head>
    <body>
      <div id="root">{children}</div>
      {showChat && (
        <>
          <div id="agent-dock-root" />
          <script nonce={nonce}>
            import("/src/addons/agent/mount-dock.tsx")
          </script>
        </>
      )}
      <script nonce={nonce}>import("/src/client.tsx")</script>
    </body>
  </html>
  );
};
