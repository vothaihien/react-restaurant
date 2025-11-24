const createPlaceholder = (
  width: number,
  height: number,
  label = "No Image"
) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="${
        Math.min(width, height) / 5
      }" fill="#9ca3af">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export const FALLBACK_CARD_IMAGE = createPlaceholder(300, 200);
export const FALLBACK_THUMB_IMAGE = createPlaceholder(48, 48);
export const FALLBACK_TILE_IMAGE = createPlaceholder(150, 150);

