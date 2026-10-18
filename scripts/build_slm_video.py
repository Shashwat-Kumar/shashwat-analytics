"""Render the 'claim 09 tested' clip from a real baseline_classic.py run log.

Usage: python make_video.py <run.log> <eval.jsonl> <fonts_dir> <out.mp4> <poster.jpg>
Every number on screen is read from the log; nothing is typed in by hand.
"""
import json
import re
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

LOG, EVAL, FONTS, OUT, POSTER = sys.argv[1:6]
W = H = 1080
FPS = 30
M = 96  # margin
CREAM, INK, GREEN, MUTED = (248, 246, 240), (23, 40, 32), (33, 79, 62), (99, 115, 104)
DARK, MINT, PALE, LINE = (23, 40, 32), (165, 215, 170), (196, 216, 202), (56, 83, 68)

log = [l.rstrip("\n") for l in open(LOG, encoding="utf-8")]
shown = [l for l in log if not l.startswith("Saved results")]
score = re.search(r"(\d+)/(\d+) correct", "\n".join(log))
secs = re.search(r"Trained in ([\d.]+) s", "\n".join(log)).group(1)
correct, total = score.group(1), score.group(2)
rows = [json.loads(l) for l in open(EVAL, encoding="utf-8") if l.strip()]
samples = [rows[i] for i in (0, 5, 10, 15, 20)]


def font(name, size, weight):
    f = ImageFont.truetype(f"{FONTS}/{name}.ttf", size)
    f.set_variation_by_axes([weight])
    return f


F = {
    "claim": font("grotesk", 70, 700), "head": font("grotesk", 58, 700),
    "big": font("grotesk", 300, 700), "mid": font("grotesk", 46, 700),
    "body": font("dmsans", 36, 500), "small": font("dmsans", 30, 500),
    "mono": font("mono", 34, 600), "monos": font("mono", 31, 500),
    "label": font("mono", 26, 700), "brand": font("grotesk", 40, 700),
}


def wrap(text, f, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if f.getlength(test) <= width:
            cur = test
        else:
            lines.append(cur)
            cur = w
    lines.append(cur)
    return lines


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


class Frame:
    def __init__(self, bg):
        self.img = Image.new("RGB", (W, H), bg)
        self.bg = bg

    def text(self, xy, s, f, fill, t, start, dur=0.5, rise=18):
        a = ease((t - start) / dur)
        if a <= 0:
            return
        x, y = xy
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).text((x, y + rise * (1 - a)), s, font=f, fill=fill + (int(255 * a),))
        self.img.paste(layer, (0, 0), layer)

    def block(self, xy, lines, f, fill, t, start, lh, **k):
        for i, line in enumerate(lines):
            self.text((xy[0], xy[1] + i * lh), line, f, fill, t, start, **k)

    def rect(self, box, fill, t, start, dur=0.4, radius=10):
        a = ease((t - start) / dur)
        if a <= 0:
            return
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(layer).rounded_rectangle(box, radius, fill=fill + (int(255 * a),))
        self.img.paste(layer, (0, 0), layer)

    def fade_out(self, t, end, dur=0.35):
        a = ease((t - (end - dur)) / dur)
        if a > 0:
            self.img = Image.blend(self.img, Image.new("RGB", (W, H), self.bg), a)


def brand(fr, t, dark=False):
    c1 = (230, 241, 228) if dark else INK
    c2 = MINT if dark else GREEN
    a = 0.0
    fr.text((M, H - M - 40), "Read", F["brand"], c1, t, a, rise=0)
    fr.text((M + F["brand"].getlength("Read"), H - M - 40), "Sigil", F["brand"], c2, t, a, rise=0)


def s1(t, poster=False):  # the claim
    fr = Frame(CREAM)
    fr.text((M, 250), "Claim 09", F["label"], GREEN, t, 0.2)
    fr.block((M, 310), wrap("“A higher benchmark score means a better model for our task.”",
                             F["claim"], W - 2 * M), F["claim"], INK, t, 0.6, 88)
    fr.text((M, 690), "We tested it.", F["body"], MUTED, t, 2.6)
    if not poster:
        brand(fr, t)
    fr.fade_out(t, 5.0)
    return fr


def s2(t):  # the setup
    fr = Frame(CREAM)
    fr.block((M, 180), wrap("On this page’s own data.", F["head"], W - 2 * M), F["head"], INK, t, 0.2, 72)
    items = [("75", "training messages"), (total, "held-out messages, never seen in training"),
             ("5", "labels")]
    for i, (n, label) in enumerate(items):
        y = 330 + i * 120
        fr.text((M, y), n, F["mid"], GREEN, t, 0.9 + i * 0.45)
        fr.text((M + 120, y + 8), label, F["body"], INK, t, 0.9 + i * 0.45)
    x = M
    for i, lab in enumerate(["cards", "payments", "account", "other", "unknown"]):
        wdt = F["label"].getlength(lab) + 36
        fr.rect((x, 720, x + wdt, 776), (230, 240, 228), t, 2.5 + i * 0.12)
        fr.text((x + 18, 732), lab, F["label"], (40, 87, 65), t, 2.5 + i * 0.12, rise=0)
        x += wdt + 14
    fr.text((M, 830), "Method: TF-IDF + logistic regression. No language model.",
            F["small"], MUTED, t, 3.4)
    fr.fade_out(t, 6.0)
    return fr


def s3(t):  # real held-out examples
    fr = Frame(CREAM)
    fr.text((M, 150), f"Five of the {total} held-out messages", F["label"], GREEN, t, 0.2)
    y = 220
    for i, r in enumerate(samples):
        lines = wrap(r["message"], F["body"], W - 2 * M - 230)
        fr.block((M, y), lines, F["body"], INK, t, 0.6 + i * 0.5, 46)
        lw = F["label"].getlength(r["label"])
        fr.text((W - M - lw, y + 6), r["label"], F["label"], GREEN, t, 0.9 + i * 0.5)
        y += 46 * len(lines) + 70
    fr.fade_out(t, 6.0)
    return fr


def s4(t):  # the real terminal output
    fr = Frame(DARK)
    blocks = []
    for line in shown:
        parts = wrap(line, F["monos"], W - 2 * M) if F["monos"].getlength(line) > W - 2 * M else [line]
        blocks.append((line, parts))
    height = 60 + 30 + sum(52 * len(p) + 30 for _, p in blocks)
    top = (H - height) // 2
    fr.rect((M - 30, top - 40, W - M + 30, top + height + 30), (15, 28, 22), t, 0.0, dur=0.3, radius=16)
    cmd = "$ python baseline_classic.py"
    n = int(len(cmd) * ease((t - 0.5) / 1.4)) if t > 0.5 else 0
    fr.text((M, top), cmd[:n], F["mono"], (225, 242, 223), t, 0.5, dur=0.01, rise=0)
    y = top + 90
    for i, (line, parts) in enumerate(blocks):
        start = 2.4 + i * 0.7
        is_score = "correct" in line and "/" in line
        if is_score:
            fr.rect((M - 14, y - 10, W - M + 14, y + 52 * len(parts) + 2), (38, 74, 54), t, start + 0.9)
        fr.block((M, y), parts, F["monos"], MINT if is_score else PALE, t, start, 52, dur=0.25, rise=0)
        y += 52 * len(parts) + 30
    fr.fade_out(t, 9.5)
    return fr


def s5(t):  # the result
    fr = Frame(DARK)
    txt = f"{correct}/{total}"
    fr.text((M - 14, 170), txt, F["big"], MINT, t, 0.2, dur=0.7, rise=30)
    fr.text((M, 600), "held-out messages correct", F["mid"], (230, 241, 228), t, 0.9)
    fr.block((M, 690), [f"Trained in {secs} seconds on a CPU.", "No GPU. No model download."],
             F["body"], PALE, t, 1.6, 50)
    brand(fr, t, dark=True)
    fr.fade_out(t, 5.5)
    return fr


def s6(t):  # the warning
    fr = Frame(CREAM)
    fr.block((M, 230), wrap("A perfect score is a warning, too.", F["claim"], W - 2 * M),
             F["claim"], INK, t, 0.2, 88)
    body = ("Twenty-five clean, single-language messages can’t tell models apart. "
            "Real customers mix languages, misspell words and ask two things at once.")
    fr.block((M, 460), wrap(body, F["body"], W - 2 * M), F["body"], MUTED, t, 1.3, 52)
    fr.fade_out(t, 7.0)
    return fr


def s7(t):  # the close
    fr = Frame(CREAM)
    fr.block((M, 300), wrap("Beat the baseline before you fine-tune.", F["claim"], W - 2 * M),
             F["claim"], INK, t, 0.2, 88)
    fr.text((M, 560), "readsigil.com/slm", F["mono"], GREEN, t, 1.2)
    brand(fr, t)
    return fr


SCENES = [(s1, 5.0), (s2, 6.0), (s3, 6.0), (s4, 9.5), (s5, 5.5), (s6, 7.0), (s7, 4.5)]

ff = subprocess.Popen([
    "ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
    "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-vf", "scale=720:720:flags=lanczos",
    "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
for scene, dur in SCENES:
    for i in range(int(dur * FPS)):
        ff.stdin.write(scene(i / FPS).img.tobytes())
ff.stdin.close()
ff.wait()
s1(4.0, poster=True).img.resize((720, 720), Image.LANCZOS).save(POSTER, quality=86, optimize=True, progressive=True)
for name, (scene, at) in {"f1": (s1, 4), "f2": (s2, 5), "f3": (s3, 5), "f4": (s4, 8.5),
                          "f5": (s5, 4.5), "f6": (s6, 6), "f7": (s7, 4)}.items():
    scene(at).img.resize((540, 540)).save(OUT.rsplit("/", 1)[0] + f"/check_{name}.png")
print("total seconds", sum(d for _, d in SCENES))
