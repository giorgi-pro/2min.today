import { randomUUID } from "node:crypto";
import { json } from "@sveltejs/kit";
import { getSupabaseServiceRoleClient } from "@lib/supabase/server";
import { breakingPipeline } from "@lib/pipeline/breaking";
import { digestLogger } from "@2min.today/logging";
import { env } from "@config";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url }) => {
  if (url.searchParams.get("secret") !== env.BREAKING_SECRET) {
    digestLogger.debug("breaking unauthorized");
    return new Response("Unauthorized", { status: 401 });
  }

  const runId = randomUUID();
  const log = digestLogger.child({ runId, route: "breaking-handler" });

  try {
    const supabase = getSupabaseServiceRoleClient();
    const published = await breakingPipeline.run(supabase, { log });
    log.info({ published }, "breaking handler success");
    return json({ status: "ok", published });
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : "Unknown error";
    log.error({ err: errMessage }, "breaking pipeline failed");
    return json({ status: "error", message: errMessage }, { status: 500 });
  }
};
