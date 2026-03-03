function getPostizBaseUrl(): string {
  return (
    process.env.POSTIZ_API_URL || "https://api.postiz.com/public/v1"
  );
}

function getPostizApiKey(): string {
  const key = process.env.POSTIZ_API_KEY;
  if (!key)
    throw new Error(
      "POSTIZ_API_KEY is not configured. Run: pulse-cli config"
    );
  return key;
}

async function postizFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${getPostizBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      Authorization: getPostizApiKey(),
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Postiz API error (${res.status}): ${errorText}`);
  }

  return res.json() as Promise<T>;
}

export interface PostizIntegration {
  id: string;
  name: string;
  identifier: string;
  picture: string;
  disabled: boolean;
  profile: string;
  customer: {
    id: string;
    name: string;
  };
}

export interface PostizMediaItem {
  id: string;
  path: string;
  alt: string | null;
  thumbnail: string | null;
  thumbnailTimestamp?: number | null;
}

export interface PostizPostValue {
  id: string;
  content: string;
  delay: number;
  image: PostizMediaItem[];
}

export interface PostizPostSettings {
  __type: string;
  [key: string]: unknown;
}

export interface PostizPostItem {
  integration: { id: string };
  group: string;
  value: PostizPostValue[];
  settings: PostizPostSettings;
}

export interface PostizCreatePostRequest {
  type: "schedule" | "now" | "draft";
  date: string;
  shortLink: boolean;
  tags: Array<{ value: string; label: string }>;
  posts: PostizPostItem[];
}

export async function getIntegrations(): Promise<PostizIntegration[]> {
  return postizFetch<PostizIntegration[]>("/integrations");
}

export interface PostizCreatePostResponse {
  postId: string;
  integration: string;
}

export async function createPost(
  body: PostizCreatePostRequest
): Promise<PostizCreatePostResponse[]> {
  return postizFetch<PostizCreatePostResponse[]>("/posts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface PostizListPost {
  id: string;
  content: string;
  publishDate: string;
  releaseURL?: string;
  state: "QUEUE" | "PUBLISHED" | "ERROR" | "DRAFT";
  integration: {
    id: string;
    providerIdentifier: string;
    name: string;
    picture: string;
  };
}

export async function listPosts(
  startDate: string,
  endDate: string
): Promise<PostizListPost[]> {
  const response = await postizFetch<{ posts: PostizListPost[] }>(
    `/posts?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
  );
  return response.posts ?? [];
}

export async function deletePost(postizPostId: string): Promise<void> {
  await postizFetch(`/posts/${postizPostId}`, { method: "DELETE" });
}

export async function triggerIntegrationTool<T = unknown>(
  integrationId: string,
  methodName: string,
  data: Record<string, unknown>
): Promise<T> {
  const result = await postizFetch<{ output: T }>(
    `/integration-trigger/${integrationId}`,
    {
      method: "POST",
      body: JSON.stringify({ methodName, data }),
    }
  );
  return result.output;
}

/** Generate a random group ID for linking posts together */
export function generateGroupId(): string {
  return crypto.randomUUID();
}
