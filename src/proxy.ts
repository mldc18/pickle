import { type NextRequest } from "next/server";
import {
  getMaintenanceModeConfig,
  getMaintenanceResponse,
} from "@/lib/maintenance-mode";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const maintenance = getMaintenanceModeConfig(process.env);
  if (maintenance.enabled) {
    return getMaintenanceResponse(maintenance);
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image, favicon, images
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
