const fs = require('fs');
const { Jimp } = require('jimp');

async function removeWhiteBg(imgPath) {
  try {
    const image = await Jimp.read(imgPath);
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // Strict white removal to avoid destroying shadows too much
      // If pixel is near white (> 245), make it transparent
      if (red > 240 && green > 240 && blue > 240) {
        this.bitmap.data[idx + 3] = 0; // alpha
      } else if (red > 230 && green > 230 && blue > 230) {
        this.bitmap.data[idx + 3] = 100; // semi-transparent for edges
      }
    });
    
    await image.write(imgPath);
    console.log(`Processed ${imgPath}`);
  } catch (err) {
    console.error(`Error processing ${imgPath}:`, err);
  }
}

async function run() {
  const dir = 'public/images/';
  const files = fs.readdirSync(dir).filter(f => f.endsWith('_voxel.png'));
  for (const file of files) {
    await removeWhiteBg(dir + file);
  }
}

run();
