import { NextResponse } from "next/server";
import { getValidProSession } from "../../../../src/lib/proSession";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)pro_session=([^;]+)/);
  const sessionToken = match?.[1] ?? null;
  if (!sessionToken) return NextResponse.json({ isPro: false });

  const res = await getValidProSession({ sessionToken });
  return NextResponse.json({ isPro: res.ok });
}


