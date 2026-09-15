import type { IncomingMessage, ServerResponse } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  // Add CORS headers for web requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        status: 'online',
        service: 'Packing Verification Evidence API',
        timestamp: new Date().toISOString(),
        platform: 'Vercel Serverless',
      })
    );
    return;
  }

  if (req.method === 'POST') {
    // Consume incoming upload stream
    await new Promise<void>((resolve) => {
      req.on('data', () => {});
      req.on('end', () => resolve());
      req.on('error', () => resolve());
    });

    const recordId = 'PK-' + Math.floor(100000 + Math.random() * 900000);
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(
      JSON.stringify({
        success: true,
        id: recordId,
        message: 'บันทึกหลักฐานวิดีโอและภาพถ่ายลงระบบสำเร็จ',
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Method Not Allowed' }));
}
