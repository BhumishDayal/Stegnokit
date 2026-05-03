from __future__ import annotations

from PIL import Image

from . import watermark

GRID_OPTIONS: dict[str, int] = {
    "stealth": 1,
    "standard": 2,
    "capacity": 3,
    "max": 4,
}
DEFAULT_GRID = "capacity"

# Each tile must be large enough for TrustMark to operate reliably (~256x256
# minimum), so we scale to a canonical 1024-wide canvas before tiling.
WORK_DIM = 1024


def grid_for(name: str) -> int:
    if name not in GRID_OPTIONS:
        raise ValueError(f"unknown grid '{name}'. options: {sorted(GRID_OPTIONS)}")
    return GRID_OPTIONS[name]


def capacity_bits(grid: int) -> int:
    return grid * grid * watermark.TRUSTMARK_BITS


def capacity_bytes(grid: int) -> int:
    return capacity_bits(grid) // 8


def _split(img: Image.Image, grid: int) -> list[Image.Image]:
    w, h = img.size
    tile_w, tile_h = w // grid, h // grid
    tiles = []
    for r in range(grid):
        for c in range(grid):
            left = c * tile_w
            top = r * tile_h
            right = (c + 1) * tile_w if c < grid - 1 else w
            bottom = (r + 1) * tile_h if r < grid - 1 else h
            tiles.append(img.crop((left, top, right, bottom)))
    return tiles


def _merge(tiles: list[Image.Image], grid: int, size: tuple[int, int]) -> Image.Image:
    w, h = size
    tile_w, tile_h = w // grid, h // grid
    canvas = Image.new("RGB", (w, h))
    for i, tile in enumerate(tiles):
        r, c = divmod(i, grid)
        if tile.size != (tile_w, tile_h):
            tile = tile.resize((tile_w, tile_h), Image.LANCZOS)
        canvas.paste(tile, (c * tile_w, r * tile_h))
    return canvas


def embed(image: Image.Image, bits: list[int], grid: int) -> Image.Image:
    cap = capacity_bits(grid)
    if len(bits) > cap:
        raise ValueError(f"payload too large: {len(bits)} bits > {cap} bits at grid {grid}")
    bits = list(bits) + [0] * (cap - len(bits))

    original_size = image.size
    work = image.convert("RGB").resize((WORK_DIM, WORK_DIM), Image.LANCZOS)
    tiles = _split(work, grid)

    out_tiles: list[Image.Image] = []
    bits_per_tile = watermark.TRUSTMARK_BITS
    for i, tile in enumerate(tiles):
        chunk = bits[i * bits_per_tile : (i + 1) * bits_per_tile]
        out_tiles.append(watermark.embed(tile, chunk))

    merged = _merge(out_tiles, grid, (WORK_DIM, WORK_DIM))
    return merged.resize(original_size, Image.LANCZOS)


def extract(image: Image.Image, grid: int) -> tuple[list[int], float]:
    work = image.convert("RGB").resize((WORK_DIM, WORK_DIM), Image.LANCZOS)
    tiles = _split(work, grid)
    bits: list[int] = []
    confidences: list[float] = []
    for tile in tiles:
        b, _present, conf = watermark.extract(tile, watermark.TRUSTMARK_BITS)
        bits.extend(b)
        confidences.append(conf)
    avg = sum(confidences) / max(1, len(confidences))
    return bits, avg
