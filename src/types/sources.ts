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
