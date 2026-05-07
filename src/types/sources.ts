export type SourceAuthor = {
  id: number;
  name: string;
};

type SourceListItemBase = {
  id: number;
  title: string;
  authors: SourceAuthor[];
  url: string | null;
  published_at: string | null;
  company_names: string[];
};

export type AdminSourceListItem = SourceListItemBase & {
  image_url: string | null;
};

export type UserSourceListItem = SourceListItemBase;

export type AdminSourcePageRead = {
  items: AdminSourceListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type UserSourcePageRead = {
  items: UserSourceListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type SourceSearchMatchedBy = "sparse" | "dense";

export type AppliedSearchFilter = {
  field: "language" | "publisher_id" | "author_id" | "published_from" | "published_to";
  value: number | string;
  label: string;
  source: "explicit" | "inferred";
};

type SourceDetailBase = SourceListItemBase & {
  summary: string | null;
  feed_sections: string[];
};

export type SourceModalDetail = SourceDetailBase & {
  image_url?: string | null;
};

export type AdminSourceDetail = SourceModalDetail & {
  image_url: string | null;
};

export type UserSourceDetail = SourceDetailBase;

export type UserSourceSearchItem = SourceDetailBase & {
  score: number;
  matched_by: SourceSearchMatchedBy[];
};

export type UserSourceSearchPageRead = {
  raw_query: string;
  subject_query: string;
  applied_filters: AppliedSearchFilter[];
  items: UserSourceSearchItem[];
  limit: number;
  offset: number;
  has_more: boolean;
};

export type SimilarSourceRead = {
  score: number;
  source: UserSourceDetail;
};

export type SimilarSourcesRead = {
  source_id: number;
  model_name: string;
  items: SimilarSourceRead[];
};
