import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ChargingStation } from '@/app/types/charging-station';

const DATA_FILE = path.join(process.cwd(), 'data', 'super_charger.json');

function readData(): ChargingStation[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeData(data: ChargingStation[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stations = readData();
  const station = stations.find(s => s.id === id);
  
  if (!station) {
    return NextResponse.json({ error: 'Station not found' }, { status: 404 });
  }
  
  return NextResponse.json(station);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const stations = readData();
    const index = stations.findIndex(s => s.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }
    
    stations[index] = {
      ...stations[index],
      name: body.name,
      position: body.position,
      address: body.address,
    };
    
    writeData(stations);
    return NextResponse.json(stations[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update station' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const stations = readData();
  const newStations = stations.filter(s => s.id !== id);
  
  if (stations.length === newStations.length) {
    return NextResponse.json({ error: 'Station not found' }, { status: 404 });
  }
  
  writeData(newStations);
  return NextResponse.json({ success: true });
}
