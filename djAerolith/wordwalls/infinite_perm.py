"""
Geometry and the seeded shuffle for the Great Wall.

A wall holds every alphagram of a single length in a single lexicon. There are
three coordinate spaces:

    cell index   g in [0, n)   Position on the wall. The progress bitmap and the
                               minimap are indexed by this.
    chunk index  c = g // size The zoomable rectangle a cell belongs to.
    rank         r = perm(g)   Which alphagram lives in that cell. The word
                               server's probability index is r + 1.

The rectangle dimensions below are only defaults for *new* walls. Every wall
stores its own chunk_w/chunk_h/chunk_cols, because changing these constants
reinterprets every coordinate: the same chunk index would name a different band
of cells, so already-solved bits would land in the wrong rectangles and stored
chunk rows would be silently orphaned. Geometry is frozen at creation.

Nothing in here touches the database or the word server, so it is all cheap and
directly unit-testable.
"""

import hashlib
import struct
from math import ceil, isqrt

# Defaults for new walls. At wordwalls' question metrics (176x30 px) an 8x16
# rectangle renders 1408x480 px, so it fits a normal monitor at roughly 1:1. The
# board scales the rectangle down rather than reflowing it, so a cell's position
# on the wall still means something once you have zoomed into it.
DEFAULT_CHUNK_W = 8
DEFAULT_CHUNK_H = 16
DEFAULT_CHUNK_SIZE = DEFAULT_CHUNK_W * DEFAULT_CHUNK_H

MAX_CHUNK_COLS = 200
VALID_WORD_LENGTHS = (4, 5, 6, 7, 8, 9)


def chunk_cols_for(
    num_chunks: int, chunk_w: int = DEFAULT_CHUNK_W, chunk_h: int = DEFAULT_CHUNK_H
) -> int:
    """
    How many rectangles wide to make the wall.

    Chosen so the wall lands near 2:1 in cells: we want
    (cols * chunk_w) / (rows * chunk_h) ~= 2 with rows = num_chunks / cols,
    which solves to cols ~= sqrt(2 * num_chunks * chunk_h / chunk_w).
    """
    if num_chunks <= 1:
        return 1
    target = isqrt(2 * num_chunks * chunk_h // chunk_w) or 1
    return max(1, min(target, MAX_CHUNK_COLS, num_chunks))


class WallGeometry:
    """
    The derived shape of one wall.

    Takes the wall's own rectangle dimensions rather than reading the module
    constants, so a wall built under an older shape keeps rendering and indexing
    exactly as it did when it was played.
    """

    def __init__(
        self,
        num_alphagrams: int,
        chunk_cols: int,
        chunk_w: int = DEFAULT_CHUNK_W,
        chunk_h: int = DEFAULT_CHUNK_H,
    ):
        self.n = num_alphagrams
        self.chunk_cols = chunk_cols
        self.chunk_w = chunk_w
        self.chunk_h = chunk_h
        self.chunk_size = chunk_w * chunk_h
        self.num_chunks = (
            ceil(num_alphagrams / self.chunk_size) if num_alphagrams else 0
        )
        self.chunk_rows = ceil(self.num_chunks / chunk_cols) if chunk_cols else 0
        self.width = chunk_cols * chunk_w
        self.height = self.chunk_rows * chunk_h

    def valid_chunk(self, chunk_index: int) -> bool:
        return isinstance(chunk_index, int) and 0 <= chunk_index < self.num_chunks

    def cells_in_chunk(self, chunk_index: int):
        """
        The cell indices in a rectangle, in reading order within the rectangle.

        The final rectangle of a wall is usually only partly filled; cells at or
        past n are void and never appear here.
        """
        base = chunk_index * self.chunk_size
        return [g for g in range(base, min(base + self.chunk_size, self.n))]

    def cell_to_xy(self, g: int):
        """Cell index -> (x, y) on the wall, for drawing."""
        chunk_index, local = divmod(g, self.chunk_size)
        chunk_row, chunk_col = divmod(chunk_index, self.chunk_cols)
        ly, lx = divmod(local, self.chunk_w)
        return chunk_col * self.chunk_w + lx, chunk_row * self.chunk_h + ly

    def xy_to_cell(self, x: int, y: int) -> int:
        """(x, y) on the wall -> cell index. Inverse of cell_to_xy."""
        chunk_col, lx = divmod(x, self.chunk_w)
        chunk_row, ly = divmod(y, self.chunk_h)
        chunk_index = chunk_row * self.chunk_cols + chunk_col
        return chunk_index * self.chunk_size + ly * self.chunk_w + lx

    def to_dict(self):
        return {
            "numAlphagrams": self.n,
            "chunkCols": self.chunk_cols,
            "chunkRows": self.chunk_rows,
            "numChunks": self.num_chunks,
            "chunkWidth": self.chunk_w,
            "chunkHeight": self.chunk_h,
            "chunkSize": self.chunk_size,
            "width": self.width,
            "height": self.height,
        }


def bitmap_size(n: int) -> int:
    """Bytes needed to hold one bit per cell."""
    return (n + 7) // 8


def get_bit(buf, g: int) -> bool:
    """Bits are LSB-first within each byte, so cell g lives at buf[g >> 3] bit g & 7."""
    return bool((buf[g >> 3] >> (g & 7)) & 1)


def set_bit(buf: bytearray, g: int) -> None:
    buf[g >> 3] |= 1 << (g & 7)


def padded(buf, nbits: int) -> bytearray:
    """A mutable copy of a bitmask, zero-extended to hold at least nbits."""
    out = bytearray(buf)
    if len(out) < bitmap_size(nbits):
        out.extend(bytes(bitmap_size(nbits) - len(out)))
    return out


def popcount(buf) -> int:
    return int.from_bytes(bytes(buf), "little").bit_count()


def word_bits(answers):
    """
    Word -> (bit, entry) for a rectangle's stored answers.

    Words are numbered in `answers` order, which is fixed once the rectangle is
    materialized, so the numbering is stable for the life of the row.
    """
    bits = {}
    for entry in answers:
        for word in entry["a"]:
            bits[word] = (len(bits), entry)
    return bits


def assemble_bitmap(n: int, chunk_size: int, masks) -> bytes:
    """
    Build the wall-wide bitmap the client draws from per-rectangle masks.

    `masks` yields (chunk_index, solved_cells). Rectangles are disjoint, so when
    they are byte-aligned (every default shape is) each mask is a straight copy;
    an older unaligned shape falls back to setting bits one at a time.
    """
    buf = bytearray(bitmap_size(n))
    for chunk_index, mask in masks:
        mask = bytes(mask)
        base = chunk_index * chunk_size
        if chunk_size % 8 == 0:
            start = base >> 3
            piece = mask[: max(0, len(buf) - start)]
            buf[start : start + len(piece)] = piece
            continue
        for byte_index, byte in enumerate(mask):
            for bit in range(8):
                g = base + (byte_index << 3) + bit
                if (byte >> bit) & 1 and g < n:
                    set_bit(buf, g)
    return bytes(buf)


def _round_fn(seed: int, rnd: int, x: int, half_bits: int) -> int:
    """Keyed round function. blake2b so the mapping is stable across versions."""
    digest = hashlib.blake2b(
        struct.pack("<QBI", seed, rnd, x), digest_size=8
    ).digest()
    return struct.unpack("<Q", digest)[0] & ((1 << half_bits) - 1)


class WallPermutation:
    """
    A bijection on [0, n): wall cell index -> 0-based alphagram rank.

    This is a 4-round balanced Feistel network over 2 * half bits, restricted to
    exactly [0, n) by cycle-walking. That buys us an O(1) lookup in both
    directions while storing nothing but an 8-byte seed -- important because a
    wall of OSPS52 nines would otherwise need a ~1 MB materialized permutation,
    and because a wall stays open for hours and across deploys.

    `random.Random(seed).shuffle(...)` would be shorter but its algorithm is not
    a documented guarantee; if it ever changed, every wall in progress would
    silently scramble. blake2b + Feistel cannot drift.

    Server-side only: the client is indexed by cell, never by rank, so there is
    no cross-language parity to maintain.
    """

    ROUNDS = 4

    def __init__(self, seed: int, n: int):
        if n < 1:
            raise ValueError("cannot permute an empty wall")
        self.seed = seed & 0xFFFFFFFFFFFFFFFF
        self.n = n
        bits = max(2, (n - 1).bit_length())
        self.half = (bits + 1) // 2
        self.mask = (1 << self.half) - 1

    def _encrypt(self, x: int) -> int:
        lo, hi = x & self.mask, (x >> self.half) & self.mask
        for rnd in range(self.ROUNDS):
            lo, hi = hi, lo ^ _round_fn(self.seed, rnd, hi, self.half)
        return (hi << self.half) | lo

    def _decrypt(self, y: int) -> int:
        hi, lo = (y >> self.half) & self.mask, y & self.mask
        for rnd in reversed(range(self.ROUNDS)):
            hi, lo = lo, hi ^ _round_fn(self.seed, rnd, lo, self.half)
        return (hi << self.half) | lo

    def forward(self, cell: int) -> int:
        """Cell index -> alphagram rank."""
        v = cell
        while True:
            v = self._encrypt(v)
            if v < self.n:
                return v

    def inverse(self, rank: int) -> int:
        """Alphagram rank -> cell index."""
        v = rank
        while True:
            v = self._decrypt(v)
            if v < self.n:
                return v

    def probabilities_for_cells(self, cells):
        """
        Cell indices -> the word server's 1-based probability indices.

        Returns (probabilities, prob_to_cell) so the caller can put the
        response back into cell order -- the word server always answers
        `ORDER BY alphagrams.probability`, never in the order asked for.
        """
        probabilities = []
        prob_to_cell = {}
        for g in cells:
            prob = self.forward(g) + 1
            probabilities.append(prob)
            prob_to_cell[prob] = g
        return probabilities, prob_to_cell
