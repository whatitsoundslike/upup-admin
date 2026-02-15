import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import https from 'https';

interface ScrapedPost {
  title: string;
  url: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
}

// DC인사이드 카테고리별 갤러리 매핑
const DC_GALLERY_MAP: Record<string, { id: string; name: string; type: 'main' | 'minor' | 'mini' }[]> = {
  tesla: [
    { id: 'tesla', name: '테슬라', type: 'minor' },
  ],
  baby: [
    { id: 'mom', name: '맘', type: 'minor' },
  ],
  ai: [
    { id: 'chatgpt', name: 'ChatGPT', type: 'minor' },
    { id: 'programming', name: '프로그래밍', type: 'main' },
  ],
  desk: [
    { id: 'keyboard', name: '키보드', type: 'minor' },
    { id: 'computer', name: '컴퓨터', type: 'minor' },
  ],
};

// HTML 엔티티 디코딩 + 태그 제거
function cleanText(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
}

// 핫 스코어 계산
function calculateHotScore(likes: number, comments: number, views: number, publishedAt: Date): number {
  const ageHours = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  const timeDecay = 1 / (1 + ageHours / 12);
  const interaction = (likes * 3) + (comments * 5) + (views * 0.01);
  return Math.round(Math.log(Math.max(interaction, 1) + 1) * timeDecay * 100 * 100) / 100;
}

// Node.js 네이티브 https로 HTML 가져오기 (Next.js fetch 캐싱 문제 우회)
function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    }, (res) => {
      // 리다이렉트 처리
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchHtml(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// DC인사이드 갤러리 크롤링
async function scrapeDCGallery(
  galleryId: string,
  galleryType: 'main' | 'minor' | 'mini'
): Promise<ScrapedPost[]> {
  const posts: ScrapedPost[] = [];

  const pathPrefix = galleryType === 'main' ? 'board' : galleryType === 'minor' ? 'mgallery/board' : 'mini/board';
  const listUrl = `https://gall.dcinside.com/${pathPrefix}/lists/?id=${galleryId}&list_num=50&sort_type=N`;

  try {
    const html = await fetchHtml(listUrl);
    console.log(`[DC] ${galleryId}: HTML length=${html.length}`);

    // <tr class="ub-content us-post" data-no="12345"> 패턴으로 파싱
    const rowRegex = /<tr\s+class="ub-content\s+us-post"[^>]*data-no="(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi;
    let match;

    while ((match = rowRegex.exec(html)) !== null) {
      const postNo = match[1];
      const rowHtml = match[2];

      // 공지글 제외
      if (rowHtml.includes('icon_notice') || rowHtml.includes('<b>공지</b>')) continue;

      // 제목 추출
      const titleLinkMatch = rowHtml.match(/<td\s+class="gall_tit[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i);
      if (!titleLinkMatch) continue;

      let titleHtml = titleLinkMatch[1];
      titleHtml = titleHtml.replace(/<em[^>]*>[\s\S]*?<\/em>/gi, '');
      const title = cleanText(titleHtml);
      if (!title || title.length < 2) continue;

      // URL
      const viewPath = galleryType === 'main' ? 'board' : galleryType === 'minor' ? 'mgallery/board' : 'mini/board';
      const url = `https://gall.dcinside.com/${viewPath}/view/?id=${galleryId}&no=${postNo}`;

      // 조회수
      const viewsMatch = rowHtml.match(/<td\s+class="gall_count"[^>]*>([\d,]+)<\/td>/i);
      const views = viewsMatch ? parseInt(viewsMatch[1].replace(/,/g, ''), 10) : 0;

      // 추천수
      const recMatch = rowHtml.match(/<td\s+class="gall_recommend"[^>]*>([\d,]+)<\/td>/i);
      const likes = recMatch ? parseInt(recMatch[1].replace(/,/g, ''), 10) : 0;

      // 댓글수
      const replyMatch = rowHtml.match(/reply_numbox[^>]*>\[?(\d+)\]?/i);
      const comments = replyMatch ? parseInt(replyMatch[1], 10) : 0;

      // 날짜
      const dateMatch = rowHtml.match(/<td\s+class="gall_date"[^>]*title="([^"]+)"/i);
      const publishedAt = dateMatch ? new Date(dateMatch[1]) : new Date();

      posts.push({
        title,
        url,
        views,
        likes,
        comments,
        publishedAt: publishedAt.toISOString(),
      });
    }

    return posts;
  } catch (error) {
    console.error(`DC gallery ${galleryId} scrape error:`, error);
    return [];
  }
}

// POST - scrape community posts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, source } = body;

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }

    const scrapeSource = source || 'dcinside';
    let allPosts: ScrapedPost[] = [];

    if (scrapeSource === 'dcinside') {
      const galleries = DC_GALLERY_MAP[category];
      if (!galleries || galleries.length === 0) {
        return NextResponse.json({
          error: `No DC galleries configured for category: ${category}`,
        }, { status: 400 });
      }

      for (const gallery of galleries) {
        console.log(`[community] Scraping DC: ${gallery.name} (${gallery.id}, ${gallery.type})`);
        const posts = await scrapeDCGallery(gallery.id, gallery.type);
        console.log(`[community]   → ${posts.length} posts`);
        allPosts.push(...posts);
        if (galleries.length > 1) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }

    console.log(`[community] ${category}/${scrapeSource}: Total ${allPosts.length} posts`);

    // 중복 제거 (URL 기준)
    const seen = new Set<string>();
    allPosts = allPosts.filter((p) => {
      if (seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    });

    // 핫 스코어 계산 & 정렬
    const scored = allPosts.map((p) => ({
      ...p,
      hotScore: calculateHotScore(p.likes, p.comments, p.views, new Date(p.publishedAt)),
    }));
    scored.sort((a, b) => b.hotScore - a.hotScore);

    // 상위 30개
    const topPosts = scored.slice(0, 30);

    // DB 저장
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const post of topPosts) {
      try {
        const existing = await prisma.communityPost.findUnique({
          where: { url: post.url },
        });

        if (existing) {
          await prisma.communityPost.update({
            where: { url: post.url },
            data: {
              views: post.views,
              likes: post.likes,
              comments: post.comments,
              hotScore: post.hotScore,
            },
          });
          updated++;
          continue;
        }

        await prisma.communityPost.create({
          data: {
            category,
            source: scrapeSource,
            title: post.title,
            url: post.url,
            views: post.views,
            likes: post.likes,
            comments: post.comments,
            hotScore: post.hotScore,
            publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(),
          },
        });
        inserted++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${inserted}개 새 게시물 추가, ${updated}개 업데이트, ${skipped}개 스킵`,
      inserted,
      updated,
      skipped,
      total: topPosts.length,
    });
  } catch (error) {
    console.error('Community scrape failed:', error);
    return NextResponse.json({
      error: `스크래핑 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }, { status: 500 });
  }
}
