import { NextResponse } from "next/server";
import { validateLicenseWithLemonSqueezy } from "../../../../src/lib/lemonSqueezy";
import { createProSession } from "../../../../src/lib/proSession";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  let licenseKey: string | null = null;

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as null | { licenseKey?: string };
    licenseKey = body?.licenseKey?.trim() ?? null;
  } else {
    const fd = await req.formData();
    const v = fd.get("licenseKey");
    licenseKey = typeof v === "string" ? v.trim() : null;
  }

  if (!licenseKey) {
    return NextResponse.json({ error: "License key is required." }, { status: 400 });
  }

  const check = await validateLicenseWithLemonSqueezy(licenseKey);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: 400 });
  }

  const sessionToken = await createProSession({ licenseKey });
  const res = NextResponse.json({ ok: true });
  res.cookies.set("pro_session", sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    maxAge: 30 * 24 * 60 * 60
  });
  return res;
}


