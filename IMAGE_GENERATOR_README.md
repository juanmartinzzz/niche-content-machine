# Hot Take Image Generator

A library that generates base64-encoded images from JSON input containing hot takes and visual styles.

## Features

- **4 Visual Styles**: minimal, retro, bold, playful
- **Vercel Compatible**: Uses puppeteer-core + @sparticuz/chromium-min for deployment
- **HTML Canvas Rendering**: Server-side image generation using Puppeteer
- **REST API**: Simple POST endpoint for image generation
- **Test UI**: Interactive page to test the generator

## API Usage

### Library Function

```typescript
import { generateHotTakeImages } from '@/lib/imageGenerator';

const result = await generateHotTakeImages({
  template_json: {
    text: "Pineapple belongs on pizza - fight me!",
    author: "Chef Mario",
    topic: "Food Controversies"
  },
  visualStyle: "minimal" // 'minimal' | 'retro' | 'bold' | 'playful'
});

console.log(result.images); // Array of base64 data URLs
```

### REST API

```bash
POST /api/generate-images
Content-Type: application/json

{
  "text": "Your hot take here",
  "author": "Optional author",
  "topic": "Optional topic",
  "visualStyle": "minimal"
}

# Response:
{
  "images": ["data:image/png;base64,..."]
}
```

## Visual Styles

### Minimal
- Clean white background with subtle gradient
- Sans-serif font, centered layout
- Soft shadows and rounded corners

### Retro
- Colorful gradient background (orange to teal)
- Serif font with vintage styling
- Border effect and slight rotation

### Bold
- Dark background with neon gradients
- Impact font, all caps, high contrast
- Dramatic shadows and effects

### Playful
- Bright gradient background (orange to purple)
- Comic Sans font with emojis
- Rounded corners and fun styling

## Test Page

Visit `/test-images` to test the generator with:
- JSON input textarea
- Visual style pill selector
- Live image generation and download

## Vercel Deployment

The implementation is optimized for Vercel with:
- `puppeteer-core` instead of full puppeteer (smaller bundle)
- `@sparticuz/chromium-min` for minimal Chromium binary
- Environment-aware browser configuration
- Proper headless mode for production

## File Structure

```
src/
├── lib/
│   └── imageGenerator.ts      # Main library with templates and generation logic
├── app/
│   ├── api/
│   │   └── generate-images/
│   │       └── route.ts       # REST API endpoint
│   └── test-images/
│       └── page.tsx           # Test UI page
```