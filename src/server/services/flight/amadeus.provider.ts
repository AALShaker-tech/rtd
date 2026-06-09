import "server-only";
import { type FlightLookupResult } from "@/lib/flight";
import { notConfigured, type FlightProvider } from "./types";

/**
 * Amadeus provider (placeholder — activate by setting:
 *   FLIGHT_API_PROVIDER=amadeus
 *   FLIGHT_API_KEY=<client_id>:<client_secret>
 *   FLIGHT_API_BASE_URL=https://api.amadeus.com
 * Amadeus uses OAuth2 (client_credentials). Implement token exchange against
 * /v1/security/oauth2/token, then call the Schedule/On-Demand Flight Status API
 * (/v2/schedule/flights) and map into NormalizedFlight below.
 */
export const amadeusProvider: FlightProvider = {
  name: "amadeus",
  async lookup(): Promise<FlightLookupResult> {
    const key = process.env.FLIGHT_API_KEY;
    if (!key) return notConfigured("amadeus");
    // TODO: OAuth2 token + GET /v2/schedule/flights; normalize the response.
    return { ok: false, reason: "PROVIDER_ERROR", message: "Amadeus integration not yet implemented." };
  },
};
