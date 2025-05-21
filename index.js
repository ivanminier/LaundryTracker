import express from 'express';
import { chromium } from 'playwright';

const app = express();

// Root health check so Render doesn’t show "APPLICATION LOADING" on /
app.get('/', (req, res) => {
  res.send('✅ LaundryTracker API is running!');
});

app.get('/laundry-status', async (req, res) => {
  const roomUrl = req.query.url;
  if (!roomUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  let browser;
  try {
    // Launch Chromium in no-sandbox mode for Render
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    // Navigate and wait for network idle to start JS
    await page.goto(roomUrl, { waitUntil: 'networkidle' });

    // Give Vue a bit more time to render the table
    await page.waitForTimeout(8000);

    // Scrape all rows in the LaundryView status table
    const machines = await page.$$eval(
      'table#statusTable tbody tr',
      rows => rows.map(r => {
        const cols = r.querySelectorAll('td');
        return {
          machine: cols[1]?.innerText.trim() || '',
          type: cols[2]?.innerText.trim() || '',
          status: cols[3]?.innerText.trim() || '',
        };
      })
    );

    // Close the browser and return JSON
    await browser.close();
    res.json(machines);
  } catch (err) {
    console.error('Scrape error:', err);
    if (browser) await browser.close();
    res.status(500).json({ error: err.toString() });
  }
});

// Use PORT env var (Render sets a random high port), fallback to 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Listening on port ${PORT}`);
});
