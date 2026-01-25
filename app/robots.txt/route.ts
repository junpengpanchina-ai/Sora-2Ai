import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/utils/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = getBaseUrl();

export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /auth/
Disallow: /storage-test/
Disallow: /payment-test/

Sitemap: ${SITE_URL}/sitemap-index.xml
`;
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
