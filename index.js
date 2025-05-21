import express from 'express';
import { chromium } from 'playwright';

const app = express();

// Health check for /
app.get('/', (_req, res) => {
  res.send('✅ LaundryTracker API up');
});

app.get('/laundry-status', async (req, res) => {
  const roomUrl = req.query.url;
  if (!roomUrl) {
    return res.status(400).json({ error: 'Missing ?url= parameter' });
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ]
    });
    const page = await browser.newPage();

    // Go to the LaundryView page
    await page.goto(roomUrl, { waitUntil: 'networkidle' });

    // Wait up to 15 s for Vue to render
    await page.waitForTimeout(15000);

    // Grab all table rows
    const machines = await page.$$eval('table#statusTable tbody tr', rows =>
      rows.map(r => {
        const cols = r.querySelectorAll('td');
        return {
          machine: cols[1]?.innerText.trim() || '',
          type: cols[2]?.innerText.trim() || '',
          status: cols[3]?.innerText.trim() || '',
        };
      })
    );

    if (!machines.length) {
      // If still empty, dump the HTML to logs for debugging
      const html = await page.content();
      console.error('No rows found—page content was:\n', html);
    }

    await browser.close();
    return res.json(machines);
  } catch (err) {
    console.error('Scrape error:', err);
    if (browser) await browser.close();
    return res.status(500).json({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
