const { Jimp } = require('jimp');

async function removeWhiteBg(imgPath) {
  try {
    const image = await Jimp.read(imgPath);
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      
      // If pixel is near white (e.g. > 240,240,240), make it transparent
      if (red > 230 && green > 230 && blue > 230) {
        this.bitmap.data[idx + 3] = 0; // alpha
      }
    });
    
    await image.write(imgPath);
    console.log(`Processed ${imgPath}`);
  } catch (err) {
    console.error(`Error processing ${imgPath}:`, err);
  }
}

async function run() {
  await removeWhiteBg('public/images/gengar_sleeping.png');
  await removeWhiteBg('public/images/gengar_awake.png');
}

run();
