import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker in production (vite-plugin-pwa provides virtual helper)
if (import.meta.env.PROD) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        onRegistered(r) {
          console.log('Service worker registered', r);
        },
        onNeedRefresh() {
          window.dispatchEvent(new CustomEvent('sw:need-refresh'));
        },
        onOfflineReady() {
          window.dispatchEvent(new CustomEvent('sw:offline-ready'));
        }
      });
    })
    .catch((err) => {
      console.warn('SW registration failed', err);
    });
}

createRoot(document.getElementById("root")!).render(<App />);
