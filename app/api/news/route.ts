import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { News } from '@/app/types/news';

const dataDir = path.join(process.cwd(), 'data');

function getFilePath(category: string): string {
  return path.join(dataDir, `${category}_news.json`);
}

function readNewsByCategory(category: string): News[] {
  try {
    const filePath = getFilePath(category);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    const raw = JSON.parse(data);
    return raw.map((item: News & { id?: string }, index: number) => ({
      id: item.id || `${category}-${index}`,
      category,
      source: item.source || '',
      title: item.title || '',
      link: item.link || '',
      thumbnail: item.thumbnail || '',
      description: item.description || '',
      published_at: item.published_at || '',
    }));
  } catch {
    return [];
  }
}

function writeNewsByCategory(category: string, news: News[]): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = getFilePath(category);
  fs.writeFileSync(filePath, JSON.stringify(news, null, 2), 'utf-8');
}

function getAllNews(): News[] {
  if (!fs.existsSync(dataDir)) {
    return [];
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_news.json'));
  const allNews: News[] = [];

  for (const file of files) {
    const category = file.replace('_news.json', '');
    const news = readNewsByCategory(category);
    allNews.push(...news);
  }

  return allNews.sort((a, b) => b.published_at.localeCompare(a.published_at));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  if (category) {
    const news = readNewsByCategory(category);
    return NextResponse.json(news);
  }

  const allNews = getAllNews();
  return NextResponse.json(allNews);
}

export async function POST(request: Request) {
  const body = await request.json();
  const category = body.category || 'tesla';
  const news = readNewsByCategory(category);

  const newNews: News = {
    id: Date.now().toString(),
    category,
    source: body.source || '',
    title: body.title,
    link: body.link || '',
    thumbnail: body.thumbnail || '',
    description: body.description || '',
    published_at: body.published_at || new Date().toISOString(),
  };

  news.unshift(newNews);
  writeNewsByCategory(category, news);

  return NextResponse.json(newNews, { status: 201 });
}
