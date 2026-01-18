import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getBaseUrl } from "@/lib/utils/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE_URL = getBaseUrl();
const CHUNK_SIZE = 5000;

type RpcResult = { data: unknown; error: { message: string } | null };
type RpcClient = { rpc: (fn: string, args?: Record<string, unknown>) => Promise<RpcResult> };

async function supabaseRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const supabase = await createServiceClient();
  const { data, error } = await (supabase as unknown as RpcClient).rpc(fn, args);
  
  if (error) {
    throw new Error(`RPC ${fn} failed: ${error.message}`);
  }
  
  return data as T;
}

export async function GET() {
  try {
    const total = await supabaseRpc<number>("get_tier1_sitemap_count", {});
    const chunks = Math.max(1, Math.ceil(total / CHUNK_SIZE));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from({ length: chunks }, (_, i) => {
    const loc = `${SITE_URL}/sitemaps/tier1/${i}.xml`;
    return `  <sitemap><loc>${loc}</loc></sitemap>`;
  }).join("\n")}
</sitemapindex>`;

    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error generating sitemap index:", error);
    // Fallback: return minimal sitemap index
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${SITE_URL}/sitemaps/tier1/0.xml</loc></sitemap>
</sitemapindex>`;
    
    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}
