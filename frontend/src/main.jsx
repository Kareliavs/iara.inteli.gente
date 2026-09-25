import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "leaflet/dist/leaflet.css";
import { installStaticApi } from "./lib/staticApi";

// This build has no live backend (GitHub Pages is static hosting). Route the
// app's existing fetch("/api/...") calls to the pre-generated JSON files
// under /public/data instead — see src/lib/staticApi.js.
installStaticApi();

createRoot(document.getElementById("root")).render(<App />);
