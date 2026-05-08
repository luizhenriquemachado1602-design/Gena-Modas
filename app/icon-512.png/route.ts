import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'icon-512.png');
    // Check if file exists in root (since user said it's in rep root)
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: { 'Content-Type': 'image/png' },
      });
    }
    
    // Check if in public
    const publicPath = path.join(process.cwd(), 'public', 'icon-512.png');
    if (fs.existsSync(publicPath)) {
      const fileBuffer = fs.readFileSync(publicPath);
      return new NextResponse(fileBuffer, {
        headers: { 'Content-Type': 'image/png' },
      });
    }
    
    // Fallback transparent/placeholder PNG
    const placeholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAAA1BMVEWwPV0AAAARaERcwgAAACVJREFUeF7twTEBAAAAwiD7p7bGDmAAAAAAAAAAAAAAAAAAAAAAgDkPAAFePsoAAAAASUVORK5CYII=', 'base64');
    return new NextResponse(placeholder, {
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
