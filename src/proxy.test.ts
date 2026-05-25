import { afterEach, describe, expect, it, vi } from "vitest";

import { updateSession } from "@/lib/supabase/middleware";
import { proxy } from "./proxy";

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: vi.fn(async () => new Response("session ok", { status: 200 })),
}));

describe("proxy", () => {
  afterEach(() => {
    vi.mocked(updateSession).mockClear();
  });

  it("delegates requests to the session middleware", async () => {
    const response = await proxy(new Request("https://lampa.example/") as never);

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toBe("session ok");
    expect(updateSession).toHaveBeenCalledOnce();
  });
});
