import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Tip } from '@/app/types/tip';

const dataDir = path.join(process.cwd(), 'data');

function getFilePath(category: string): string {
  return path.join(dataDir, `${category}_tips.json`);
}

function readTipsByCategory(category: string): Tip[] {
  try {
    const filePath = getFilePath(category);
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeTipsByCategory(category: string, tips: Tip[]): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = getFilePath(category);
  fs.writeFileSync(filePath, JSON.stringify(tips, null, 2), 'utf-8');
}

function getAllTips(): Tip[] {
  if (!fs.existsSync(dataDir)) {
    return [];
  }
  
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_tips.json'));
  const allTips: Tip[] = [];
  
  for (const file of files) {
    try {
      const data = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const tips = JSON.parse(data);
      allTips.push(...tips);
    } catch {
      // Skip invalid files
    }
  }
  
  return allTips.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// GET all tips (optionally filtered by category)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  if (category) {
    const tips = readTipsByCategory(category);
    return NextResponse.json(tips);
  }
  
  const allTips = getAllTips();
  return NextResponse.json(allTips);
}

// POST new tip
export async function POST(request: Request) {
  const body = await request.json();
  const category = body.category || 'general';
  const tips = readTipsByCategory(category);
  
  const newTip: Tip = {
    id: Date.now().toString(),
    category: category,
    title: body.title,
    content: body.content,
    thumbnail: body.thumbnail || '',
    created_at: new Date().toISOString(),
  };
  
  tips.push(newTip);
  writeTipsByCategory(category, tips);
  
  return NextResponse.json(newTip, { status: 201 });
}
