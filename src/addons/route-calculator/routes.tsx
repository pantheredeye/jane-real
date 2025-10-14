import { route } from "rwsdk/router";
import HomePage from "./pages/HomePage";
import { exportItinerary } from "./server-functions/export";
import { requireTenant, requireMember } from "@/app/interruptors";

// TODO: Add rate limiting to API endpoints
// TODO: Add request/response validation with Zod schemas
// TODO: Add logging and monitoring interruptors
// TODO: Add caching strategies for geocoding results

export const routeCalculatorRoutes = [
  // Main calculator page - requires active tenant membership
  route("/", [requireTenant, HomePage]),

  // Server functions are called directly from client components
  // No HTTP routes needed for calculate/re-optimize

  // Export endpoints - requires MEMBER or OWNER role
  route("/api/export/:format", [requireMember, exportItinerary]),

  // Health check endpoint - public
  route("/api/health", [
    () => {
      return new Response(
        JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    },
  ]),
];