import { cronHandler } from "@/lib/cron";
import { runWeeklyActivities } from "@/lib/ai/manager";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const GET = cronHandler(runWeeklyActivities);
