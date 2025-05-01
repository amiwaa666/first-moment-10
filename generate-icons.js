const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const svgToDataURL = require('svg-to-dataurl');

// SVGファイルを読み込む
const svgPath = path.join(__dirname, 'public/img/icons/simple-icon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

// SVGをData URLに変換
const dataURL = svgToDataURL(svgContent);

// アイコンサイズの定義
const sizes = [
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
  { name: 'android-chrome-maskable-192x192.png', size: 192 },
  { name: 'android-chrome-maskable-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-60x60.png', size: 60 },
  { name: 'apple-touch-icon-76x76.png', size: 76 },
  { name: 'apple-touch-icon-120x120.png', size: 120 },
  { name: 'apple-touch-icon-152x152.png', size: 152 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'msapplication-icon-144x144.png', size: 144 },
  { name: 'mstile-150x150.png', size: 150 },
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 }
];

// Data URLから画像を読み込み、各サイズのPNGを生成
loadImage(dataURL).then(image => {
  sizes.forEach(({ name, size }) => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 背景を透明に
    ctx.clearRect(0, 0, size, size);
    
    // SVGを描画
    ctx.drawImage(image, 0, 0, size, size);
    
    // PNGとして保存
    const buffer = canvas.toBuffer('image/png');
    const outputPath = path.join(__dirname, 'public/img/icons', name);
    
    fs.writeFileSync(outputPath, buffer);
    console.log(`Generated: ${name} (${size}x${size})`);
  });
  
  // favicon.icoのコピー
  const faviconSource = path.join(__dirname, 'public/img/icons/favicon-32x32.png');
  const faviconDest = path.join(__dirname, 'public/favicon.ico');
  fs.copyFileSync(faviconSource, faviconDest);
  console.log('Copied: favicon.ico');
  
  console.log('All icons generated successfully!');
}).catch(err => {
  console.error('Error generating icons:', err);
}); 