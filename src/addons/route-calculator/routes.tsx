import { route } from "rwsdk/router";
import HomePage from "./pages/HomePage";
import { calculateRoute } from "./server-functions/calculateRoute";
import { reOptimizeRoute } from "./server-functions/calculateRoute";
import { exportItinerary } from "./server-functions/export";

export const routeCalculatorRoutes = [
  // Main calculator page
  route("/", [HomePage]),
  
  // API endpoints for route calculation
  route("/calculate", "POST", [calculateRoute]),
  route("/re-optimize", "POST", [reOptimizeRoute]),
  
  // Export endpoints
  route("/api/export/:format", "GET", [exportItinerary]),
  
  // Health check endpoint
  route("/api/health", "GET", () => {
    return new Response(
      JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }),
];