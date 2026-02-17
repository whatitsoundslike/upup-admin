import { CommunityScraper, ScrapedPost } from './types';
import { fetchHtml, cleanText } from './utils';

const CLIEN_BOARD_MAP: Record<string, string[]> = {
  tesla: ['cm_car'],
  ai: ['news', 'cm_ai'],
  desk: ['cm_keyboard', 'cm_pctuning', 'use'],
  baby: ['cm_baby'],
  pet: ['cm_dog', 'cm_cat'],
};

export class ClienScraper implements CommunityScraper {
  async scrape(category: string): Promise<ScrapedPost[]> {
    const boards = CLIEN_BOARD_MAP[category];
    if (!boards) return [];

    const allPosts: ScrapedPost[] = [];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    for (const boardId of boards) {
      const posts = await this.scrapeBoard(boardId, threeDaysAgo);
      allPosts.push(...posts);
      if (boards.length > 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return allPosts;
  }

  private async scrapeBoard(boardId: string, dateThreshold: Date): Promise<ScrapedPost[]> {
    const posts: ScrapedPost[] = [];
    const listUrl = `https://www.clien.net/service/board/${boardId}`;

    try {
      const html = await fetchHtml(listUrl);
      
      // Clien uses .list_item class for rows
      // We need to parse items, skipping notices
      const itemRegex = /<div\s+class="list_item[^"]*"(?:[\s\S]*?)>([\s\S]*?)<\/div>\s*<\/div>/gi;
      let match;

      while ((match = itemRegex.exec(html)) !== null) {
        const itemHtml = match[1];

        // Skip notices
        if (itemHtml.includes('class="list_symph"><span>공지</span>')) continue;

        // Title and URL
        // <a class="list_subject" href="/service/board/news/19145455...">
        const titleMatch = itemHtml.match(/<a\s+class="list_subject"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        if (!titleMatch) continue;

        const urlPath = titleMatch[1];
        const url = `https://www.clien.net${urlPath}`;
        
        // Title might be inside span.subject_fixed
        let titleRaw = titleMatch[2];
        const fixedTitleMatch = titleRaw.match(/<span\s+class="subject_fixed"[^>]*>([\s\S]*?)<\/span>/i);
        const title = cleanText(fixedTitleMatch ? fixedTitleMatch[1] : titleRaw);

        if (!title || title.length < 2) continue;

        // Likes (Sympathy)
        const likesMatch = itemHtml.match(/<div\s+class="list_symph[^"]*"[^>]*><span>([\d,]+)<\/span>/i);
        const likes = likesMatch ? parseInt(likesMatch[1].replace(/,/g, ''), 10) : 0;

        // Comments
        const commentsMatch = itemHtml.match(/<span\s+class="reply_count"[^>]*>([\d,]+)<\/span>/i);
        const comments = commentsMatch ? parseInt(commentsMatch[1].replace(/,/g, ''), 10) : 0;

        // Views (Clien list might not have views easily, let's check)
        // From visual research, it might be in .list_hit
        const viewsMatch = itemHtml.match(/<div\s+class="list_hit"[^>]*><span[^>]*>([\d,]+[KkMmgG]?)<\/span>/i);
        let views = 0;
        if (viewsMatch) {
            const vText = viewsMatch[1].toLowerCase().replace(/,/g, '');
            if (vText.endsWith('k')) views = parseFloat(vText) * 1000;
            else if (vText.endsWith('m')) views = parseFloat(vText) * 1000000;
            else views = parseInt(vText, 10);
        }

        // Date
        const timeMatch = itemHtml.match(/<span\s+class="timestamp">([^<]+)<\/span>/i);
        const publishedAt = timeMatch ? new Date(timeMatch[1]) : new Date();

        if (publishedAt < dateThreshold) continue;

        posts.push({
          title,
          url,
          views,
          likes,
          comments,
          publishedAt: publishedAt.toISOString(),
        });
      }
    } catch (error) {
      console.error(`Clien board ${boardId} scrape error:`, error);
    }

    return posts;
  }
}
