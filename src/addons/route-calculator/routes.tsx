// TODO: Add interruptors for authentication and validation
// TODO: Add rate limiting to API endpoints
// TODO: Add proper error handling middleware
// TODO: Implement CORS headers for API endpoints
// TODO: Add request/response validation with Zod schemas
// TODO: Add logging and monitoring interruptors
// TODO: Add caching strategies for geocoding results

import { route } from "rwsdk/router";
import HomePage from "./pages/HomePage";
import { calculateRoute } from "./server-functions/calculateRoute";
import { exportItinerary } from "./server-functions/export";

export const routeCalculatorRoutes = [
  // Main calculator page
  route("/", [HomePage]),
  
  // Server functions are called directly from client components
  // No HTTP routes needed for calculate/re-optimize
  
  // Export endpoints
  route("/api/export/:format", [exportItinerary]),

  // Health check endpoint
  route("/api/health", [() => {
    return new Response(
      JSON.stringify({ status: "healthy", timestamp: new Date().toISOString() }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }]),
];