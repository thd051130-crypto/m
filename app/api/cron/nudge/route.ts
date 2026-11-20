import { cronHandler } from "@/lib/cron";
import { runNudges } from "@/lib/ai/manager";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const GET = cronHandler(runNudges);
