import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Set the backend API base URL for production deployments
// In Replit, VITE_API_BASE_URL is not set, so it falls back to the current origin
setBaseUrl(import.meta.env.VITE_API_BASE_URL || "");

createRoot(document.getElementById("root")!).render(<App />);
