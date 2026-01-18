import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHUNK_SIZE = 5000;

type SitemapRow = { loc: string; lastmod: string };

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

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chunkId = Number(params.id);
    if (Number.isNaN(chunkId) || chunkId < 0) {
      return new NextResponse("Invalid chunk id", { status: 400 });
    }

    const offset = chunkId * CHUNK_SIZE;

    const rows = await supabaseRpc<SitemapRow[]>("get_tier1_sitemap_chunk", {
      p_limit: CHUNK_SIZE,
      p_offset: offset,
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.map((r) => {
      const lastmod = new Date(r.lastmod).toISOString();
      return `  <url><loc>${r.loc}</loc><lastmod>${lastmod}</lastmod></url>`;
    }).join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (error) {
    console.error("Error generating sitemap chunk:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
