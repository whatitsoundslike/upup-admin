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
  fs.writeFileSync(getFilePath(category), JSON.stringify(products, null, 2), 'utf-8');
}

function findProductById(id: string): { product: Product; category: string } | null {
  if (!fs.existsSync(dataDir)) {
    return null;
  }
  
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('_products.json'));
  
  for (const file of files) {
    try {
      const data = fs.readFileSync(path.join(dataDir, file), 'utf-8');
      const products: Product[] = JSON.parse(data);
      const product = products.find(p => p.id === id);
      if (product) {
        const category = file.replace('_products.json', '');
        return { product, category };
      }
    } catch {
      // Skip invalid files
    }
  }
  
  return null;
}

// GET single product
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = findProductById(id);
  
  if (!result) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  
  return NextResponse.json(result.product);
}

// PUT update product
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = findProductById(id);
    
    if (!result) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const oldCategory = result.category;
    const newCategory = body.category || oldCategory;
    
    // If category changed, move the product to the new file
    if (oldCategory !== newCategory) {
      // Remove from old file
      let oldProducts = readProductsByCategory(oldCategory);
      oldProducts = oldProducts.filter(p => p.id !== id);
      writeProductsByCategory(oldCategory, oldProducts);
      
      // Add to new file
      const newProducts = readProductsByCategory(newCategory);
      const updatedProduct: Product = {
        ...result.product,
        category: newCategory,
        name: body.name,
        price: body.price,
        thumbnail: body.thumbnail,
        deliverType: body.deliverType,
        link: body.link,
        order: body.order,
      };
      newProducts.push(updatedProduct);
      writeProductsByCategory(newCategory, newProducts);
      
      return NextResponse.json(updatedProduct);
    } else {
      // Update in same file
      const products = readProductsByCategory(oldCategory);
      const index = products.findIndex(p => p.id === id);
      
      products[index] = {
        ...products[index],
        name: body.name,
        price: body.price,
        thumbnail: body.thumbnail,
        deliverType: body.deliverType,
        link: body.link,
        order: body.order,
      };
      
      writeProductsByCategory(oldCategory, products);
      return NextResponse.json(products[index]);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = findProductById(id);
  
  if (!result) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }
  
  let products = readProductsByCategory(result.category);
  products = products.filter(p => p.id !== id);
  writeProductsByCategory(result.category, products);
  
  return NextResponse.json({ success: true });
}
