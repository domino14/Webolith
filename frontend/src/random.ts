let m_w = 123456789;
let m_z = 987654321;
const mask = 0xffffffff;

// Takes any integer
export function seed(i: number) {
  m_w = (123456789 + i) & mask;
  m_z = (987654321 - i) & mask;
}

// Returns number between 0 (inclusive) and 1.0 (exclusive),
// just like Math.random().
export function random() {
  m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
  m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
  let result = ((m_z << 16) + (m_w & 65535)) >>> 0;
  result /= 4294967296;
  return result;
}

// Utility function to shuffle an array using the custom random generator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function shuffleArray(array: any[], randomFn: () => number) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(randomFn() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Function to get today's date as the seed (in the format YYYYMMDD)
export function getTodaySeed() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // Months are 0-based in JavaScript
  const day = today.getDate();
  return year * 10000 + month * 100 + day; // Creates a YYYYMMDD format number
}
