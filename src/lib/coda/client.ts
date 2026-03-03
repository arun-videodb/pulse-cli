const CODA_BASE_URL = "https://coda.io/apis/v1";

function getCodaApiKey(): string {
  const key = process.env.CODA_API_KEY;
  if (!key)
    throw new Error("CODA_API_KEY is not configured. Run: pulse-cli config");
  return key;
}

async function codaFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${CODA_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${getCodaApiKey()}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Coda API error (${res.status}): ${errorText}`);
  }

  return res.json() as Promise<T>;
}

export interface CodaDoc {
  id: string;
  type: string;
  href: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  folder: { id: string; name: string };
}

export interface CodaPage {
  id: string;
  type: string;
  name: string;
  subtitle: string;
  contentType: string;
}

export async function listDocs(
  query?: string
): Promise<CodaDoc[]> {
  const params = query ? `?query=${encodeURIComponent(query)}` : "";
  const response = await codaFetch<{ items: CodaDoc[] }>(`/docs${params}`);
  return response.items;
}

export async function getDoc(docId: string): Promise<CodaDoc> {
  return codaFetch<CodaDoc>(`/docs/${docId}`);
}

export async function listPages(docId: string): Promise<CodaPage[]> {
  const response = await codaFetch<{ items: CodaPage[] }>(
    `/docs/${docId}/pages`
  );
  return response.items;
}

export async function getPageContent(
  docId: string,
  pageId: string
): Promise<string> {
  const response = await codaFetch<{ content: string }>(
    `/docs/${docId}/pages/${encodeURIComponent(pageId)}?outputFormat=markdown`
  );
  return response.content || "";
}
