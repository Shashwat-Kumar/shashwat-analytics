#!/usr/bin/env python3
"""Generate the default ReadSigil / The Signal share image (1200x627).

The card is a publication lockup: the S mark, the ReadSigil wordmark, and a
one-line dek. It must not include a personal name, a photo, or an employer.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/img/og-readsigil.png"

SERIF = "/usr/share/fonts/truetype/sand-box/custom/Source Serif Pro/SourceSerifPro-Bold.ttf"
INTER = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"

BG = (250, 249, 246, 255)
INK = (17, 17, 16, 255)
ORANGE = (255, 106, 61, 255)
TEAL = (11, 93, 99, 255)
CREAM = (250, 249, 246, 255)

W, H = 1200, 627
SCALE = 3


def inter(size, weight=500):
    font = ImageFont.truetype(INTER, size)
    values = []
    for axis in font.get_variation_axes():
        name = axis["name"].decode() if isinstance(axis["name"], bytes) else axis["name"]
        if "Weight" in name:
            values.append(weight)
        elif "Optical" in name:
            values.append(min(max(size / SCALE, axis["minimum"]), axis["maximum"]))
        else:
            values.append(axis["default"])
    font.set_variation_by_axes(values)
    return font


def ink_metrics(font, text):
    """Return ink width, height, and offset from the text() origin to ink top-left."""
    tmp = Image.new("L", (font.size * 4, font.size * 4), 0)
    draw = ImageDraw.Draw(tmp)
    origin = (font.size, font.size)
    draw.text(origin, text, font=font, fill=255)
    box = tmp.getbbox()
    if not box:
        return 0, 0, 0, 0
    return box[2] - box[0], box[3] - box[1], box[0] - origin[0], box[1] - origin[1]


def draw_mark(canvas, x, y, size):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    radius = int(round(size * 12 / 64))
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=INK)
    sfont = ImageFont.truetype(SERIF, int(size * 42 / 64))
    ink_w, ink_h, ox, oy = ink_metrics(sfont, "S")
    draw.text(((size - ink_w) / 2 - ox, (size - ink_h) / 2 - oy), "S", font=sfont, fill=CREAM)
    cx, cy, cr = size * 50 / 64, size * 16 / 64, size * 5.1 / 64
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=ORANGE)
    canvas.alpha_composite(layer, (int(x), int(y)))


def double_rule(draw, y, x0, x1):
    draw.rectangle([x0, y, x1, y + 2 * SCALE], fill=INK)
    draw.rectangle([x0, y + 6 * SCALE, x1, y + 8 * SCALE], fill=INK)


def render():
    width, height = W * SCALE, H * SCALE
    image = Image.new("RGBA", (width, height), BG)
    draw = ImageDraw.Draw(image)
    margin = int(112 * SCALE)
    double_rule(draw, int(40 * SCALE), margin, width - margin)
    double_rule(draw, height - int(48 * SCALE), margin, width - margin)

    mark = int(178 * SCALE)
    word, tag = "ReadSigil", "The Signal: AI, banking and fintech, plainly written"
    word_font = ImageFont.truetype(SERIF, int(108 * SCALE))
    tag_font = inter(int(28 * SCALE), 520)
    word_w, word_h, word_ox, word_oy = ink_metrics(word_font, word)
    tag_w, tag_h, tag_ox, tag_oy = ink_metrics(tag_font, tag)
    del word_w, tag_w  # unused; metrics used for height and origin

    gap_mark = int(44 * SCALE)
    gap_text = int(28 * SCALE)
    text_block_h = word_h + gap_text + tag_h
    group_h = max(mark, text_block_h)
    mid = (int(40 * SCALE) + 8 * SCALE + height - int(48 * SCALE)) / 2
    group_y = int(mid - group_h / 2)

    mark_x = margin
    mark_y = group_y + (group_h - mark) // 2
    draw_mark(image, mark_x, mark_y, mark)

    text_x = mark_x + mark + gap_mark
    text_top = mark_y + (mark - text_block_h) // 2
    draw.text((text_x - word_ox, text_top - word_oy), word, font=word_font, fill=INK)
    draw.text((text_x - tag_ox, text_top + word_h + gap_text - tag_oy), tag, font=tag_font, fill=TEAL)

    image = image.resize((W, H), Image.Resampling.LANCZOS)
    out = Image.new("RGB", image.size, (250, 249, 246))
    out.paste(image, mask=image.split()[-1])
    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    render()
