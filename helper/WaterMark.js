const createTextWatermark = (text, width = 1000, height = 200) => {
  const fontSize = Math.max(20, Math.floor(width * 0.08));

  return Buffer.from(`
    <svg width="${width}" height="${height}">
      <style>
        .title { fill: rgba(219, 207, 207, 0.5); font-size: ${fontSize}px; font-weight: bold; font-family: sans-serif;opacity: 0.5; }
      </style>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="title">${text}</text>
    </svg>
  `);
};

export default createTextWatermark
