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
  fs.writeFileSync(getFilePath(category), JSON.stringify(news, null, 2), 'utf-8');
}

function findNewsById(id: string): { news: News; category: string } | null {
  if (!fs.existsSync(dataDir)) {
    return null;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_news.json'));

  for (const file of files) {
    const category = file.replace('_news.json', '');
    const newsList = readNewsByCategory(category);
    const news = newsList.find(n => n.id === id);
    if (news) {
      return { news, category };
    }
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = findNewsById(id);

  if (!result) {
    return NextResponse.json({ error: 'News not found' }, { status: 404 });
  }

  return NextResponse.json(result.news);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = findNewsById(id);

  if (!result) {
    return NextResponse.json({ error: 'News not found' }, { status: 404 });
  }

  const oldCategory = result.category;
  const newCategory = body.category || oldCategory;

  if (oldCategory !== newCategory) {
    let oldNews = readNewsByCategory(oldCategory);
    oldNews = oldNews.filter(n => n.id !== id);
    writeNewsByCategory(oldCategory, oldNews);

    const newNews = readNewsByCategory(newCategory);
    const updatedNews: News = {
      ...result.news,
      category: newCategory,
      source: body.source,
      title: body.title,
      link: body.link || '',
      thumbnail: body.thumbnail || '',
      description: body.description || '',
      published_at: body.published_at || result.news.published_at,
    };
    newNews.unshift(updatedNews);
    writeNewsByCategory(newCategory, newNews);

    return NextResponse.json(updatedNews);
  } else {
    const news = readNewsByCategory(oldCategory);
    const index = news.findIndex(n => n.id === id);

    news[index] = {
      ...news[index],
      source: body.source,
      title: body.title,
      link: body.link || '',
      thumbnail: body.thumbnail || '',
      description: body.description || '',
      published_at: body.published_at || news[index].published_at,
    };

    writeNewsByCategory(oldCategory, news);
    return NextResponse.json(news[index]);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = findNewsById(id);

  if (!result) {
    return NextResponse.json({ error: 'News not found' }, { status: 404 });
  }

  let news = readNewsByCategory(result.category);
  news = news.filter(n => n.id !== id);
  writeNewsByCategory(result.category, news);

  return NextResponse.json({ success: true });
}
