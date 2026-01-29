import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Product } from '@/app/types/product';

const dataDir = path.join(process.cwd(), 'data');

function getFilePath(category: string): string {
  return path.join(dataDir, `${category}_products.json`);
}

function readProductsByCategory(category: string): Product[] {
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

function writeProductsByCategory(category: string, products: Product[]): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = getFilePath(category);
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2), 'utf-8');
}

function getAllProducts(): Product[] {
  if (!fs.existsSync(dataDir)) {
    return [];
  }
  
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_products.json'));
  const allProducts: Product[] = [];
  
  for (const file of files) {
    try {
      const data = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const products = JSON.parse(data);
      allProducts.push(...products);
    } catch {
      // Skip invalid files
    }
  }
  
  return allProducts.sort((a, b) => 
    parseInt(a.order || '0') - parseInt(b.order || '0')
  );
}

// GET all products (optionally filtered by category)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  
  if (category) {
    const products = readProductsByCategory(category);
    return NextResponse.json(products);
  }
  
  const allProducts = getAllProducts();
  return NextResponse.json(allProducts);
}

// POST new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = body.category || 'tesla';
    const products = readProductsByCategory(category);
    
    const newProduct: Product = {
      id: Date.now().toString(),
      category: category,
      name: body.name,
      price: body.price,
      thumbnail: body.thumbnail,
      deliverType: body.deliverType || '',
      link: body.link,
      order: body.order || '0',
      created_at: new Date().toISOString(),
    };
    
    products.push(newProduct);
    writeProductsByCategory(category, products);
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
