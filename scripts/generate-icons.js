const fs = require('fs');
const path = require('path');
let sharp = null;
let jimp = null;
try {
  sharp = require('sharp');
} catch (e) {
  // sharp not available, try jimp
  try {
    jimp = require('jimp');
  } catch (e2) {
    // will error later
  }
}

const sizes = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192,
  // legacy web/pwa sizes
  'icon-192': 192,
  'icon-512': 512
};

const svgPath = path.resolve(__dirname, '../public/pajo-logo.svg');
const publicDir = path.resolve(__dirname, '../public');
const androidRes = path.resolve(__dirname, '../android/app/src/main/res');

async function generate() {
  if (!fs.existsSync(svgPath)) {
    console.error('SVG source not found:', svgPath);
    process.exit(1);
  }

  // Ensure public dir exists
  fs.mkdirSync(publicDir, { recursive: true });

  for (const [name, size] of Object.entries(sizes)) {
    const outName = name.startsWith('icon-') ? `${name}.png` : `ic_launcher_${name}.png`;
    const outPublic = path.join(publicDir, outName);

    if (sharp) {
      await sharp(svgPath)
        .resize(size, size, { fit: 'cover' })
        .png()
        .toFile(outPublic);
      console.log('Wrote', outPublic, '(sharp)');
    } else if (jimp) {
      // use jimp to rasterize the svg by loading via buffer
      const svgBuffer = fs.readFileSync(svgPath);
      const image = await jimp.read(svgBuffer);
      image.cover(size, size).write(outPublic);
      console.log('Wrote', outPublic, '(jimp)');
    } else {
      console.error('Neither sharp nor jimp is available. Install one of them to generate icons.');
      process.exit(1);
    }

    // If android res folder exists, copy to appropriate mipmap folder
    if (fs.existsSync(androidRes)) {
      const mipmapName = name.startsWith('icon-') ? null : `mipmap-${name}`;
      if (mipmapName) {
        const destDir = path.join(androidRes, mipmapName);
        fs.mkdirSync(destDir, { recursive: true });
        const destPath = path.join(destDir, 'ic_launcher.png');
        fs.copyFileSync(outPublic, destPath);
        console.log('Copied to', destPath);
      }
    }
  }

  console.log('Icon generation completed.');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
