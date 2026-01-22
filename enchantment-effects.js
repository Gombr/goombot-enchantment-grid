// Enchantment effect functions for card rendering

function applyEnchantedNameTag(imageData, width, height) {
  const nameTagStart = height - 80;
  
  for (let y = nameTagStart; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let h = 0, s = 0;
      const v = max / 255;
      
      if (delta !== 0) {
        s = delta / max;
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
      }
      
      h = h * 60;
      if (h < 0) h += 360;
      h = (h - 150 + 360) % 360;
      s = Math.min(1, s * 1.2);
      
      const c = v * s;
      const x_chroma = c * (1 - Math.abs(((h / 60) % 2) - 1));
      const m = v - c;
      
      let newR, newG, newB;
      if (h < 60) { newR = c; newG = x_chroma; newB = 0; }
      else if (h < 120) { newR = x_chroma; newG = c; newB = 0; }
      else if (h < 180) { newR = 0; newG = c; newB = x_chroma; }
      else if (h < 240) { newR = 0; newG = x_chroma; newB = c; }
      else if (h < 300) { newR = x_chroma; newG = 0; newB = c; }
      else { newR = c; newG = 0; newB = x_chroma; }
      
      imageData.data[idx] = Math.min(255, Math.max(0, (newR + m) * 255));
      imageData.data[idx + 1] = Math.min(255, Math.max(0, (newG + m) * 255));
      imageData.data[idx + 2] = Math.min(255, Math.max(0, (newB + m) * 255));
    }
  }
}

function applyFisheye(imageData, width, height, isExclusive = false) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY);
  const tempData = new Uint8ClampedArray(imageData.data);
  const protectedHeight = isExclusive ? height : height - 80;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius) {
        const distortion = Math.pow(distance / radius, 0.5);
        const newDistance = distortion * radius;
        const angle = Math.atan2(dy, dx);
        
        const sourceX = Math.round(centerX + Math.cos(angle) * newDistance);
        const sourceY = Math.round(centerY + Math.sin(angle) * newDistance);
        
        if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
          const idx = (y * width + x) * 4;
          const sourceIdx = (sourceY * width + sourceX) * 4;
          imageData.data[idx] = tempData[sourceIdx];
          imageData.data[idx + 1] = tempData[sourceIdx + 1];
          imageData.data[idx + 2] = tempData[sourceIdx + 2];
        }
      }
    }
  }
}

function applyMagentaOverlay(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      const r = imageData.data[idx] / 255;
      const g = imageData.data[idx + 1] / 255;
      const b = imageData.data[idx + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let h = 0;
      let s = 0;
      let l = (max + min) / 2;
      
      if (delta !== 0) {
        s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
        
        if (max === r) {
          h = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
        } else if (max === g) {
          h = ((b - r) / delta + 2) / 6;
        } else {
          h = ((r - g) / delta + 4) / 6;
        }
      }
      
      h = (h - 165/360 + 1) % 1;
      s = Math.min(1, Math.max(0, s + 0.10));
      
      let newR, newG, newB;
      
      if (s === 0) {
        newR = newG = newB = l;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        newR = hue2rgb(p, q, h + 1/3);
        newG = hue2rgb(p, q, h);
        newB = hue2rgb(p, q, h - 1/3);
      }
      
      imageData.data[idx] = Math.round(newR * 255);
      imageData.data[idx + 1] = Math.round(newG * 255);
      imageData.data[idx + 2] = Math.round(newB * 255);
    }
  }
}

function applyGoldenTint(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = Math.round(0.299 * imageData.data[idx] + 0.587 * imageData.data[idx + 1] + 0.114 * imageData.data[idx + 2]);
      const inverted = 255 - gray;
      imageData.data[idx] = inverted;
      imageData.data[idx + 1] = inverted;
      imageData.data[idx + 2] = inverted;
    }
  }
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const lum = imageData.data[idx];
      const t = lum / 255;
      
      let curved = Math.pow(t, 0.7);
      curved += 0.35 * Math.sin(t * Math.PI * 6);
      curved += 0.15 * Math.sin(t * Math.PI * 12);
      curved = Math.min(1, Math.max(0, curved));
      
      const amberShift = (Math.sin((x + y) * 0.03) + 1) * 0.12;
      const secondaryShift = (Math.cos((x * 0.02) + (y * 0.04)) + 1) * 0.08;
      
      let r = Math.round(30 + (255 - 30) * curved);
      let g = Math.round(20 + (210 - 20) * curved);
      let b = Math.round(5 + (100 - 5) * curved);
      
      r = Math.min(255, r + 25 * amberShift + 15 * secondaryShift);
      g = Math.min(255, g + 20 * amberShift + 10 * secondaryShift);
      b = Math.max(0, b - 15 * amberShift - 5 * secondaryShift);
      
      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
    }
  }
}

function applyInfernalHueShift(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let h = 0;
      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
      }
      h = h * 60;
      if (h < 0) h += 360;
      
      const hsvS = max === 0 ? 0 : delta / max;
      const hsvV = max / 255;
      
      let targetHue;
      if (h >= 0 && h <= 60) targetHue = h;
      else if (h > 60 && h <= 180) targetHue = 30;
      else targetHue = 10;
      
      const blendFactor = 0.7;
      const newH = h * (1 - blendFactor) + targetHue * blendFactor;
      const newS = Math.min(1, hsvS * 1.3);
      const newV = Math.min(1, hsvV * 1.1);
      
      const c = newV * newS;
      const x_chroma = c * (1 - Math.abs(((newH / 60) % 2) - 1));
      const m = newV - c;
      
      let newR, newG, newB;
      if (newH < 60) { newR = c; newG = x_chroma; newB = 0; }
      else if (newH < 120) { newR = x_chroma; newG = c; newB = 0; }
      else if (newH < 180) { newR = 0; newG = c; newB = x_chroma; }
      else if (newH < 240) { newR = 0; newG = x_chroma; newB = c; }
      else if (newH < 300) { newR = x_chroma; newG = 0; newB = c; }
      else { newR = c; newG = 0; newB = x_chroma; }
      
      imageData.data[idx] = Math.min(255, (newR + m) * 255);
      imageData.data[idx + 1] = Math.min(255, (newG + m) * 255);
      imageData.data[idx + 2] = Math.min(255, (newB + m) * 255);
    }
  }
}

function applyFlameDistort(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  const tempData = new Uint8ClampedArray(imageData.data);
  const time = Date.now() * 0.001;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const flameX = Math.sin(y * 0.02 + time) * 12 + Math.sin(y * 0.05) * 8;
      const flameY = Math.sin(x * 0.015 + time * 0.7) * 6 + Math.cos(x * 0.03) * 4;
      
      const heatIntensity = (protectedHeight - y) / protectedHeight;
      const heatWaveX = Math.sin(y * 0.08 + x * 0.02) * 15 * heatIntensity;
      const heatWaveY = Math.sin(x * 0.06 + y * 0.03) * 8 * heatIntensity;
      
      const sourceX = Math.max(0, Math.min(width - 1, Math.round(x + flameX + heatWaveX)));
      const sourceY = Math.max(0, Math.min(protectedHeight - 1, Math.round(y + flameY + heatWaveY)));
      
      const idx = (y * width + x) * 4;
      const sourceIdx = (sourceY * width + sourceX) * 4;
      
      imageData.data[idx] = tempData[sourceIdx];
      imageData.data[idx + 1] = tempData[sourceIdx + 1];
      imageData.data[idx + 2] = tempData[sourceIdx + 2];
    }
  }
}

function applyYellowSparks(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const sparkNoise = Math.sin(x * 0.3) * Math.cos(y * 0.4) + Math.sin(x * 0.7 + y * 0.2) * Math.cos(x * 0.1 + y * 0.8);
      const sparkChance = Math.abs(sparkNoise) > 1.8 && Math.random() < 0.02;
      
      if (sparkChance) {
        const idx = (y * width + x) * 4;
        const intensity = Math.random() * 0.8 + 0.2;
        imageData.data[idx] = Math.min(255, imageData.data[idx] + 200 * intensity);
        imageData.data[idx + 1] = Math.min(255, imageData.data[idx + 1] + 180 * intensity);
        imageData.data[idx + 2] = Math.max(0, imageData.data[idx + 2] - 50 * intensity);
      }
    }
  }
}

function applyRainbowShift(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;

  // Hue dominance sampling
  const hueBins = new Array(36).fill(0);
  const totalPixels = width * protectedHeight;

  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;

      let h = 0;
      if (d !== 0) {
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
      }
      hueBins[Math.floor(h / 10)]++;
    }
  }

  const dominantCount = Math.max(...hueBins);
  const dominantBin = hueBins.indexOf(dominantCount) * 10;
  const dominance = dominantCount / totalPixels;
  const doDominanceFix = dominance > 0.35;

  const angDist = (a, b) => {
    const d = Math.abs(a - b);
    return Math.min(d, 360 - d);
  };

  // Main pass
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const origR = imageData.data[idx];
      const origG = imageData.data[idx + 1];
      const origB = imageData.data[idx + 2];
      const lum = (origR + origG + origB) / 3;

      // RGB→Hue for purple-safe logic
      const max = Math.max(origR, origG, origB);
      const min = Math.min(origR, origG, origB);
      const d = max - min;
      let h = 0;
      if (d !== 0) {
        if (max === origR) h = ((origG - origB) / d) % 6;
        else if (max === origG) h = (origB - origR) / d + 2;
        else h = (origR - origG) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
      }

      // Wobble bias normalized + purple-safe amplitude
      let wobbleA = (Math.sin(x * 0.02) + Math.cos(y * 0.015)) * 12;

      // Purple safe band (Vivian): 260°–330°
      if (h > 260 && h < 330) wobbleA *= 0.7;

      // Rebalance wobble weighting
      let r = origR + wobbleA;
      let g = origG + wobbleA * 0.8;
      let b = origB + wobbleA * 0.9;

      // Palette classification bins
      const isYellow = (r > 180 && g > 160 && b < 120);
      const isGreen = (g > r && g > b);
      const isBlue = (b > r && b > g);
      const isRed = (r > g && r > b);

      // Magenta bin
      const isMagenta = (origR > 170 && origB > 170 && origG < 150) || (h > 260 && h < 330);

      // Brown → yellow
      const isBrown = origR > origG && origG > origB && origB < 140 && (origR - origB) > 40 && lum > 70 && lum < 190;

      // White/gray → pastel candy
      const isBrightWhite = lum > 220 && Math.abs(origR - origG) < 30 && Math.abs(origR - origB) < 30;
      const isMidGray = lum > 140 && lum < 200 && Math.abs(origR - origG) < 25 && Math.abs(origR - origB) < 25;
      const isWarmGray = isMidGray && origR > origB;
      const isCoolGray = isMidGray && origB > origR;

      // Palette mapping
      if (isBrightWhite) {
        r = 255; g = 172; b = 220;
      } else if (isBrown) {
        r = 255; g = 220; b = 150;
      } else if (isWarmGray) {
        r = 255; g = 200; b = 160;
      } else if (isCoolGray) {
        r = 120; g = 200; b = 255;
      } else if (isMagenta) {
        r = 255; g = 110; b = 255;
      } else {
        if (isYellow) { r = 255; g = 240; b = 150; }
        else if (isGreen) { r = 0; g = 220; b = 190; }
        else if (isBlue) { r = 90; g = 180; b = 255; }
        else if (isRed) { r = 255; g = 40; b = 180; }
      }

      // Wave rebalance
      const wave = Math.sin(x * 0.018) + Math.cos(y * 0.022);
      r += wave * 18;
      g += wave * 17;
      b += wave * 20;

      // Dominance collapse fix
      if (doDominanceFix) {
        const max2 = Math.max(r, g, b);
        const min2 = Math.min(r, g, b);
        const d2 = max2 - min2;
        let h2 = 0;
        if (d2 !== 0) {
          if (max2 === r) h2 = ((g - b) / d2) % 6;
          else if (max2 === g) h2 = (b - r) / d2 + 2;
          else h2 = (r - g) / d2 + 4;
          h2 *= 60;
          if (h2 < 0) h2 += 360;
        }
        const dist = angDist(h2, dominantBin);
        if (dist < 20) h2 += (dist / 20) * 15;
        r = r * 0.9 + origR * 0.1;
        g = g * 0.9 + origG * 0.1;
        b = b * 0.9 + origB * 0.1;
      }

      // Blend back for definition
      const blend = 0.35;
      r = r * (1 - blend) + origR * blend;
      g = g * (1 - blend) + origG * blend;
      b = b * (1 - blend) + origB * blend;

      // Microcontrast
      const lum2 = (r + g + b) / 3;
      r = r * 0.9 + (r - lum2) * 0.4;
      g = g * 0.9 + (g - lum2) * 0.4;
      b = b * 0.9 + (b - lum2) * 0.4;

      imageData.data[idx] = Math.min(255, Math.max(0, r));
      imageData.data[idx + 1] = Math.min(255, Math.max(0, g));
      imageData.data[idx + 2] = Math.min(255, Math.max(0, b));
    }
  }
}

function applySparkleOverlay(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;

  // Generate bubble centers
  const bubbleCount = Math.floor((width * height) / 9000);
  const bubbles = [];

  for (let i = 0; i < bubbleCount; i++) {
    bubbles.push({
      x: Math.random() * width,
      y: Math.random() * protectedHeight,
      r: 12 + Math.random() * 28,
      tint: Math.floor(Math.random() * 5)
    });
  }

  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = imageData.data[idx];
      let g = imageData.data[idx + 1];
      let b = imageData.data[idx + 2];

      for (const bubble of bubbles) {
        const dx = x - bubble.x;
        const dy = y - bubble.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < bubble.r) {
          const fade = 1 - (dist / bubble.r);
          const strength = fade * fade * 0.55;

          let br = 255, bg = 255, bb = 255;
          switch (bubble.tint) {
            case 0: br = 255; bg = 40; bb = 180; break;
            case 1: br = 0; bg = 220; bb = 190; break;
            case 2: br = 255; bg = 240; bb = 90; break;
            case 3: br = 90; bg = 180; bb = 255; break;
            case 4: br = 180; bg = 80; bb = 255; break;
          }

          r = Math.min(255, r + br * strength);
          g = Math.min(255, g + bg * strength);
          b = Math.min(255, b + bb * strength);
        }
      }

      imageData.data[idx] = r;
      imageData.data[idx + 1] = g;
      imageData.data[idx + 2] = b;
    }
  }
}

function applyDeepFry(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      imageData.data[idx] = Math.min(255, imageData.data[idx] * 1.05 + 8);
      imageData.data[idx + 1] = Math.min(255, imageData.data[idx + 1] * 1.03 + 5);
      imageData.data[idx + 2] = Math.max(0, imageData.data[idx + 2] * 0.98 - 5);
      
      if (Math.random() < 0.02) {
        const noise = (Math.random() - 0.5) * 20;
        imageData.data[idx] = Math.max(0, Math.min(255, imageData.data[idx] + noise));
        imageData.data[idx + 1] = Math.max(0, Math.min(255, imageData.data[idx + 1] + noise));
        imageData.data[idx + 2] = Math.max(0, Math.min(255, imageData.data[idx + 2] + noise));
      }
    }
  }
  
  const tempData = new Uint8ClampedArray(imageData.data);
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const waveX = Math.round(x + Math.sin(y / 25) * 1.5);
      const waveY = Math.round(y + Math.cos(x / 30) * 1.5);
      
      if (waveX >= 0 && waveX < width && waveY >= 0 && waveY < protectedHeight) {
        const idx = (y * width + x) * 4;
        const srcIdx = (waveY * width + waveX) * 4;
        imageData.data[idx] = tempData[srcIdx];
        imageData.data[idx + 1] = tempData[srcIdx + 1];
        imageData.data[idx + 2] = tempData[srcIdx + 2];
      }
    }
  }
}

function applyContrastBoost(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  const tempData = new Uint8ClampedArray(imageData.data);
  const centerX = width / 2;
  const centerY = height / 2 - 40;
  const maxRadius = Math.min(width, protectedHeight) / 2;
  const bulgeStrength = 1.5;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < maxRadius) {
        const r = distance / maxRadius;
        const rn = Math.pow(r, bulgeStrength);
        const srcX = Math.round(centerX + dx * rn);
        const srcY = Math.round(centerY + dy * rn);
        
        if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < protectedHeight) {
          const idx = (y * width + x) * 4;
          const srcIdx = (srcY * width + srcX) * 4;
          imageData.data[idx] = tempData[srcIdx];
          imageData.data[idx + 1] = tempData[srcIdx + 1];
          imageData.data[idx + 2] = tempData[srcIdx + 2];
        }
      }
    }
  }
}

function applySharpenEdges(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  const tempData = new Uint8ClampedArray(imageData.data);
  
  const kernel = [
    [0, -0.25, 0],
    [-0.25, 2, -0.25],
    [0, -0.25, 0]
  ];
  
  for (let y = 1; y < protectedHeight - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let r = 0, g = 0, b = 0;
      
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixelIdx = ((y + ky) * width + (x + kx)) * 4;
          const kernelValue = kernel[ky + 1][kx + 1];
          
          r += tempData[pixelIdx] * kernelValue;
          g += tempData[pixelIdx + 1] * kernelValue;
          b += tempData[pixelIdx + 2] * kernelValue;
        }
      }
      
      const idx = (y * width + x) * 4;
      imageData.data[idx] = Math.min(255, Math.max(0, r));
      imageData.data[idx + 1] = Math.min(255, Math.max(0, g));
      imageData.data[idx + 2] = Math.min(255, Math.max(0, b));
    }
  }
}

function applyHologramShift(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  const tempData = new Uint8ClampedArray(imageData.data);
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const waveR = Math.sin((x + y) * 0.02) * 0.5 + 0.5;
      const waveG = Math.sin((x + y) * 0.02 + 2.094) * 0.5 + 0.5;
      const waveB = Math.sin((x + y) * 0.02 + 4.188) * 0.5 + 0.5;
      
      const redX = Math.max(0, Math.min(width - 1, x - 3));
      const blueX = Math.max(0, Math.min(width - 1, x + 3));
      
      const redIdx = (y * width + redX) * 4;
      const blueIdx = (y * width + blueX) * 4;
      
      imageData.data[idx] = Math.min(255, tempData[redIdx] * (0.7 + waveR * 0.6));
      imageData.data[idx + 1] = Math.min(255, tempData[idx + 1] * (0.7 + waveG * 0.6));
      imageData.data[idx + 2] = Math.min(255, tempData[blueIdx + 2] * (0.7 + waveB * 0.6));
    }
  }
}

function applyPrismEffect(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const rainbow = (x + y * 2) * 0.01;
      const rainbowR = Math.sin(rainbow) * 30;
      const rainbowG = Math.sin(rainbow + 2.094) * 30;
      const rainbowB = Math.sin(rainbow + 4.188) * 30;
      
      imageData.data[idx] = Math.min(255, Math.max(0, imageData.data[idx] + rainbowR));
      imageData.data[idx + 1] = Math.min(255, Math.max(0, imageData.data[idx + 1] + rainbowG));
      imageData.data[idx + 2] = Math.min(255, Math.max(0, imageData.data[idx + 2] + rainbowB));
    }
  }
}

function applyInvertColors(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  
  // Invert pass
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      let h = 0;
      if (delta !== 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
      }
      h = h * 60;
      if (h < 0) h += 360;
      
      const hsvS = max === 0 ? 0 : delta / max;
      const hsvV = max / 255;
      const newV = 1 - hsvV;
      
      let newH = h;
      const orangeHue = 30;
      const ceruleanHue = 195;
      const distFromOrange = Math.min(Math.abs(h - orangeHue), 360 - Math.abs(h - orangeHue));
      const distFromCerulean = Math.min(Math.abs(h - ceruleanHue), 360 - Math.abs(h - ceruleanHue));
      const minDist = Math.min(distFromOrange, distFromCerulean);
      
      if (minDist > 45) {
        newH = (h + 180) % 360;
      }
      
      const c = newV * hsvS;
      const chroma_x = c * (1 - Math.abs(((newH / 60) % 2) - 1));
      const m = newV - c;
      
      let newR, newG, newB;
      if (newH < 60) { newR = c; newG = chroma_x; newB = 0; }
      else if (newH < 120) { newR = chroma_x; newG = c; newB = 0; }
      else if (newH < 180) { newR = 0; newG = c; newB = chroma_x; }
      else if (newH < 240) { newR = 0; newG = chroma_x; newB = c; }
      else if (newH < 300) { newR = chroma_x; newG = 0; newB = c; }
      else { newR = c; newG = 0; newB = chroma_x; }
      
      imageData.data[idx] = Math.min(255, Math.max(0, (newR + m) * 255));
      imageData.data[idx + 1] = Math.min(255, Math.max(0, (newG + m) * 255));
      imageData.data[idx + 2] = Math.min(255, Math.max(0, (newB + m) * 255));
    }
  }
  
  // Darkness analysis
  const darkThreshold = 75;
  const darknessTrigger = 0.72;
  let darkCount = 0;
  const total = width * protectedHeight;
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const lum = Math.max(imageData.data[idx], imageData.data[idx + 1], imageData.data[idx + 2]);
      if (lum <= darkThreshold) darkCount++;
    }
  }
  
  const pctDark = darkCount / total;
  
  // Early exit if not dark enough
  if (pctDark < darknessTrigger) return;
  
  // Monochrome analysis
  let monoCount = 0;
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx] / 255;
      const g = imageData.data[idx + 1] / 255;
      const b = imageData.data[idx + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      const s = max === 0 ? 0 : delta / max;
      
      if (s < 0.35) monoCount++;
    }
  }
  
  const pctMono = monoCount / total;
  
  // Mono early exit
  if (pctMono >= 0.75) return;
  
  // Adaptive exposure calc
  const minStops = 0.8;
  const maxStops = 3.5;
  const power = 1.5;
  const gamma = 1.0;
  
  const excess = Math.min(1, (pctDark - darknessTrigger) / (1 - darknessTrigger));
  const exposureStops = minStops + Math.pow(excess, power) * (maxStops - minStops);
  const exposureFactor = Math.pow(2, exposureStops);
  
  // Exposure pass
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = imageData.data[idx];
      let g = imageData.data[idx + 1];
      let b = imageData.data[idx + 2];
      
      const maxv = Math.max(r, g, b);
      if (maxv < 8) continue;
      
      r *= exposureFactor;
      g *= exposureFactor;
      b *= exposureFactor;
      
      if (gamma !== 1.0) {
        r = 255 * Math.pow(Math.min(r / 255, 1), gamma);
        g = 255 * Math.pow(Math.min(g / 255, 1), gamma);
        b = 255 * Math.pow(Math.min(b / 255, 1), gamma);
      }
      
      imageData.data[idx] = Math.min(255, r);
      imageData.data[idx + 1] = Math.min(255, g);
      imageData.data[idx + 2] = Math.min(255, b);
    }
  }
}

function applyPastelShift(imageData, width, height, isExclusive = false) {
  const protectedHeight = isExclusive ? height : height - 80;
  const edges = new Array(width * protectedHeight);
  
  for (let y = 1; y < protectedHeight - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const currentGray = 0.299 * imageData.data[idx] + 0.587 * imageData.data[idx + 1] + 0.114 * imageData.data[idx + 2];
      
      const rightIdx = (y * width + (x + 1)) * 4;
      const rightGray = 0.299 * imageData.data[rightIdx] + 0.587 * imageData.data[rightIdx + 1] + 0.114 * imageData.data[rightIdx + 2];
      
      const bottomIdx = ((y + 1) * width + x) * 4;
      const bottomGray = 0.299 * imageData.data[bottomIdx] + 0.587 * imageData.data[bottomIdx + 1] + 0.114 * imageData.data[bottomIdx + 2];
      
      const edgeX = Math.abs(currentGray - rightGray);
      const edgeY = Math.abs(currentGray - bottomGray);
      edges[y * width + x] = Math.sqrt(edgeX * edgeX + edgeY * edgeY);
    }
  }
  
  for (let y = 0; y < protectedHeight; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      
      const edgeIntensity = edges[y * width + x] || 0;
      let sketchBase = gray + (255 - gray) * 0.75;
      
      const edgeThreshold = 15;
      if (edgeIntensity > edgeThreshold) {
        const edgeMultiplier = Math.min(1, edgeIntensity / 50);
        sketchBase = sketchBase * (1 - edgeMultiplier * 0.7);
      }
      
      const pastelStrength = 0.12;
      const finalR = sketchBase + (r - gray) * pastelStrength;
      const finalG = sketchBase + (g - gray) * pastelStrength;
      const finalB = sketchBase + (b - gray) * pastelStrength;
      
      imageData.data[idx] = Math.max(0, Math.min(255, Math.round(finalR)));
      imageData.data[idx + 1] = Math.max(0, Math.min(255, Math.round(finalG)));
      imageData.data[idx + 2] = Math.max(0, Math.min(255, Math.round(finalB)));
    }
  }
}

function applyEnchantmentEffects(imageData, enchantment, isExclusive = false) {
  const width = imageData.width;
  const height = imageData.height;
  
  switch (enchantment) {
    case 'Abyssal Vision':
      applyFisheye(imageData, width, height, isExclusive);
      applyMagentaOverlay(imageData, width, height, isExclusive);
      break;
    case 'Golden Bloom':
      applyGoldenTint(imageData, width, height, isExclusive);
      break;
    case 'Infernal Chaos':
      applyInfernalHueShift(imageData, width, height, isExclusive);
      applyFlameDistort(imageData, width, height, isExclusive);
      applyYellowSparks(imageData, width, height, isExclusive);
      break;
    case 'Magical Whimsy':
      applyRainbowShift(imageData, width, height, isExclusive);
      applySparkleOverlay(imageData, width, height, isExclusive);
      break;
    case 'Deepfried':
      applyDeepFry(imageData, width, height, isExclusive);
      applyContrastBoost(imageData, width, height, isExclusive);
      applySharpenEdges(imageData, width, height, isExclusive);
      break;
    case 'Holographic':
      applyHologramShift(imageData, width, height, isExclusive);
      applyPrismEffect(imageData, width, height, isExclusive);
      break;
    case 'Negative':
      applyInvertColors(imageData, width, height, isExclusive);
      break;
    case 'Ethereal Mist':
      applyPastelShift(imageData, width, height, isExclusive);
      break;
  }
}