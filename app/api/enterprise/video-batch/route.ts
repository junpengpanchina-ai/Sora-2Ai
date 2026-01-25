import { handleEnterpriseBatchViaApiKey } from "@/lib/enterprise/videoBatch";
import { getRequestId } from "@/lib/http/requestId";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  return handleEnterpriseBatchViaApiKey(req, { requestId });
}
