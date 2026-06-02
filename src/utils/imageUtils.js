export function clampCropPos(pos, scale, imgW, imgH, cropW, cropH) {
  const dw = imgW * scale;
  const dh = imgH * scale;
  return {
    x: Math.min(0, Math.max(cropW - dw, pos.x)),
    y: Math.min(0, Math.max(cropH - dh, pos.y)),
  };
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
