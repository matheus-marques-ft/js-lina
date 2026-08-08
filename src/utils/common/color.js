export function randomColorBySeed(s) {
  // Convert the label name into a hash value, used as the random seed
  const hash = hashCode(s)

  // Generate a random color
  const color = '#' + ('000000' + (hash & 0xffffff).toString(16)).slice(-6)
  // Convert to a hex color
  return color
}

// Helper function: convert a string into a hash value
function hashCode(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (char + (hash << 6) + (hash << 16) - hash) & 0xffffffff
  }
  return hash
}

export function getRandomColor() {
  // Generate random red, green, and blue color values
  const r = Math.floor(Math.random() * 256)
  const g = Math.floor(Math.random() * 256)
  const b = Math.floor(Math.random() * 256)

  // Convert the color values to hex strings
  const hexR = r.toString(16).padStart(2, '0')
  const hexG = g.toString(16).padStart(2, '0')
  const hexB = b.toString(16).padStart(2, '0')

  // Return the combined hex color code
  return `#${hexR}${hexG}${hexB}`
}

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

// Function to determine whether a color is dark
export function isDarkness(color) {
  if (!color) {
    return false
  }
  const { r, g, b } = hexToRgb(color)
  // Calculate brightness
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b
  return brightness < 128 // 128 is an empirical threshold, can be adjusted
}
