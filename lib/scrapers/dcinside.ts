import { CommunityScraper, ScrapedPost } from './types';
import { fetchHtml, cleanText } from './utils';

const DC_GALLERY_MAP: Record<string, { id: string; name: string; type: 'main' | 'minor' | 'mini' }[]> = {
  tesla: [
    { id: 'tesla', name: '테슬라', type: 'minor' },
  ],
  baby: [
    { id: 'mom', name: '맘', type: 'minor' },
  ],
  ai: [
    { id: 'chatgpt', name: 'ChatGPT', type: 'minor' },
    { id: 'thesingularity', name: '특이점이 온다', type: 'minor' },
  ],
  desk: [
    { id: 'desksetup', name: '데스크셋업', type: 'minor' },
    { id: 'desk', name: '책상', type: 'minor' },
  ],
  pet: [
    { id: 'dog', name: '멍멍이', type: 'main' },
    { id: 'cat', name: '야옹이', type: 'main' },
  ],
};

export class DCInsideScraper implements CommunityScraper {
  async scrape(category: string): Promise<ScrapedPost[]> {
    const galleries = DC_GALLERY_MAP[category];
    if (!galleries) return [];

    const allPosts: ScrapedPost[] = [];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    for (const gallery of galleries) {
      const posts = await this.scrapeGallery(gallery.id, gallery.type, threeDaysAgo);
      allPosts.push(...posts);
      if (galleries.length > 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    return allPosts;
  }

  private async scrapeGallery(
    galleryId: string,
    galleryType: 'main' | 'minor' | 'mini',
    dateThreshold: Date
  ): Promise<ScrapedPost[]> {
    const posts: ScrapedPost[] = [];
    const pathPrefix = galleryType === 'main' ? 'board' : galleryType === 'minor' ? 'mgallery/board' : 'mini/board';
    const listUrl = `https://gall.dcinside.com/${pathPrefix}/lists/?id=${galleryId}&list_num=50&sort_type=N`;

    try {
      const html = await fetchHtml(listUrl);
      const rowRegex = /<tr\s+class="ub-content\s+us-post"[^>]*data-no="(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi;
      let match;

      while ((match = rowRegex.exec(html)) !== null) {
        const postNo = match[1];
        const rowHtml = match[2];

        if (rowHtml.includes('icon_notice') || rowHtml.includes('<b>공지</b>')) continue;

        const titleLinkMatch = rowHtml.match(/<td\s+class="gall_tit[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
        if (!titleLinkMatch) continue;

        let titleHtml = titleLinkMatch[1];
        titleHtml = titleHtml.replace(/<em[^>]*>[\s\S]*?<\/em>/gi, '');
        const title = cleanText(titleHtml);
        if (!title || title.length < 2) continue;

        const viewPath = galleryType === 'main' ? 'board' : galleryType === 'minor' ? 'mgallery/board' : 'mini/board';
        const url = `https://gall.dcinside.com/${viewPath}/view/?id=${galleryId}&no=${postNo}`;

        const viewsMatch = rowHtml.match(/<td\s+class="gall_count"[^>]*>([\d,]+)<\/td>/i);
        const views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, ''), 10) : 0;

        const recMatch = rowHtml.match(/<td\s+class="gall_recommend"[^>]*>([\d,]+)<\/td>/i);
        const likes = recMatch ? parseInt(recMatch[1].replace(/,/g, ''), 10) : 0;

        // 추천수 5개 이상인 것만 가져오기
        if (likes < 5) continue;

        const replyMatch = rowHtml.match(/reply_numbox[^>]*>\[?(\d+)\]?/i);
        const comments = replyMatch ? parseInt(replyMatch[1], 10) : 0;

        const dateMatch = rowHtml.match(/<td\s+class="gall_date"[^>]*title="([^"]+)"/i);
        const publishedAt = dateMatch ? new Date(dateMatch[1]) : new Date();

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
      console.error(`DC gallery ${galleryId} scrape error:`, error);
    }

    return posts;
  }
}
