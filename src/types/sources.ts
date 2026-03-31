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
