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
  fs.writeFileSync(getFilePath(category), JSON.stringify(tips, null, 2), 'utf-8');
}

function findTipById(id: string): { tip: Tip; category: string } | null {
  if (!fs.existsSync(dataDir)) {
    return null;
  }

  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_tips.json'));

  for (const file of files) {
    try {
      const data = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const tips: Tip[] = JSON.parse(data);
      const tip = tips.find(t => t.id === id);
      if (tip) {
        const category = file.replace('_tips.json', '');
        return { tip, category };
      }
    } catch {
      // Skip invalid files
    }
  }

  return null;
}

// GET single tip
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = findTipById(id);

  if (!result) {
    return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
  }

  return NextResponse.json(result.tip);
}

// PUT update tip
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const result = findTipById(id);

  if (!result) {
    return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
  }

  const oldCategory = result.category;
  const newCategory = body.category || oldCategory;

  // If category changed, move the tip to the new file
  if (oldCategory !== newCategory) {
    // Remove from old file
    let oldTips = readTipsByCategory(oldCategory);
    oldTips = oldTips.filter(t => t.id !== id);
    writeTipsByCategory(oldCategory, oldTips);

    // Add to new file
    const newTips = readTipsByCategory(newCategory);
    const updatedTip: Tip = {
      ...result.tip,
      category: newCategory,
      title: body.title,
      summary: body.summary || '',
      content: body.content,
      thumbnail: body.thumbnail ?? result.tip.thumbnail ?? '',
    };
    newTips.push(updatedTip);
    writeTipsByCategory(newCategory, newTips);

    return NextResponse.json(updatedTip);
  } else {
    // Update in same file
    const tips = readTipsByCategory(oldCategory);
    const tipIndex = tips.findIndex(t => t.id === id);

    tips[tipIndex] = {
      ...tips[tipIndex],
      title: body.title,
      summary: body.summary || '',
      content: body.content,
      thumbnail: body.thumbnail ?? tips[tipIndex].thumbnail ?? '',
    };

    writeTipsByCategory(oldCategory, tips);

    return NextResponse.json(tips[tipIndex]);
  }
}

// DELETE tip
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = findTipById(id);

  if (!result) {
    return NextResponse.json({ error: 'Tip not found' }, { status: 404 });
  }

  let tips = readTipsByCategory(result.category);
  tips = tips.filter(t => t.id !== id);
  writeTipsByCategory(result.category, tips);

  return NextResponse.json({ success: true });
}
