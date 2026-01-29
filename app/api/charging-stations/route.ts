import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ChargingStation } from '@/app/types/charging-station';

const DATA_FILE = path.join(process.cwd(), 'data', 'super_charger.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readData(): ChargingStation[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read status data:', error);
    return [];
  }
}

function writeData(data: ChargingStation[]) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const stations = readData();
  return NextResponse.json(stations);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const stations = readData();
    
    const newStation: ChargingStation = {
      id: Date.now().toString(),
      name: body.name,
      position: body.position,
      address: body.address,
      created_at: new Date().toISOString(),
    };
    
    stations.push(newStation);
    writeData(stations);
    
    return NextResponse.json(newStation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create station' }, { status: 500 });
  }
}
