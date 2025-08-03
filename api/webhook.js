// Store webhook data temporarily (in production, you'd use a database)
let webhookData = [];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    // Handle TradingView webhook
    const { Close, Cell } = req.body;
    
    if (!Close || !Cell) {
      return res.status(400).json({ error: 'Missing Close or Cell parameter' });
    }

    // Store the data with timestamp
    const data = {
      close: Close,
      cell: Cell,
      timestamp: new Date().toISOString(),
      processed: false
    };

    webhookData.push(data);
    
    // Keep only last 100 entries to prevent memory issues
    if (webhookData.length > 100) {
      webhookData = webhookData.slice(-100);
    }

    console.log('Received webhook:', data);
    return res.status(200).json({ success: true, message: 'Data received' });
  }

  if (req.method === 'GET') {
    // Return unprocessed data for Google Sheets to pull
    const unprocessed = webhookData.filter(item => !item.processed);
    return res.status(200).json({ data: unprocessed });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
