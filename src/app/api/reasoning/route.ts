import { NextResponse } from 'next/server';

const GOOGLE_SHEET_ID = '1q-l6GBuv6U2fdoLL-bZZmmP999__GvTzamofY5KF350';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

let cachedData: ReasoningEntry[] | null = null;
let lastFetchTime = 0;

interface ReasoningEntry {
  timestamp: string;
  ticker: string;
  reasoning: string;
}

export async function GET() {
  try {
    // Check cache
    const now = Date.now();
    if (cachedData && (now - lastFetchTime) < CACHE_DURATION_MS) {
      console.log('📦 Returning cached reasoning data');
      return NextResponse.json(cachedData);
    }

    // Fetch fresh data from Google Sheet as CSV
    console.log('🌐 Fetching fresh reasoning data from Google Sheet');
    const csvUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`;

    const response = await fetch(csvUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.status}`);
    }

    const csvText = await response.text();

    // Parse CSV (simple parser for 3 columns: Timestamp, Ticker, Reasoning)
    const lines = csvText.split('\n');
    const data: ReasoningEntry[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma, but handle commas within quoted fields
      const parts = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);

      if (parts && parts.length >= 3) {
        let timestamp = parts[0].replace(/^"|"$/g, '').trim();
        const ticker = parts[1].replace(/^"|"$/g, '').trim();
        const reasoning = parts.slice(2).join(',').replace(/^"|"$/g, '').trim();

        // Normalize timestamp format to ISO
        // Handle DD/MM/YYYY or DD-MM-YYYY formats
        if (timestamp.includes('/') || (timestamp.includes('-') && timestamp.split('-')[0].length <= 2)) {
          const parts = timestamp.split(/[\s\/\-:]+/);
          if (parts.length >= 5) {
            // parts: [DD, MM, YYYY, HH, MM, SS?]
            const day = parts[0];
            const month = parts[1];
            const year = parts[2];
            const hour = parts[3];
            const minute = parts[4];
            const second = parts[5] || '00';
            timestamp = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
          }
        }

        if (timestamp && ticker && reasoning) {
          data.push({ timestamp, ticker, reasoning });
        }
      }
    }

    console.log(`✅ Parsed ${data.length} reasoning entries from Google Sheet`);

    // Update cache
    cachedData = data;
    lastFetchTime = now;

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching reasoning data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reasoning data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
