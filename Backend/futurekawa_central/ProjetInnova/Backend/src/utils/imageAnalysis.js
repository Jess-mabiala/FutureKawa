const sharp = require('sharp');

// Calcule un hash perceptuel simplifié (8x8 = 64 bits)
async function computeHash(filePath) {
  const { data } = await sharp(filePath)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
  return Array.from(data).map((v) => (v >= avg ? 1 : 0)).join('');
}

// Distance de Hamming entre deux hashs (nombre de bits différents)
function hammingDistance(hash1, hash2) {
  if (hash1.length !== hash2.length) return Infinity;
  return [...hash1].filter((bit, i) => bit !== hash2[i]).length;
}

// Détecte si une image est floue via la variance du Laplacien
async function computeBlurScore(filePath) {
  const { data, info } = await sharp(filePath)
    .grayscale()
    .resize(200) // redimensionner pour accélérer
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const pixels = Array.from(data);
  let sum = 0;
  let count = 0;

  // Laplacien : différence entre chaque pixel et ses voisins
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const laplacian =
        -pixels[idx - width] -
        pixels[idx - 1] +
        4 * pixels[idx] -
        pixels[idx + 1] -
        pixels[idx + width];
      sum += laplacian * laplacian;
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
}

const BLUR_THRESHOLD = 20;    // en dessous = flou
const DUPLICATE_THRESHOLD = 8; // bits différents max pour considérer doublon

module.exports = { computeHash, hammingDistance, computeBlurScore, BLUR_THRESHOLD, DUPLICATE_THRESHOLD };