import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface NewsItem {
    source: string;
    title: string;
    link: string;
    thumbnail: string;
    description: string;
    published_at: string;
}

// 뉴스 소스 타입
type NewsSource = 'google' | 'naver';

// 카테고리별 검색 키워드 설정
const KEYWORD_CONFIG: Record<string, {
    keywords: string[];
    maxPerSource: number;
    sources?: NewsSource[];  // 사용할 뉴스 소스 (기본값: ['google', 'naver'])
    excludePatterns?: RegExp[];
    boostPatterns?: RegExp[];
}> = {
    tesla: {
        keywords: ['테슬라', '일론 머스크'],
        maxPerSource: 20,
        sources: ['google', 'naver'],
    },
    baby: {
        keywords: [
            '육아 정책',
            '출산 지원금',
            '보육료',
            '아동수당',
            '육아휴직',
            '부모급여',
            '어린이집 정책',
            '출산 정책',
            '다자녀 혜택',
            '신생아 지원',
        ],
        maxPerSource: 10,
        sources: ['google', 'naver'],  // 정책 뉴스는 네이버가 더 정확
        excludePatterns: [
            /♥|♡/,
            /\b(출연|방송|예능|드라마|시청률|공개|촬영)\b/,
            /(에세이|브이로그|유튜브|인스타)/,
            /(호캉스|여행|태교여행)/,
            /\[.*포토\]|\[.*사진\]/,
            /(독박투어|살림남|워킹맘|슈퍼맨)/,
        ],
        boostPatterns: [
            /(지원금|보조금|수당|급여|혜택|감면|할인)/,
            /(정책|제도|법안|개정|시행|확대|인상)/,
            /(보육료|어린이집|유치원|돌봄|방과후)/,
            /(출산휴가|육아휴직|근로시간 단축)/,
            /(신청|접수|모집|대상자)/,
        ],
    },
    ai: {
        keywords: [
            'ChatGPT',
            '챗GPT',
            'OpenAI',
            'Claude AI',
            'Gemini AI',
            '생성형 AI',
            'LLM',
        ],
        maxPerSource: 10,
        sources: ['google', 'naver'],
        excludePatterns: [
            /AI\s?(아나운서|앵커|기상캐스터|성우)/,
            /AI\s?(면접|채용|이력서)/,
            /AI\s?(그림|일러스트|웹툰)\s?(작가|논란|표절)/,
            /(예능|드라마|영화|방송|출연|공개|촬영)/,
            /\[.*포토\]|\[.*사진\]|\[.*영상\]/,
            /(주가|시세|투자|매수|매도|상한가|급등|급락)/,
            /AI\s?(스피커|냉장고|세탁기|에어컨|청소기|가전)/,
            /(국회|의원|여당|야당|정부|대통령|장관|청와대|총리)/,
            /(민주당|국민의힘|조국|윤석열|이재명|한동훈)/,
            /(규제|법안|입법|청문회|국정감사)/,
        ],
        boostPatterns: [
            /(ChatGPT|GPT-|챗GPT|OpenAI|오픈AI)/,
            /(Claude|클로드|Anthropic|앤트로픽)/,
            /(Gemini|제미나이|구글 AI|Google AI)/,
            /(LLM|대규모 언어 모델|대형 언어 모델)/,
            /(생성형 AI|생성AI|Generative AI)/,
            /(딥러닝|머신러닝|신경망|트랜스포머)/,
            /(API|SDK|오픈소스|개발자)/,
            /(업데이트|출시|발표|공개|버전)/,
        ],
    },
    desk: {
        keywords: [
            '데스크테리어',
            '데스크 셋업',
            '모니터 추천',
            '기계식 키보드',
            '게이밍 마우스',
            '사무용 의자 추천',
            'PC 스피커',
        ],
        maxPerSource: 10,
        sources: ['google', 'naver'],  // 리뷰/제품 뉴스
        excludePatterns: [
            /(드라마|영화|예능|방송|출연|촬영|시청률)/,
            /(가수|배우|아이돌|연예인|셀럽)/,
            /(콘서트|공연|무대|음원|싱글|앨범)/,
            /(넷플릭스|디즈니|왓챠|티빙|쿠팡플레이)/,
            /\[.*포토\]|\[.*사진\]|\[.*영상\]/,
            /(채용|구인|모집|입사|취업)/,
            /(올림픽|월드컵|경기|승리|패배|우승)/,
            /(사건|사고|범죄|재판|판결|구속)/,
            /(자동차|SUV|세단|전기차|하이브리드)/,
        ],
        boostPatterns: [
            /(모니터|키보드|마우스|마우스패드|장패드)/,
            /(스피커|사운드바|DAC|앰프)/,
            /(의자|책상|거치대|모니터암)/,
            /(리뷰|추천|비교|언박싱|개봉기)/,
            /(게이밍|오피스|사무용|업무용)/,
            /(QHD|4K|OLED|IPS|VA|Hz)/,
        ],
    },
};

// HTML 태그 제거
function cleanHtml(text: string): string {
    return text
        // 1. HTML 엔티티 먼저 디코딩
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        // 2. 그 다음 태그 제거
        .replace(/<[^>]*>/g, '')
        .trim();
}

// Google News URL에서 base64 문자열 추출
function getGoogleNewsBase64(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (parsed.hostname !== 'news.google.com') return null;
        const parts = parsed.pathname.split('/');
        const idx = parts.findIndex((p) => p === 'articles' || p === 'read');
        if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
        return null;
    } catch {
        return null;
    }
}

// Google News batchexecute API로 원본 URL 디코딩
// 성공 시 원본 URL, 429 rate limit 시 null (스킵 대상), 기타 실패 시 원본 google URL 반환
async function resolveGoogleNewsUrl(url: string): Promise<string | null> {
    const base64Str = getGoogleNewsBase64(url);
    if (!base64Str) return url;

    try {
        // 1단계: Google News 페이지에서 서명/타임스탬프 추출
        const pageRes = await fetch(`https://news.google.com/articles/${base64Str}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
            },
        });

        if (pageRes.status === 429) return null;
        if (!pageRes.ok) return url;

        const html = await pageRes.text();
        const sigMatch = html.match(/data-n-a-sg="([^"]+)"/);
        const tsMatch = html.match(/data-n-a-ts="([^"]+)"/);
        if (!sigMatch || !tsMatch) return url;

        const signature = sigMatch[1];
        const timestamp = tsMatch[1];

        // 2단계: batchexecute API로 원본 URL 획득
        const payload = [
            'Fbv4je',
            `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${base64Str}",${timestamp},"${signature}"]`,
        ];
        const body = `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`;

        const decodeRes = await fetch('https://news.google.com/_/DotsSplashUi/data/batchexecute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
            },
            body,
        });

        if (decodeRes.status === 429) return null;
        if (!decodeRes.ok) return url;

        const text = await decodeRes.text();
        const parts = text.split('\n\n');
        if (parts.length < 2) return url;

        const parsed = JSON.parse(parts[1]);
        const decodedUrl = JSON.parse(parsed[0][2])[1];
        if (decodedUrl && decodedUrl.startsWith('http')) return decodedUrl;

        return url;
    } catch {
        return url;
    }
}

// 핫링크 차단 도메인 (외부에서 직접 이미지 로드 불가)
const BLOCKED_THUMBNAIL_DOMAINS = [
    'nateimg.co.kr',
    'nate.com',
    'daumcdn.net',
];

function isBlockedThumbnail(imageUrl: string): boolean {
    return BLOCKED_THUMBNAIL_DOMAINS.some((domain) => imageUrl.includes(domain));
}

// 페이지에서 og:image 썸네일만 추출
async function fetchThumbnailOnly(url: string): Promise<string> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            },
        });
        clearTimeout(timeoutId);

        if (!response.ok) return '';

        const html = await response.text();

        // og:image 메타태그 추출
        const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

        if (ogImageMatch && ogImageMatch[1] && !isBlockedThumbnail(ogImageMatch[1])) {
            return ogImageMatch[1];
        }

        // twitter:image 폴백
        const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

        if (twitterImageMatch && twitterImageMatch[1] && !isBlockedThumbnail(twitterImageMatch[1])) {
            return twitterImageMatch[1];
        }

        return '';
    } catch {
        return '';
    }
}

// Google News RSS 가져오기
async function fetchGoogleNews(query: string, num: number): Promise<NewsItem[]> {
    try {
        const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
        const response = await fetch(url);
        const text = await response.text();

        // Simple XML parsing
        const items: NewsItem[] = [];
        const itemMatches = text.match(/<item>([\s\S]*?)<\/item>/g) || [];

        const now = new Date();
        const threshold = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5일 전

        for (const itemXml of itemMatches.slice(0, num)) {
            const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                itemXml.match(/<title>(.*?)<\/title>/);
            const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
            const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
            const descMatch = itemXml.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                itemXml.match(/<description>(.*?)<\/description>/);

            if (!titleMatch || !pubDateMatch) continue;

            const pubDate = new Date(pubDateMatch[1]);
            if (pubDate < threshold) continue;

            let title = cleanHtml(titleMatch[1]);
            let source = '';

            // Google News 제목 형식: "Title - Source"
            if (title.includes(' - ')) {
                const parts = title.split(' - ');
                source = parts.pop() || '';
                title = parts.join(' - ');
            }

            items.push({
                source,
                title,
                link: linkMatch ? linkMatch[1] : '',
                thumbnail: '',
                description: descMatch ? cleanHtml(descMatch[1]) : '',
                published_at: pubDate.toISOString(),
            });
        }

        return items;
    } catch (error) {
        console.error(`Google News fetch error for "${query}":`, error);
        return [];
    }
}

// Naver News API 가져오기
async function fetchNaverNews(query: string, num: number): Promise<NewsItem[]> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.warn('Naver API credentials not configured');
        return [];
    }

    try {
        const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${num}&sort=date`;
        const response = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
        });

        if (!response.ok) {
            console.error(`Naver API error: ${response.status}`);
            return [];
        }

        const data = await response.json();
        const items = data.items || [];

        return items.map((item: {
            originallink?: string;
            title?: string;
            link?: string;
            description?: string;
            pubDate?: string;
        }) => {
            // 도메인에서 미디어명 추출
            let source = '';
            try {
                const url = new URL(item.originallink || item.link || '');
                source = url.hostname.replace('www.', '').split('.')[0];
            } catch {
                source = '';
            }

            return {
                source,
                title: cleanHtml(item.title || ''),
                link: item.link || '',
                thumbnail: '',
                description: cleanHtml(item.description || ''),
                published_at: item.pubDate ? new Date(item.pubDate).toISOString() : '',
            };
        });
    } catch (error) {
        console.error(`Naver News fetch error for "${query}":`, error);
        return [];
    }
}

// 제목 유사도 계산 (간단한 버전)
function similarity(a: string, b: string): number {
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    if (aLower === bLower) return 1;

    const aWords = new Set(aLower.split(/\s+/));
    const bWords = new Set(bLower.split(/\s+/));

    let intersection = 0;
    for (const word of aWords) {
        if (bWords.has(word)) intersection++;
    }

    return intersection / Math.max(aWords.size, bWords.size);
}

// 중복 제거
function deduplicate(newsList: NewsItem[], threshold = 0.6): NewsItem[] {
    const result: NewsItem[] = [];
    for (const item of newsList) {
        const isDup = result.some((existing) => similarity(item.title, existing.title) >= threshold);
        if (!isDup) {
            result.push(item);
        }
    }
    return result;
}

// 필터링 (연예/가십 등 제외)
function filterNews(newsList: NewsItem[], excludePatterns: RegExp[]): NewsItem[] {
    return newsList.filter((item) => {
        return !excludePatterns.some((pattern) => pattern.test(item.title));
    });
}

// 점수 계산
function scoreNews(item: NewsItem, boostPatterns: RegExp[]): number {
    const text = item.title + ' ' + item.description;
    return boostPatterns.filter((pattern) => pattern.test(text)).length;
}

// POST - scrape news for a category
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const category = body.category;

        if (!category) {
            return NextResponse.json({ error: 'category is required' }, { status: 400 });
        }

        const config = KEYWORD_CONFIG[category] || {
            keywords: [category],
            maxPerSource: 20,
        };

        let allNews: NewsItem[] = [];

        // 사용할 소스 결정 (기본값: 모든 소스)
        const sources = config.sources || ['google', 'naver'];

        // 각 키워드로 뉴스 수집
        for (const keyword of config.keywords) {
            // Google News
            if (sources.includes('google')) {
                const googleNews = await fetchGoogleNews(keyword, config.maxPerSource);
                allNews.push(...googleNews);
            }

            // Naver News
            if (sources.includes('naver')) {
                const naverNews = await fetchNaverNews(keyword, config.maxPerSource);
                allNews.push(...naverNews);
            }
        }

        console.log(`[${category}] Sources: ${sources.join(', ')} | Raw: ${allNews.length} articles`);

        // 1. 필터링 (연예/가십 제거)
        if (config.excludePatterns) {
            allNews = filterNews(allNews, config.excludePatterns);
            console.log(`[${category}] After filter: ${allNews.length} articles`);
        }

        // 2. 날짜순 정렬
        allNews.sort((a, b) => b.published_at.localeCompare(a.published_at));

        // 3. 중복 제거
        allNews = deduplicate(allNews, 0.6);
        console.log(`[${category}] After dedup: ${allNews.length} articles`);

        // 4. 정책/실용 뉴스 우선 정렬
        if (config.boostPatterns) {
            allNews.sort((a, b) => {
                const scoreA = scoreNews(a, config.boostPatterns!);
                const scoreB = scoreNews(b, config.boostPatterns!);
                if (scoreB !== scoreA) return scoreB - scoreA;
                return b.published_at.localeCompare(a.published_at);
            });
        }

        // 5. 최대 40개로 제한
        allNews = allNews.slice(0, 40);

        // 6. DB 중복 체크 먼저 수행 (제목 기준)
        const newNews: NewsItem[] = [];
        let skippedCount = 0;

        for (const news of allNews) {
            const existing = await prisma.news.findUnique({
                where: { title: news.title },
            });
            if (existing) {
                skippedCount++;
            } else {
                newNews.push(news);
            }
        }
        console.log(`[${category}] New articles: ${newNews.length} (${skippedCount} duplicates skipped)`);

        // 7. 새 뉴스에 대해서만 Google News URL 디코딩 + 썸네일 가져오기
        // 429 rate limit 발생 시 해당 뉴스는 스킵, 나머지는 계속 처리
        const processedNews: NewsItem[] = [];
        let rateLimitedCount = 0;

        if (newNews.length > 0) {
            console.log(`[${category}] Resolving URLs & fetching thumbnails for ${newNews.length} new articles...`);
            for (let i = 0; i < newNews.length; i++) {
                const isGoogleUrl = newNews[i].link.includes('news.google.com');

                if (isGoogleUrl) {
                    if (i > 0) await new Promise((r) => setTimeout(r, 1000));
                    const resolvedUrl = await resolveGoogleNewsUrl(newNews[i].link);
                    if (resolvedUrl === null) {
                        // 429 rate limit → 이 뉴스는 스킵
                        rateLimitedCount++;
                        console.log(`  [decode] Rate limited, skipping: ${newNews[i].title.slice(0, 40)}...`);
                        continue;
                    }
                    if (resolvedUrl !== newNews[i].link) {
                        newNews[i].link = resolvedUrl;
                    }
                }

                const thumbResult = await fetchThumbnailOnly(newNews[i].link);
                if (thumbResult) {
                    newNews[i].thumbnail = thumbResult;
                }
                processedNews.push(newNews[i]);
            }
            console.log(`[${category}] Done: ${processedNews.length} processed, ${rateLimitedCount} rate-limited`);
        }

        // 8. DB에 저장
        let insertedCount = 0;

        for (const news of processedNews) {
            try {
                await prisma.news.create({
                    data: {
                        category,
                        source: news.source,
                        title: news.title,
                        link: news.link,
                        thumbnail: news.thumbnail || null,
                        description: news.description || null,
                        publishedAt: news.published_at ? new Date(news.published_at) : new Date(),
                    },
                });
                insertedCount++;
            } catch (error) {
                // 중복 키 에러 등 무시
                skippedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `${insertedCount}개 뉴스가 추가되었습니다. (${skippedCount}개 중복 건너뜀${rateLimitedCount > 0 ? `, ${rateLimitedCount}개 rate limit 스킵` : ''})`,
            inserted: insertedCount,
            skipped: skippedCount,
        });
    } catch (error) {
        console.error('Failed to scrape news:', error);
        return NextResponse.json({
            error: `뉴스 스크래핑 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }, { status: 500 });
    }
}
