"""Split the generated rank sprite sheet into normalized transparent WebP assets."""

from pathlib import Path
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp/imagegen/rank-sprites-transparent.png"
DIVISION_SOURCE = ROOT / "tmp/imagegen/divisions-transparent.png"

RANKS = {
    "bronze": (0, 0),
    "silver": (1, 0),
    "gold": (2, 0),
    "diamond": (4, 0),
}

DIVISIONS = {str(division): division - 1 for division in range(1, 4)}

STANDALONE_DIVISIONS = {
    "4": ROOT / "tmp/imagegen/division-4-transparent.png",
    "5": ROOT / "tmp/imagegen/division-5-transparent.png",
}

STANDALONE_RANKS = {
    "platinum": ROOT / "tmp/imagegen/platinum-transparent.png",
    "master": ROOT / "tmp/imagegen/master-transparent.png",
    "grandmaster": ROOT / "tmp/imagegen/grandmaster-transparent.png",
    "champion": ROOT / "tmp/imagegen/champion-transparent.png",
}


def remove_border_fragments(image: Image.Image) -> None:
    """Clear sprite bleed near a grid-cell edge."""
    alpha = image.getchannel("A")
    pixels = alpha.load()
    inset = 32
    for y in range(image.height):
        for x in range(image.width):
            if (
                x < inset
                or x >= image.width - inset
                or y < inset
                or y >= image.height - inset
                or pixels[x, y] < 32
            ):
                pixels[x, y] = 0

    image.putalpha(alpha)


def save_sprite(sprite: Image.Image, destination: Path) -> None:
    alpha_bounds = sprite.getchannel("A").getbbox()
    if alpha_bounds is None:
        raise ValueError(f"No visible sprite found for {destination.name}")

    sprite = sprite.crop(alpha_bounds)
    available = 224
    sprite.thumbnail((available, available), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (256, 256))
    canvas.alpha_composite(
        sprite,
        ((canvas.width - sprite.width) // 2, (canvas.height - sprite.height) // 2),
    )

    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, "WEBP", quality=95, alpha_quality=100, method=6)


def save_cell(sheet: Image.Image, cell: tuple[int, int], destination: Path) -> None:
    column, row = cell
    cell_width = sheet.width / 5
    cell_height = sheet.height / 3
    crop = sheet.crop(
        (
            round(column * cell_width),
            round(row * cell_height),
            round((column + 1) * cell_width),
            round((row + 1) * cell_height),
        )
    )
    remove_border_fragments(crop)
    save_sprite(crop, destination)


def find_horizontal_sprites(sheet: Image.Image) -> list[tuple[int, int]]:
    """Find separated sprite bounds instead of assuming evenly spaced cells."""
    alpha = sheet.getchannel("A")
    occupied_columns = [
        sum(1 for y in range(sheet.height) if alpha.getpixel((x, y)) >= 64) > 2
        for x in range(sheet.width)
    ]
    bounds: list[tuple[int, int]] = []
    start: int | None = None
    for x, occupied in enumerate([*occupied_columns, False]):
        if occupied and start is None:
            start = x
        elif not occupied and start is not None:
            bounds.append((start, x))
            start = None
    return bounds


def save_strip_cell(sheet: Image.Image, column: int, destination: Path) -> None:
    bounds = find_horizontal_sprites(sheet)
    if len(bounds) != 5:
        raise ValueError(f"Expected 5 division sprites, found {len(bounds)}")
    left, right = bounds[column]
    crop = sheet.crop((left, 0, right, sheet.height))
    save_sprite(crop, destination)


def main() -> None:
    with Image.open(SOURCE).convert("RGBA") as sheet:
        for name, cell in RANKS.items():
            save_cell(sheet, cell, ROOT / f"public/images/ranks/{name}.webp")
    with Image.open(DIVISION_SOURCE).convert("RGBA") as sheet:
        for name, column in DIVISIONS.items():
            save_strip_cell(sheet, column, ROOT / f"public/images/divisions/{name}.webp")
    for name, source in STANDALONE_DIVISIONS.items():
        with Image.open(source).convert("RGBA") as sprite:
            save_sprite(sprite, ROOT / f"public/images/divisions/{name}.webp")
    for name, source in STANDALONE_RANKS.items():
        with Image.open(source).convert("RGBA") as sprite:
            save_sprite(sprite, ROOT / f"public/images/ranks/{name}.webp")


if __name__ == "__main__":
    main()
