import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

// Helper to find Chrome executable path
async function getExecutablePath() {
  // In production (Vercel), use chromium-min
  if (process.env.NODE_ENV === 'production') {
    return await chromium.executablePath();
  }

  // In development, try environment variable first, then common paths
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // Try to find Chrome in common locations
  const possiblePaths = [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];

  for (const path of possiblePaths) {
    try {
      const { access } = require('fs/promises');
      await access(path);
      return path;
    } catch {
      // Continue to next path
    }
  }

  throw new Error('Could not find Chrome executable. Please set PUPPETEER_EXECUTABLE_PATH environment variable.');
}

export type VisualStyle = 'minimal' | 'retro' | 'bold' | 'playful';

export interface TemplateData {
  [key: string]: any; // Allow arbitrary properties
}

export interface ImageGeneratorInput {
  visualStyle: VisualStyle;
  template_json: TemplateData;
}

export interface ImageGeneratorOutput {
  images: string[]; // Array of base64 data URLs
}

// HTML templates for each visual style
const templates: Record<VisualStyle, string> = {
  minimal: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      width: 100%;
      height: 100%;
    }

    body {
      background: #f0ede8;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: 'DM Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .card {
      width: 1000px;
      height: 600px;
      position: relative;
      background: #faf8f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 70px 90px;
      overflow: hidden;
    }

    /* Corner marks — editorial feel */
    .card::before,
    .card::after {
      content: '';
      position: absolute;
      width: 28px;
      height: 28px;
      border-color: #c8bfb0;
      border-style: solid;
    }
    .card::before {
      top: 28px;
      left: 28px;
      border-width: 1px 0 0 1px;
    }
    .card::after {
      bottom: 28px;
      right: 28px;
      border-width: 0 1px 1px 0;
    }

    /* Extra corners via pseudo on inner wrapper */
    .card-inner::before,
    .card-inner::after {
      content: '';
      position: absolute;
      width: 28px;
      height: 28px;
      border-color: #c8bfb0;
      border-style: solid;
    }
    .card-inner::before {
      top: 28px;
      right: 28px;
      border-width: 1px 1px 0 0;
    }
    .card-inner::after {
      bottom: 28px;
      left: 28px;
      border-width: 0 0 1px 1px;
    }

    .card-inner {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    /* Subtle background texture lines */
    .bg-lines {
      position: absolute;
      inset: 0;
      background-image: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 39px,
        rgba(180, 170, 155, 0.12) 39px,
        rgba(180, 170, 155, 0.12) 40px
      );
      pointer-events: none;
    }

    .content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
      width: 100%;
      max-width: 780px;
      text-align: center;
    }

    .topic {
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: #a0917e;
      margin-bottom: 32px;
    }

    .divider {
      width: 40px;
      height: 1px;
      background: #c8bfb0;
      margin: 0 auto 36px;
    }

    .quote-mark {
      font-family: 'Cormorant Garamond', serif;
      font-size: 96px;
      font-weight: 300;
      line-height: 0.6;
      color: #d4c9b8;
      align-self: flex-start;
      margin-bottom: 8px;
      user-select: none;
    }

    .text {
      font-family: 'Cormorant Garamond', serif;
      font-size: 36px;
      font-weight: 400;
      font-style: italic;
      line-height: 1.45;
      color: #2a2420;
      letter-spacing: -0.2px;
      margin-bottom: 36px;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .meta-line {
      width: 24px;
      height: 1px;
      background: #c8bfb0;
    }

    .author {
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 300;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #7a6e63;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="bg-lines"></div>
    <div class="card-inner"></div>
    <div class="content">
      <div class="topic" id="topicText"></div>
      <div class="divider" id="topicDivider"></div>
      <div class="quote-mark">"</div>
      <div class="text" id="hotTakeText"></div>
      <div class="meta" id="authorMeta">
        <div class="meta-line"></div>
        <div class="author" id="authorText"></div>
        <div class="meta-line"></div>
      </div>
    </div>
  </div>

  <script>
    window.renderText = function(data) {
      const textEl = document.getElementById('hotTakeText');
      const authorEl = document.getElementById('authorText');
      const topicEl = document.getElementById('topicText');
      const authorMeta = document.getElementById('authorMeta');
      const topicDivider = document.getElementById('topicDivider');

      textEl.textContent = data.text || '';
      authorEl.textContent = data.author || '';
      topicEl.textContent = data.topic || '';

      // Hide author row if no author provided
      authorMeta.style.display = data.author ? 'flex' : 'none';
      // Hide topic + divider if no topic provided
      topicEl.style.display = data.topic ? 'block' : 'none';
      topicDivider.style.display = data.topic ? 'block' : 'none';
    }

    // Preview with sample data
    renderText({
      text: "The best products aren't built for everyone. They're built for someone specific, and everyone else just ends up wanting them too.",
      author: "Sarah Chen",
      topic: "Product Design"
    });
  </script>
</body>
</html>
  `,

  retro: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 20px; background: #2d1b69; font-family: 'Times New Roman', serif; }
        .container { width: 500px; height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%); border-radius: 0; border: 8px solid #000; position: relative; padding: 30px; }
        .container::before { content: ''; position: absolute; top: -4px; left: -4px; right: -4px; bottom: -4px; background: repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px); z-index: -1; }
        .text { font-size: 32px; font-weight: bold; color: #000; text-align: center; line-height: 1.3; max-width: 400px; text-shadow: 2px 2px 0px #fff; transform: rotate(-1deg); margin-bottom: 20px; }
        .author { font-size: 18px; font-weight: normal; color: #000; text-align: center; margin-bottom: 10px; text-shadow: 1px 1px 0px #fff; }
        .topic { font-size: 16px; font-weight: bold; color: #000; text-align: center; text-transform: uppercase; letter-spacing: 1px; text-shadow: 1px 1px 0px #fff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="text" id="hotTakeText"></div>
        <div class="author" id="authorText"></div>
        <div class="topic" id="topicText"></div>
      </div>
      <script>
        window.renderText = function(data) {
          const textElement = document.getElementById('hotTakeText');
          const authorElement = document.getElementById('authorText');
          const topicElement = document.getElementById('topicText');

          textElement.textContent = data.text || '';
          authorElement.textContent = data.author ? '— ' + data.author : '';
          topicElement.textContent = data.topic || '';
        }
      </script>
    </body>
    </html>
  `,

  bold: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 20px; background: #000000; font-family: Impact, 'Arial Black', sans-serif; }
        .container { width: 500px; height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #ff0080 0%, #8000ff 100%); border-radius: 0; position: relative; overflow: hidden; padding: 30px; }
        .container::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(90deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 4px); }
        .text { font-size: 36px; font-weight: bold; color: #ffffff; text-align: center; line-height: 1.2; max-width: 400px; text-transform: uppercase; text-shadow: 3px 3px 0px #000; letter-spacing: 1px; margin-bottom: 20px; }
        .author { font-size: 20px; font-weight: normal; color: #ffffff; text-align: center; margin-bottom: 10px; text-shadow: 2px 2px 0px #000; }
        .topic { font-size: 18px; font-weight: bold; color: #ffffff; text-align: center; text-transform: uppercase; letter-spacing: 2px; text-shadow: 2px 2px 0px #000; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="text" id="hotTakeText"></div>
        <div class="author" id="authorText"></div>
        <div class="topic" id="topicText"></div>
      </div>
      <script>
        window.renderText = function(data) {
          const textElement = document.getElementById('hotTakeText');
          const authorElement = document.getElementById('authorText');
          const topicElement = document.getElementById('topicText');

          textElement.textContent = data.text || '';
          authorElement.textContent = data.author ? '— ' + data.author : '';
          topicElement.textContent = data.topic || '';
        }
      </script>
    </body>
    </html>
  `,

  playful: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 20px; background: #ffeb3b; font-family: 'Comic Sans MS', cursive; }
        .container { width: 500px; height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #ff9800 0%, #e91e63 50%, #9c27b0 100%); border-radius: 50px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.3); padding: 30px; }
        .text { font-size: 30px; font-weight: bold; color: #ffffff; text-align: center; line-height: 1.3; max-width: 400px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); margin-bottom: 15px; }
        .emoji { font-size: 40px; display: block; margin-top: 10px; }
        .author { font-size: 18px; font-weight: normal; color: #ffffff; text-align: center; margin-bottom: 10px; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }
        .topic { font-size: 16px; font-weight: bold; color: #ffffff; text-align: center; text-transform: uppercase; letter-spacing: 1px; text-shadow: 1px 1px 3px rgba(0,0,0,0.5); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="text" id="hotTakeText">
          <span id="mainText"></span>
          <span class="emoji">🎉✨</span>
        </div>
        <div class="author" id="authorText"></div>
        <div class="topic" id="topicText"></div>
      </div>
      <script>
        window.renderText = function(data) {
          const mainText = document.getElementById('mainText');
          const authorElement = document.getElementById('authorText');
          const topicElement = document.getElementById('topicText');

          mainText.textContent = data.text || '';
          authorElement.textContent = data.author ? '— ' + data.author : '';
          topicElement.textContent = data.topic || '';
        }
      </script>
    </body>
    </html>
  `,
};

export async function generateHotTakeImages(input: ImageGeneratorInput): Promise<ImageGeneratorOutput> {
  const { template_json, visualStyle } = input;

  if (!template_json?.text || !visualStyle) {
    throw new Error('Template JSON with text and visualStyle are required');
  }

  if (!templates[visualStyle]) {
    throw new Error(`Invalid visual style: ${visualStyle}`);
  }

  let browser;
  try {
    // Launch browser with executable path detection
    const executablePath = await getExecutablePath();
    const isLocal = process.env.NODE_ENV !== 'production';

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: isLocal
        ? ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        : chromium.args,
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 540, height: 340 });

    // Load the template
    await page.setContent(templates[visualStyle]);

    // Inject the template data
    await page.evaluate((templateData) => {
      (window as any).renderText(templateData);
    }, template_json);

    // Wait a bit for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      encoding: 'base64',
      fullPage: true
    });

    const base64Image = `data:image/png;base64,${screenshot}`;

    return {
      images: [base64Image] // Return as array for potential future expansion
    };

  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error(`Failed to generate image: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}