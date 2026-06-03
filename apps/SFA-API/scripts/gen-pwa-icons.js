const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '../../client/public/icons');

async function main() {
  console.log('OUT =', OUT);
  if (!fs.existsSync(OUT)) {
    throw new Error('icons dir missing: ' + OUT);
  }
  const svgAny  = fs.readFileSync(path.join(OUT, 'icon.svg'));
  const svgMask = fs.readFileSync(path.join(OUT, 'icon-maskable.svg'));

  const jobs = [
    { name: 'icon-192.png',           svg: svgAny,  size: 192 },
    { name: 'icon-512.png',           svg: svgAny,  size: 512 },
    { name: 'icon-192-maskable.png',  svg: svgMask, size: 192 },
    { name: 'icon-512-maskable.png',  svg: svgMask, size: 512 },
    { name: 'apple-touch-icon.png',   svg: svgAny,  size: 180 },
    { name: 'favicon-32.png',         svg: svgAny,  size: 32  },
    { name: 'favicon-16.png',         svg: svgAny,  size: 16  },
  ];
  for (const j of jobs) {
    const outPath = path.join(OUT, j.name);
    await sharp(j.svg).resize(j.size, j.size).png().toFile(outPath);
    console.log('  wrote', j.name);
  }
  console.log('done.');
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
