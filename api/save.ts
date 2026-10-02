import fs from 'fs';
import path from 'path';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { data } = req.body || {};
    if (!data) {
      return res.status(400).json({ success: false, message: 'Missing data' });
    }
    const TMP_DATA_FILE = path.join('/tmp', 'data.json');
    const ROOT_DATA_FILE = path.join(process.cwd(), 'data.json');

    try {
      fs.writeFileSync(TMP_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      try {
        fs.writeFileSync(ROOT_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch (e) {
        // Root dir might be read-only on serverless, ignoring root write error
      }
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ success: false, message: (e as Error).message });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}
