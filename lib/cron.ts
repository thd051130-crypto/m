import "server-only";
import { NextResponse, type NextRequest } from "next/server";

/** Vercel Cron은 Authorization: Bearer $CRON_SECRET 을 보낸다 */
export function cronHandler(job: () => Promise<unknown>) {
  return async (req: NextRequest) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    try {
      return NextResponse.json(await job());
    } catch (e) {
      console.error("[cron]", e);
      return NextResponse.json({ error: "failed" }, { status: 500 });
    }
  };
}
