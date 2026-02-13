import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const screenshotDir = './kmong_screenshots';

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function detailedAnalysis() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 }
  });

  try {
    console.log('=== DETAILED KMONG ANALYSIS ===\n');

    // 1. HOMEPAGE
    console.log('1. HOMEPAGE ANALYSIS');
    await page.goto('https://kmong.com/', { waitUntil: 'networkidle' });
    
    await page.screenshot({ path: path.join(screenshotDir, '01_homepage_hero.png') });
    console.log('✓ Hero section screenshot');

    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '02_homepage_categories.png') });
    console.log('✓ Categories section screenshot');

    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '03_homepage_services.png') });
    console.log('✓ Services section screenshot');

    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '04_homepage_footer.png') });
    console.log('✓ Footer section screenshot');

    // 2. CATEGORY PAGE
    console.log('\n2. CATEGORY PAGE ANALYSIS');
    await page.goto('https://kmong.com/category/7', { waitUntil: 'networkidle' });
    
    await page.screenshot({ path: path.join(screenshotDir, '05_category_header.png') });
    console.log('✓ Category header screenshot');

    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '06_category_cards.png') });
    console.log('✓ Category cards screenshot');

    // 3. SERVICE DETAIL PAGE
    console.log('\n3. SERVICE DETAIL PAGE ANALYSIS');
    
    const serviceLinks = await page.locator('a[href*="/gig"], a[href*="/service"]').all();
    if (serviceLinks.length > 0) {
      try {
        await serviceLinks[0].click();
        await page.waitForLoadState('networkidle');
        
        await page.screenshot({ path: path.join(screenshotDir, '07_detail_header.png') });
        console.log('✓ Detail page header screenshot');

        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, '08_detail_content.png') });
        console.log('✓ Detail page content screenshot');

        await page.evaluate(() => window.scrollBy(0, 400));
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(screenshotDir, '09_detail_reviews.png') });
        console.log('✓ Detail page reviews screenshot');
      } catch (e) {
        console.log('Could not navigate to detail page');
      }
    }

    // 4. MOBILE
    console.log('\n4. MOBILE RESPONSIVENESS');
    const mobilePage = await browser.newPage({
      viewport: { width: 375, height: 667 }
    });
    
    await mobilePage.goto('https://kmong.com/', { waitUntil: 'networkidle' });
    await mobilePage.screenshot({ path: path.join(screenshotDir, '10_mobile_homepage.png'), fullPage: true });
    console.log('✓ Mobile homepage screenshot');
    await mobilePage.close();

    console.log('\n=== ANALYSIS COMPLETE ===');
    console.log(`Screenshots saved to: ${screenshotDir}`);
    const files = fs.readdirSync(screenshotDir);
    console.log(`Total screenshots: ${files.length}`);
    files.forEach(f => console.log(`  - ${f}`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

detailedAnalysis();
