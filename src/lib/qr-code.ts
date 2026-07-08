type QrOptions = {
  margin?: number;
};

type RsBlock = {
  totalCount: number;
  dataCount: number;
};

const ERROR_CORRECTION_LEVEL_L = 1;
const G15 = 0x0537;
const G18 = 0x1f25;
const G15_MASK = 0x5412;

const RS_BLOCKS_L = [
  [1, 26, 19],
  [1, 44, 34],
  [1, 70, 55],
  [1, 100, 80],
  [1, 134, 108],
  [2, 86, 68],
  [2, 98, 78],
  [2, 121, 97],
  [2, 146, 116],
  [2, 86, 68, 2, 87, 69],
  [4, 101, 81],
  [2, 116, 92, 2, 117, 93],
  [4, 133, 107],
  [3, 145, 115, 1, 146, 116],
  [5, 109, 87, 1, 110, 88],
  [5, 122, 98, 1, 123, 99],
  [1, 135, 107, 5, 136, 108],
  [5, 150, 120, 1, 151, 121],
  [3, 141, 113, 4, 142, 114],
  [3, 135, 107, 5, 136, 108],
  [4, 144, 116, 4, 145, 117],
  [2, 139, 111, 7, 140, 112],
  [4, 151, 121, 5, 152, 122],
  [6, 147, 117, 4, 148, 118],
  [8, 132, 106, 4, 133, 107],
  [10, 142, 114, 2, 143, 115],
  [8, 152, 122, 4, 153, 123],
  [3, 147, 117, 10, 148, 118],
  [7, 146, 116, 7, 147, 117],
  [5, 145, 115, 10, 146, 116],
  [13, 145, 115, 3, 146, 116],
  [17, 145, 115],
  [17, 145, 115, 1, 146, 116],
  [13, 145, 115, 6, 146, 116],
  [12, 151, 121, 7, 152, 122],
  [6, 151, 121, 14, 152, 122],
  [17, 152, 122, 4, 153, 123],
  [4, 152, 122, 18, 153, 123],
  [20, 147, 117, 4, 148, 118],
  [19, 148, 118, 6, 149, 119],
];

const PATTERN_POSITION_TABLE = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
  [6, 30, 54],
  [6, 32, 58],
  [6, 34, 62],
  [6, 26, 46, 66],
  [6, 26, 48, 70],
  [6, 26, 50, 74],
  [6, 30, 54, 78],
  [6, 30, 56, 82],
  [6, 30, 58, 86],
  [6, 34, 62, 90],
  [6, 28, 50, 72, 94],
  [6, 26, 50, 74, 98],
  [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106],
  [6, 32, 58, 84, 110],
  [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122],
  [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138],
  [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146],
  [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162],
  [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
];

const EXP_TABLE = new Array<number>(256);
const LOG_TABLE = new Array<number>(256);

for (let i = 0; i < 8; i += 1) {
  EXP_TABLE[i] = 1 << i;
}
for (let i = 8; i < 256; i += 1) {
  EXP_TABLE[i] =
    EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
}
for (let i = 0; i < 255; i += 1) {
  LOG_TABLE[EXP_TABLE[i]] = i;
}

class BitBuffer {
  bits: boolean[] = [];

  put(value: number, length: number) {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.bits.push(((value >>> i) & 1) === 1);
    }
  }

  putBit(bit: boolean) {
    this.bits.push(bit);
  }

  get length() {
    return this.bits.length;
  }

  toBytes() {
    const bytes: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j += 1) {
        if (this.bits[i + j]) {
          byte |= 0x80 >>> j;
        }
      }
      bytes.push(byte);
    }
    return bytes;
  }
}

export function createQrSvg(value: string, options: QrOptions = {}) {
  if (!value) {
    throw new Error('QR data is required');
  }

  const bytes = Array.from(new TextEncoder().encode(value));
  const version = chooseVersion(bytes.length);
  const data = createData(version, bytes);
  const matrix = createBestMatrix(version, data);
  const margin = options.margin ?? 4;
  const count = matrix.length;
  const viewBoxSize = count + margin * 2;
  const path = matrix
    .flatMap((row, y) =>
      row
        .map((dark, x) => (dark ? `M${x + margin},${y + margin}h1v1h-1z` : ''))
        .filter(Boolean)
    )
    .join('');

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBoxSize}" height="${viewBoxSize}" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" shape-rendering="crispEdges">`,
    '<rect width="100%" height="100%" fill="#fff"/>',
    `<path d="${path}" fill="#000"/>`,
    '</svg>',
  ].join('');
}

function chooseVersion(byteLength: number) {
  for (let version = 1; version <= 40; version += 1) {
    const dataCodewords = getRsBlocks(version).reduce(
      (total, block) => total + block.dataCount,
      0
    );
    const countBits = version < 10 ? 8 : 16;
    const requiredBits = 4 + countBits + byteLength * 8;
    if (requiredBits <= dataCodewords * 8) {
      return version;
    }
  }

  throw new Error('QR data is too long');
}

function getRsBlocks(version: number) {
  const entry = RS_BLOCKS_L[version - 1];
  const blocks: RsBlock[] = [];
  for (let i = 0; i < entry.length; i += 3) {
    const count = entry[i];
    const totalCount = entry[i + 1];
    const dataCount = entry[i + 2];
    for (let j = 0; j < count; j += 1) {
      blocks.push({ totalCount, dataCount });
    }
  }
  return blocks;
}

function createData(version: number, bytes: number[]) {
  const blocks = getRsBlocks(version);
  const totalDataCount = blocks.reduce(
    (total, block) => total + block.dataCount,
    0
  );
  const buffer = new BitBuffer();

  buffer.put(0x04, 4);
  buffer.put(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((byte) => buffer.put(byte, 8));

  const totalBits = totalDataCount * 8;
  if (buffer.length > totalBits) {
    throw new Error('QR data exceeds capacity');
  }

  const terminator = Math.min(4, totalBits - buffer.length);
  buffer.put(0, terminator);
  while (buffer.length % 8 !== 0) {
    buffer.putBit(false);
  }

  const dataBytes = buffer.toBytes();
  const pads = [0xec, 0x11];
  let padIndex = 0;
  while (dataBytes.length < totalDataCount) {
    dataBytes.push(pads[padIndex % 2]);
    padIndex += 1;
  }

  return createCodewords(dataBytes, blocks);
}

function createCodewords(dataBytes: number[], blocks: RsBlock[]) {
  const dcdata: number[][] = [];
  const ecdata: number[][] = [];
  let offset = 0;

  blocks.forEach((block) => {
    const data = dataBytes.slice(offset, offset + block.dataCount);
    const ecCount = block.totalCount - block.dataCount;
    dcdata.push(data);
    ecdata.push(computeRemainder(data, ecCount));
    offset += block.dataCount;
  });

  const result: number[] = [];
  const maxDataLength = Math.max(...dcdata.map((data) => data.length));
  for (let i = 0; i < maxDataLength; i += 1) {
    dcdata.forEach((data) => {
      if (i < data.length) {
        result.push(data[i]);
      }
    });
  }

  const maxEcLength = Math.max(...ecdata.map((data) => data.length));
  for (let i = 0; i < maxEcLength; i += 1) {
    ecdata.forEach((data) => {
      if (i < data.length) {
        result.push(data[i]);
      }
    });
  }

  return result;
}

function computeRemainder(data: number[], degree: number) {
  const generator = createGeneratorPolynomial(degree);
  const result = [...data, ...new Array<number>(degree).fill(0)];

  data.forEach((_, i) => {
    const coefficient = result[i];
    if (coefficient === 0) return;
    generator.forEach((generatorCoefficient, j) => {
      result[i + j] ^= gfMul(generatorCoefficient, coefficient);
    });
  });

  return result.slice(data.length);
}

function createGeneratorPolynomial(degree: number) {
  let result = [1];
  for (let i = 0; i < degree; i += 1) {
    result = multiplyPolynomials(result, [1, gfExp(i)]);
  }
  return result;
}

function multiplyPolynomials(left: number[], right: number[]) {
  const result = new Array<number>(left.length + right.length - 1).fill(0);
  left.forEach((leftValue, i) => {
    right.forEach((rightValue, j) => {
      result[i + j] ^= gfMul(leftValue, rightValue);
    });
  });
  return result;
}

function gfExp(n: number) {
  while (n < 0) n += 255;
  while (n >= 256) n -= 255;
  return EXP_TABLE[n];
}

function gfMul(left: number, right: number) {
  if (left === 0 || right === 0) return 0;
  return gfExp(LOG_TABLE[left] + LOG_TABLE[right]);
}

function createBestMatrix(version: number, data: number[]) {
  let bestMatrix: boolean[][] | null = null;
  let bestLostPoint = Infinity;

  for (let mask = 0; mask < 8; mask += 1) {
    const matrix = createMatrix(version, data, mask);
    const lostPoint = getLostPoint(matrix);
    if (lostPoint < bestLostPoint) {
      bestLostPoint = lostPoint;
      bestMatrix = matrix;
    }
  }

  if (!bestMatrix) {
    throw new Error('failed to generate QR matrix');
  }
  return bestMatrix;
}

function createMatrix(version: number, data: number[], mask: number) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () =>
    new Array<boolean | null>(size).fill(null)
  );

  setupPositionProbePattern(modules, 0, 0);
  setupPositionProbePattern(modules, size - 7, 0);
  setupPositionProbePattern(modules, 0, size - 7);
  setupPositionAdjustPattern(modules, version);
  setupTimingPattern(modules);
  setupTypeInfo(modules, mask);
  if (version >= 7) {
    setupTypeNumber(modules, version);
  }
  mapData(modules, data, mask);

  return modules.map((row) => row.map((dark) => dark === true));
}

function setupPositionProbePattern(
  modules: (boolean | null)[][],
  row: number,
  col: number
) {
  const size = modules.length;
  for (let r = -1; r <= 7; r += 1) {
    for (let c = -1; c <= 7; c += 1) {
      const y = row + r;
      const x = col + c;
      if (y < 0 || size <= y || x < 0 || size <= x) continue;

      modules[y][x] =
        (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
        (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
        (2 <= r && r <= 4 && 2 <= c && c <= 4);
    }
  }
}

function setupPositionAdjustPattern(
  modules: (boolean | null)[][],
  version: number
) {
  const positions = PATTERN_POSITION_TABLE[version - 1];
  positions.forEach((row) => {
    positions.forEach((col) => {
      if (modules[row][col] !== null) return;
      for (let r = -2; r <= 2; r += 1) {
        for (let c = -2; c <= 2; c += 1) {
          modules[row + r][col + c] =
            Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
        }
      }
    });
  });
}

function setupTimingPattern(modules: (boolean | null)[][]) {
  const size = modules.length;
  for (let i = 8; i < size - 8; i += 1) {
    if (modules[i][6] === null) {
      modules[i][6] = i % 2 === 0;
    }
    if (modules[6][i] === null) {
      modules[6][i] = i % 2 === 0;
    }
  }
}

function setupTypeInfo(modules: (boolean | null)[][], mask: number) {
  const size = modules.length;
  const data = (ERROR_CORRECTION_LEVEL_L << 3) | mask;
  const bits = getBchTypeInfo(data);

  for (let i = 0; i < 15; i += 1) {
    const dark = !testBit(bits, i);

    if (i < 6) {
      modules[i][8] = dark;
    } else if (i < 8) {
      modules[i + 1][8] = dark;
    } else {
      modules[size - 15 + i][8] = dark;
    }

    if (i < 8) {
      modules[8][size - i - 1] = dark;
    } else if (i < 9) {
      modules[8][15 - i] = dark;
    } else {
      modules[8][15 - i - 1] = dark;
    }
  }

  modules[size - 8][8] = true;
}

function setupTypeNumber(modules: (boolean | null)[][], version: number) {
  const size = modules.length;
  const bits = getBchTypeNumber(version);

  for (let i = 0; i < 18; i += 1) {
    const dark = !testBit(bits, i);
    modules[Math.floor(i / 3)][(i % 3) + size - 11] = dark;
    modules[(i % 3) + size - 11][Math.floor(i / 3)] = dark;
  }
}

function mapData(modules: (boolean | null)[][], data: number[], mask: number) {
  const size = modules.length;
  let inc = -1;
  let row = size - 1;
  let bitIndex = 7;
  let byteIndex = 0;

  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col -= 1;

    while (true) {
      for (let c = 0; c < 2; c += 1) {
        const x = col - c;
        if (modules[row][x] !== null) continue;

        let dark = false;
        if (byteIndex < data.length) {
          dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
        }

        if (getMask(mask, row, x)) {
          dark = !dark;
        }

        modules[row][x] = dark;
        bitIndex -= 1;
        if (bitIndex === -1) {
          byteIndex += 1;
          bitIndex = 7;
        }
      }

      row += inc;
      if (row < 0 || size <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }
}

function getMask(mask: number, row: number, col: number) {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    case 7:
      return (((row * col) % 3) + ((row + col) % 2)) % 2 === 0;
    default:
      throw new Error(`invalid QR mask: ${mask}`);
  }
}

function getLostPoint(matrix: boolean[][]) {
  const size = matrix.length;
  let lostPoint = 0;

  for (let row = 0; row < size; row += 1) {
    lostPoint += getRunPenalty(matrix[row]);
  }

  for (let col = 0; col < size; col += 1) {
    const column = matrix.map((row) => row[col]);
    lostPoint += getRunPenalty(column);
  }

  for (let row = 0; row < size - 1; row += 1) {
    for (let col = 0; col < size - 1; col += 1) {
      const dark = matrix[row][col];
      if (
        dark === matrix[row + 1][col] &&
        dark === matrix[row][col + 1] &&
        dark === matrix[row + 1][col + 1]
      ) {
        lostPoint += 3;
      }
    }
  }

  let darkCount = 0;
  matrix.forEach((row) => {
    row.forEach((dark) => {
      if (dark) darkCount += 1;
    });
  });
  const ratio = Math.abs((darkCount * 100) / size / size - 50) / 5;
  lostPoint += Math.floor(ratio) * 10;

  return lostPoint;
}

function getRunPenalty(line: boolean[]) {
  let lostPoint = 0;
  let runColor = line[0];
  let runLength = 1;

  for (let i = 1; i < line.length; i += 1) {
    if (line[i] === runColor) {
      runLength += 1;
    } else {
      if (runLength >= 5) {
        lostPoint += 3 + (runLength - 5);
      }
      runColor = line[i];
      runLength = 1;
    }
  }

  if (runLength >= 5) {
    lostPoint += 3 + (runLength - 5);
  }

  return lostPoint;
}

function getBchTypeInfo(data: number) {
  let d = data << 10;
  while (getBchDigit(d) - getBchDigit(G15) >= 0) {
    d ^= G15 << (getBchDigit(d) - getBchDigit(G15));
  }
  return ((data << 10) | d) ^ G15_MASK;
}

function getBchTypeNumber(data: number) {
  let d = data << 12;
  while (getBchDigit(d) - getBchDigit(G18) >= 0) {
    d ^= G18 << (getBchDigit(d) - getBchDigit(G18));
  }
  return (data << 12) | d;
}

function getBchDigit(data: number) {
  let digit = 0;
  while (data !== 0) {
    digit += 1;
    data >>>= 1;
  }
  return digit;
}

function testBit(data: number, index: number) {
  return ((data >>> index) & 1) === 1;
}
