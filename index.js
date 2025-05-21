import express from 'express';
import { chromium } from 'playwright';

const app = express();

app.get('/laundry-status', async (req, res) => {
  const roomUrl = req.query.url;
  if (!roomUrl) return res.status(400).json({ error: 'Missing ?url= parameter' });

  try {
    const browser = await chromium.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(roomUrl, { waitUntil: 'networkidle' });

    // WAIT for the status table to render
    await page.waitForSelector('table#statusTable tbody tr', { timeout: 10000 });

    // Now grab all rows
    const machines = await page.$$eval(
      'table#statusTable tbody tr',
      rows => rows.map(r => {
        const cols = r.querySelectorAll('td');
        return {
          machine: cols[1]?.innerText.trim(),
          type: cols[2]?.innerText.trim(),
          status: cols[3]?.innerText.trim(),
        };
      })
    );

    await browser.close();
    res.json(machines);
  } catch (err) {
    console.error("Scrape error:", err);
    res.status(500).json({ error: err.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Listening on port ${PORT}`));
