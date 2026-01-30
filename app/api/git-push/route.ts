import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'git_push.py');

  return new Promise<NextResponse>((resolve) => {
    exec(`python "${scriptPath}"`, { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        resolve(
          NextResponse.json(
            { success: false, message: stderr || error.message },
            { status: 500 }
          )
        );
        return;
      }
      resolve(
        NextResponse.json({ success: true, message: stdout.trim() })
      );
    });
  });
}
