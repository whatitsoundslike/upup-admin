import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

const scriptMap: Record<string, string> = {
  'make-all-json': 'zmake_all_json.py',
};

export async function POST(request: NextRequest) {
  const { script } = await request.json();

  const scriptFile = scriptMap[script];
  if (!scriptFile) {
    return NextResponse.json(
      { success: false, message: '알 수 없는 스크립트입니다.' },
      { status: 400 }
    );
  }

  const scriptPath = path.join(process.cwd(), 'python_script', scriptFile);

  return new Promise<NextResponse>((resolve) => {
    exec(`python "${scriptPath}"`, { cwd: process.cwd(), env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }, (error, stdout, stderr) => {
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
        NextResponse.json({ success: true, message: stdout.trim() || '실행 완료' })
      );
    });
  });
}
