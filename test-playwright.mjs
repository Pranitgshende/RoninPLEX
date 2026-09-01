import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  
  page.on('response', response => {
    if (response.status() >= 400 && response.url().includes('proxy')) {
      console.error(`[NETWORK ERROR] ${response.status()} ${response.url()}`);
    }
  });

  console.log('Navigating to Watch page...');
  await page.goto('http://localhost:5173/#/watch/anime/269/1', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting for video tag...');
  await page.waitForSelector('video', { timeout: 60000 });
  
  console.log('Waiting for video to start playing...');
  const isPlaying = await page.evaluate(async () => {
    const video = document.querySelector('video');
    return new Promise(resolve => {
      if (video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2) {
        resolve(true);
      } else {
        video.addEventListener('timeupdate', () => {
          if (video.currentTime > 0) resolve(true);
        });
        setTimeout(() => resolve(false), 20000); // 20s timeout
      }
    });
  });
  
  console.log(`Video playing: ${isPlaying}`);
  
  await browser.close();
})();
