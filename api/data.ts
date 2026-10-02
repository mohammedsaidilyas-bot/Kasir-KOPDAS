import fs from 'fs';
import path from 'path';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const TMP_DATA_FILE = path.join('/tmp', 'data.json');
  const ROOT_DATA_FILE = path.join(process.cwd(), 'data.json');

  let data = null;
  if (fs.existsSync(TMP_DATA_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(TMP_DATA_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading /tmp/data.json:', e);
    }
  }

  if (!data && fs.existsSync(ROOT_DATA_FILE)) {
    try {
      data = JSON.parse(fs.readFileSync(ROOT_DATA_FILE, 'utf-8'));
    } catch (e) {
      console.error('Error reading root data.json:', e);
    }
  }

  return res.status(200).json({ success: true, data });
}
