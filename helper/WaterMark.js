const createTextWatermark = (text) => {
  const width = 1000;
  const height = 200;

  return Buffer.from(`
    <svg width="${width}" height="${height}">
      <style>
        .title { fill: rgba(219, 207, 207, 0.5); font-size: 80px; font-weight: bold; font-family: sans-serif;opacity: 0.5; }
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="title">${text}</text>
    </svg>
  `);
};

export default createTextWatermark

