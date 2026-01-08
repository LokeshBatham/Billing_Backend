const Product = require('../models/Product');
const bwipjs = require('bwip-js');

exports.generateUniqueBarcode = async () => {
  let barcode;
  let exists = true;

  while (exists) {
    barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString(); // 12 digits
    exists = await Product.exists({ barcode });
  }

  return barcode;
};

exports.generateBarcodeImage = (barcode) => {
  return new Promise((resolve) => {
    try {
      bwipjs.toBuffer(
        {
          bcid: 'code128',
          text: String(barcode),
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
        },
        (err, png) => {
          if (err || !png) {
            console.error('Barcode generation error:', err);
            // Fallback to simple SVG
            resolve(createFallbackSvg(barcode));
          } else {
            resolve(`data:image/png;base64,${png.toString('base64')}`);
          }
        }
      );
    } catch (error) {
      console.error('Barcode generation error:', error);
      resolve(createFallbackSvg(barcode));
    }
  });
};

function createFallbackSvg(barcode) {
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80">
      <rect width="200" height="80" fill="white"/>
      <text x="100" y="45" text-anchor="middle" font-family="monospace" font-size="14">${barcode}</text>
    </svg>`
  ).toString('base64')}`;
}
