const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

// Splash screen sizes to generate
const splashSizes = [
  { width: 2048, height: 2732, name: 'apple-splash-2048-2732.png' }, // iPad Pro 12.9"
  { width: 1668, height: 2388, name: 'apple-splash-1668-2388.png' }, // iPad Pro 11"
  { width: 1536, height: 2048, name: 'apple-splash-1536-2048.png' }, // iPad Air/Mini
  { width: 1284, height: 2778, name: 'apple-splash-1284-2778.png' }, // iPhone 14 Pro Max
  { width: 1170, height: 2532, name: 'apple-splash-1170-2532.png' }, // iPhone 14 Pro/13 Pro/12 Pro
  { width: 1125, height: 2436, name: 'apple-splash-1125-2436.png' }, // iPhone XS Max
  { width: 1242, height: 2688, name: 'apple-splash-1242-2688.png' }, // iPhone XS/11 Pro
  { width: 828, height: 1792, name: 'apple-splash-828-1792.png' }, // iPhone XR/11
  { width: 1242, height: 2208, name: 'apple-splash-1242-2208.png' }, // iPhone 6 Plus/7 Plus/8 Plus
  { width: 750, height: 1334, name: 'apple-splash-750-1334.png' }, // iPhone 6/7/8/SE
];

const backgroundColor = '#2C2C2C'; // Charcoal background
const primaryColor = 'rgba(239, 68, 68, 0.1)'; // Red primary with 10% opacity (#EF4444)
const blueColor = 'rgba(59, 130, 246, 0.1)'; // Blue with 10% opacity (#3B82F6)
const textColor = '#FFFFFF';
const poweredByColor = 'rgba(255, 255, 255, 0.6)';

async function generateSplashScreen(size, checkpointLogo) {
  const { width, height, name } = size;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Draw blur effects (gradient circles) - similar to login page
  // Top right blur
  const gradient1 = ctx.createRadialGradient(
    width * 0.95, height * -0.1,
    0,
    width * 0.95, height * -0.1,
    width * 0.5
  );
  gradient1.addColorStop(0, primaryColor);
  gradient1.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient1;
  ctx.fillRect(0, 0, width, height);

  // Bottom left blur
  const gradient2 = ctx.createRadialGradient(
    width * -0.05, height * 1.1,
    0,
    width * -0.05, height * 1.1,
    width * 0.5
  );
  gradient2.addColorStop(0, blueColor);
  gradient2.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient2;
  ctx.fillRect(0, 0, width, height);

  // Center text: "KSS Labour Supplier Portal"
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Use a font size that scales with screen size
  const fontSize = Math.max(48, width * 0.05);
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`;
  
  const centerText = 'KSS Labour Supplier Portal';
  ctx.fillText(centerText, width / 2, height / 2);

  // Bottom section: "Powered by CheckPoint" with logo
  const bottomPadding = height * 0.08;
  const logoSize = Math.min(width * 0.15, height * 0.1, 120);
  const logoY = height - bottomPadding - logoSize / 2;
  
  // Draw "Powered by" text
  const poweredByFontSize = Math.max(16, width * 0.02);
  ctx.font = `${poweredByFontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif`;
  ctx.fillStyle = poweredByColor;
  
  const poweredByText = 'Powered by';
  const textMetrics = ctx.measureText(poweredByText);
  const textX = width / 2;
  const textY = logoY - logoSize / 2 - 10;
  
  ctx.fillText(poweredByText, textX, textY);

  // Draw CheckPoint logo
  if (checkpointLogo) {
    const logoX = width / 2;
    const logoYPos = logoY;
    
    // Draw logo centered
    ctx.drawImage(
      checkpointLogo,
      logoX - logoSize / 2,
      logoYPos - logoSize / 2,
      logoSize,
      logoSize
    );
  }

  // Save the image
  const outputPath = path.join(__dirname, '..', 'public', 'splash', name);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated ${name} (${width}x${height})`);
}

async function main() {
  console.log('Generating splash screens...\n');

  // Ensure splash directory exists
  const splashDir = path.join(__dirname, '..', 'public', 'splash');
  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
  }

  // Load CheckPoint logo
  let checkpointLogo = null;
  const logoPath = path.join(__dirname, '..', 'public', 'CheckPoint.png');
  if (fs.existsSync(logoPath)) {
    try {
      checkpointLogo = await loadImage(logoPath);
      console.log('✓ Loaded CheckPoint logo\n');
    } catch (error) {
      console.warn('⚠ Could not load CheckPoint logo, continuing without it:', error.message);
    }
  } else {
    console.warn('⚠ CheckPoint logo not found at', logoPath, '- continuing without it\n');
  }

  // Generate all splash screens
  for (const size of splashSizes) {
    await generateSplashScreen(size, checkpointLogo);
  }

  console.log('\n✅ All splash screens generated successfully!');
  console.log(`📁 Output directory: ${splashDir}`);
}

main().catch((error) => {
  console.error('❌ Error generating splash screens:', error);
  process.exit(1);
});

