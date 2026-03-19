export type RssSourceListItem = {
  id: number;
  title: string;
  summary: string | null;
  author: string | null;
  url: string;
  published_at: string | null;
  image_url: string | null;
  company_names: string[];
};

export type RssSourcePageRead = {
  items: RssSourceListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type RssSourceDetail = {
  id: number;
  title: string;
  summary: string | null;
  author: string | null;
  url: string;
  published_at: string | null;
  image_url: string | null;
  company_names: string[];
  feed_sections: string[];
};

export type RssSourceEmbeddingEnqueueRead = {
  queued_sources: number;
};

export type RssSourceEmbeddingMapPoint = {
  source_id: number;
  title: string;
  summary: string | null;
  url: string;
  published_at: string | null;
  image_url: string | null;
  company_names: string[];
  x: number;
  y: number;
};

export type RssSourceEmbeddingMapRead = {
  items: RssSourceEmbeddingMapPoint[];
  total: number;
  date_from: string | null;
  date_to: string | null;
  embedding_model_name: string;
  projection_version: string;
};

export type RssSourceEmbeddingNeighbor = RssSourceEmbeddingMapPoint & {
  similarity: number;
};

export type RssSourceEmbeddingNeighborhoodRead = {
  source: RssSourceEmbeddingMapPoint;
  neighbors: RssSourceEmbeddingNeighbor[];
  neighbor_limit: number;
  date_from: string | null;
  date_to: string | null;
  embedding_model_name: string;
  projection_version: string;
};
