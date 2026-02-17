export interface ScrapedPost {
  title: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
}

export interface ScraperResult {
  posts: ScrapedPost[];
  source: string;
  category: string;
}

export interface CommunityScraper {
  scrape(category: string): Promise<ScrapedPost[]>;
}
