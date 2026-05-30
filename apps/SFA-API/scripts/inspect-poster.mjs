import sharp from 'sharp';

async function inspect(url, label) {
  const r = await fetch(url);
  const b = Buffer.from(await r.arrayBuffer());
  const m = await sharp(b).metadata();
  console.log(`${label}: w=${m.width} h=${m.height} bytes=${b.length} channels=${m.channels}`);
}

await inspect('https://res.cloudinary.com/dbh7q40ye/image/upload/v1780121570/studio-flyer-ai/generated-posters/file_ra8jfs.png', 'NEW V1 (composed?)');
await inspect('https://res.cloudinary.com/dbh7q40ye/image/upload/v1780100277/studio-flyer-ai/generated-posters/file_qiapib.png', 'OLD V1 (raw Gemini)');
