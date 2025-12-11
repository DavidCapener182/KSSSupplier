# iOS Splash Screen Images

The splash screens in this directory are **automatically generated** using the script at `scripts/generate-splash-screens.js`.

## Regenerating Splash Screens

To regenerate all splash screens (e.g., after changing the design), run:

```bash
npm run generate-splash
```

## Design

The splash screens feature:
- **Background**: Charcoal (#2C2C2C) matching the login page
- **Blur Effects**: Subtle gradient circles (red and blue) similar to the login page background
- **Center Text**: "KSS Labour Supplier Portal" in white, centered
- **Bottom Section**: "Powered by CheckPoint" text with the CheckPoint logo

## Generated Files

All 10 splash screen sizes are automatically generated:

1. `apple-splash-2048-2732.png` - iPad Pro 12.9"
2. `apple-splash-1668-2388.png` - iPad Pro 11"
3. `apple-splash-1536-2048.png` - iPad Air/Mini
4. `apple-splash-1284-2778.png` - iPhone 14 Pro Max
5. `apple-splash-1170-2532.png` - iPhone 14 Pro/13 Pro/12 Pro
6. `apple-splash-1125-2436.png` - iPhone XS Max
7. `apple-splash-1242-2688.png` - iPhone XS/11 Pro
8. `apple-splash-828-1792.png` - iPhone XR/11
9. `apple-splash-1242-2208.png` - iPhone 6 Plus/7 Plus/8 Plus
10. `apple-splash-750-1334.png` - iPhone 6/7/8/SE

## Customization

To modify the splash screen design, edit `scripts/generate-splash-screens.js` and run `npm run generate-splash` again.

