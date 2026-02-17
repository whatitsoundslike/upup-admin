import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getScraper, calculateHotScore } from '@/lib/scrapers';

// POST - scrape community posts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, source } = body;

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }

    const scrapeSource = source || 'dcinside';
    const scraper = getScraper(scrapeSource);

    if (!scraper) {
      return NextResponse.json({
        error: `No scraper configured for source: ${scrapeSource}`,
      }, { status: 400 });
    }

    console.log(`[community] Scraping ${scrapeSource} for category: ${category}`);
    const allPosts = await scraper.scrape(category);
    console.log(`[community] ${category}/${scrapeSource}: Total ${allPosts.length} posts`);

    if (allPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: '수집된 새로운 게시물이 없습니다.',
        inserted: 0,
        updated: 0,
        skipped: 0,
        total: 0,
      });
    }

    // 중복 제거 (URL 기준)
    const seen = new Set<string>();
    const uniquePosts = allPosts.filter((p) => {
      if (seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    });

    // 핫 스코어 계산 & 정렬
    const scored = uniquePosts.map((p) => ({
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
      } catch (e) {
        console.error('DB save error:', e);
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
