import type { Metadata } from "next";

type EmbedPageProps = {
  params: { id: string };
};

async function getEmbedData(videoId: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const url = baseUrl
    ? `${baseUrl}/api/videos/${videoId}/embed`
    : `/api/videos/${videoId}/embed`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<{ ok: boolean; embedUrl?: string }>;
}

export async function generateMetadata({
  params,
}: EmbedPageProps): Promise<Metadata> {
  return {
    title: "Embedded Video",
    robots: {
      index: false,
      follow: false,
    },
    other: {
      "x-video-id": params.id,
    },
  };
}

export default async function EmbedPage({ params }: EmbedPageProps) {
  const data = await getEmbedData(params.id);

  if (!data?.ok || !data.embedUrl) {
    return (
      <html>
        <body
          style={{
            margin: 0,
            backgroundColor: "#000",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            fontSize: 14,
          }}
        >
          Video unavailable
        </body>
      </html>
    );
  }

  return (
    <html>
      <body
        style={{
          margin: 0,
          backgroundColor: "#000",
        }}
      >
        <video
          src={data.embedUrl}
          controls
          playsInline
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "100vh",
            objectFit: "contain",
            backgroundColor: "#000",
          }}
        />
      </body>
    </html>
  );
}

