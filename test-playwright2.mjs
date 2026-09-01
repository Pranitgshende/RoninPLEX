import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  console.log("Navigating to Watch page...");
  await page.goto('http://localhost:5173/watch/anime/1/1', { waitUntil: 'networkidle' });

  await page.waitForTimeout(5000);

  const vids = await page.evaluate(() => document.querySelectorAll('video').length);
  const iframes = await page.evaluate(() => document.querySelectorAll('iframe').length);
  
  const hlsError = await page.evaluate(() => (window as any).hlsError);
  const animeHTML = await page.evaluate(() => document.querySelector('.AnimeVideoPlayer')?.innerHTML || 'NOT FOUND');

  console.log("Videos:", vids);
  console.log("Iframes:", iframes);
  console.log("HLS Error:", hlsError);
  console.log("Anime HTML:", animeHTML);

  await browser.close();
})();
