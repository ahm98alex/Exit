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
    try {
      let Close, Cell;
      
      // Log the incoming request for debugging
      console.log('Request body:', req.body);
      console.log('Request body type:', typeof req.body);
      
      // Handle different TradingView webhook formats
      if (typeof req.body === 'string') {
        // If body is a string, try to parse it as JSON first
        try {
          const parsed = JSON.parse(req.body);
          Close = parsed.Close;
          Cell = parsed.Cell;
        } catch (e) {
          // If not JSON, try to parse as URL-encoded (Close=150.25&Cell=A5)
          const params = new URLSearchParams(req.body);
          Close = params.get('Close');
          Cell = params.get('Cell');
        }
      } else if (typeof req.body === 'object' && req.body !== null) {
        // If body is already an object
        Close = req.body.Close;
        Cell = req.body.Cell;
      }
      
      // Also check query parameters as fallback
      if (!Close || !Cell) {
        Close = Close || req.query.Close;
        Cell = Cell || req.query.Cell;
      }
      
      console.log('Extracted - Close:', Close, 'Cell:', Cell);
      
      if (!Close || !Cell) {
        console.log('Missing parameters - Close:', Close, 'Cell:', Cell);
        return res.status(400).json({ 
          error: 'Missing Close or Cell parameter',
          received: { body: req.body, query: req.query }
        });
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

      console.log('Successfully stored webhook data:', data);
      return res.status(200).json({ success: true, message: 'Data received', data: data });
      
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  if (req.method === 'GET') {
    // Return unprocessed data for Google Sheets to pull
    const unprocessed = webhookData.filter(item => !item.processed);
    return res.status(200).json({ data: unprocessed });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
