#!/usr/bin/env python3
"""Generate refined seed animated GIF backgrounds and pentatonic WAV music."""

from __future__ import annotations

import math
import struct
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "seed-assets" / "images"
MUS_DIR = ROOT / "seed-assets" / "music"
W, H = 1280, 720
FRAMES = 24
DURATION_MS = 120
TAU = math.tau


def ensure_dirs() -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    MUS_DIR.mkdir(parents=True, exist_ok=True)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def mix(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (
        int(lerp(c1[0], c2[0], t)),
        int(lerp(c1[1], c2[1], t)),
        int(lerp(c1[2], c2[2], t)),
    )


def vertical_gradient(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    for y in range(H):
        draw.line((0, y, W, y), fill=mix(top, bottom, y / (H - 1)))
    return img


def save_gif(name: str, frames: list[Image.Image]) -> None:
    palettes = [frame.convert("P", palette=Image.Palette.ADAPTIVE, colors=128) for frame in frames]
    palettes[0].save(
        IMG_DIR / name,
        save_all=True,
        append_images=palettes[1:],
        duration=DURATION_MS,
        loop=0,
        optimize=True,
    )


def glow_circle(
    draw: ImageDraw.ImageDraw,
    cx: float,
    cy: float,
    radius: float,
    color: tuple[int, int, int],
    rings: int = 6,
) -> None:
    for i in range(rings, 0, -1):
        t = i / rings
        r = radius * (0.45 + 0.7 * t)
        c = mix(color, (255, 255, 255), 0.12 * (1 - t))
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=c)


def draw_star(draw: ImageDraw.ImageDraw, x: float, y: float, r: float, color: tuple[int, int, int]) -> None:
    draw.ellipse((x - r, y - r, x + r, y + r), fill=color)
    draw.ellipse((x - r * 0.35, y - r * 2.2, x + r * 0.35, y + r * 2.2), fill=color)
    draw.ellipse((x - r * 2.2, y - r * 0.35, x + r * 2.2, y + r * 0.35), fill=color)


def draw_cloud(draw: ImageDraw.ImageDraw, x: float, y: float, s: float, color: tuple[int, int, int]) -> None:
    blobs = ((0, 0, 1.0), (s * 0.7, -s * 0.18, 0.85), (s * 1.3, 0.05 * s, 1.05), (s * 0.5, s * 0.2, 0.9))
    for dx, dy, k in blobs:
        rr = s * k
        draw.ellipse((x + dx - rr, y + dy - rr * 0.62, x + dx + rr, y + dy + rr * 0.62), fill=color)


def draw_bird(draw: ImageDraw.ImageDraw, x: float, y: float, wing: float, color: tuple[int, int, int]) -> None:
    draw.arc((x - 18, y - wing, x, y + 8), 200, 350, fill=color, width=3)
    draw.arc((x, y - wing, x + 18, y + 8), 190, 340, fill=color, width=3)
    draw.ellipse((x - 4, y - 3, x + 6, y + 4), fill=color)


def draw_flower(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    s: float,
    petal: tuple[int, int, int],
    center: tuple[int, int, int],
) -> None:
    for angle in range(0, 360, 60):
        rad = math.radians(angle)
        px = x + math.cos(rad) * s * 0.7
        py = y + math.sin(rad) * s * 0.7
        draw.ellipse((px - s * 0.45, py - s * 0.32, px + s * 0.45, py + s * 0.32), fill=petal)
    draw.ellipse((x - s * 0.28, y - s * 0.28, x + s * 0.28, y + s * 0.28), fill=center)


def draw_round_creature(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    s: float,
    body: tuple[int, int, int],
    blush: tuple[int, int, int] = (255, 170, 170),
) -> None:
    draw.ellipse((x - s, y - s * 0.85, x + s, y + s * 0.9), fill=body)
    draw.ellipse((x - s * 0.55, y - s * 0.28, x - s * 0.28, y - s * 0.08), fill=(40, 40, 50))
    draw.ellipse((x + s * 0.28, y - s * 0.28, x + s * 0.55, y - s * 0.08), fill=(40, 40, 50))
    draw.ellipse((x - s * 0.7, y + s * 0.05, x - s * 0.4, y + s * 0.22), fill=blush)
    draw.ellipse((x + s * 0.4, y + s * 0.05, x + s * 0.7, y + s * 0.22), fill=blush)
    draw.arc((x - s * 0.22, y + s * 0.12, x + s * 0.22, y + s * 0.38), 20, 160, fill=(90, 60, 70), width=2)


def jing_ye_si() -> None:
    frames = []
    stars = (
        (80, 70),
        (160, 140),
        (240, 50),
        (400, 90),
        (520, 40),
        (860, 80),
        (300, 200),
        (980, 120),
        (1100, 60),
        (640, 160),
        (180, 260),
        (740, 48),
    )
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((8, 14, 46), (28, 36, 78))
        draw = ImageDraw.Draw(img)
        glow = int(18 * abs(math.sin(t * TAU)))
        glow_circle(draw, 980, 128, 92 + glow * 0.15, (255, 236, 170))
        moon_x = 980 + math.sin(t * TAU) * 10
        moon_y = 128 + math.cos(t * TAU) * 6
        draw.ellipse((moon_x - 58, moon_y - 58, moon_x + 58, moon_y + 58), fill=(255, 244, 196))
        draw.ellipse((moon_x - 22, moon_y - 48, moon_x + 48, moon_y + 28), fill=(36, 44, 88))
        for n, (sx, sy) in enumerate(stars):
            twinkle = 160 + int(90 * abs(math.sin((t + n * 0.08) * TAU)))
            r = 1.6 + (n + i) % 3
            draw_star(draw, sx, sy, r, (twinkle, twinkle, 230))
        draw.polygon(((0, 470), (210, 360), (430, 490), (0, H)), fill=(16, 22, 44))
        draw.polygon(((620, H), (820, 340), (1080, 430), (W, H)), fill=(12, 18, 38))
        draw.polygon(((780, H), (940, 390), (W, H)), fill=(20, 26, 50))
        sash = 0.55 + 0.35 * abs(math.sin(t * TAU))
        paper = mix((62, 48, 78), (210, 186, 120), sash)
        window = (90, 300, 310, 560)
        draw.rounded_rectangle(window, radius=18, outline=paper, width=8)
        draw.line((200, 300, 200, 560), fill=paper, width=5)
        draw.line((90, 430, 310, 430), fill=paper, width=5)
        lamp = mix((255, 214, 120), (255, 168, 80), abs(math.sin(t * TAU)))
        draw.ellipse((168, 348, 232, 412), fill=lamp)
        draw_round_creature(draw, 200, 470, 26, (255, 224, 186))
        frames.append(img.filter(ImageFilter.SMOOTH))
    save_gif("jingyesi.gif", frames)


def chun_xiao() -> None:
    frames = []
    flowers = (
        (220, 430, (244, 143, 177)),
        (360, 470, (255, 183, 197)),
        (500, 420, (240, 120, 160)),
        (680, 455, (255, 170, 180)),
        (840, 438, (255, 140, 168)),
        (160, 500, (255, 196, 210)),
    )
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((255, 176, 132), (168, 214, 232))
        draw = ImageDraw.Draw(img)
        for y in range(220, 420):
            draw.line((0, y, W, y), fill=mix((255, 196, 150), (214, 236, 196), (y - 220) / 200))
        sun_y = 108 + math.sin(t * TAU) * 8
        glow_circle(draw, 170, sun_y, 86, (255, 236, 150))
        draw_cloud(draw, 420 + math.sin(t * TAU) * 24, 128, 54, (255, 248, 236))
        draw_cloud(draw, 780 + math.cos(t * TAU) * 18, 90, 70, (255, 250, 240))
        draw.rectangle((0, 500, W, H), fill=(110, 168, 92))
        draw.polygon(((0, 520), (180, 470), (360, 530), (0, H)), fill=(94, 150, 78))
        for n in range(9):
            x = 40 + n * 140
            sway = math.sin((t + n * 0.1) * TAU) * 10
            draw.polygon(((x, 560), (x + 16 + sway, 430), (x + 32, 560)), fill=(70, 132, 64))
        for bx, by, color in flowers:
            bob = math.sin((t + bx / 900) * TAU) * 8
            draw_flower(draw, bx, by + bob, 26, color, (255, 226, 96))
        for b in range(3):
            bird_x = (160 + t * 720 + b * 180) % (W + 80) - 40
            bird_y = 170 + math.sin((t + b * 0.3) * TAU * 2) * 22 + b * 18
            wing = 14 + abs(math.sin((t * 4 + b) * TAU)) * 12
            draw_bird(draw, bird_x, bird_y, wing, (72, 64, 70))
        spark = 10 + 6 * abs(math.sin(t * TAU))
        draw.ellipse((640 - spark, 260 - spark, 640 + spark, 260 + spark), fill=(255, 248, 210))
        frames.append(img)
    save_gif("chunxiao.gif", frames)


def yong_e() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((126, 196, 222), (232, 246, 255))
        draw = ImageDraw.Draw(img)
        draw_cloud(draw, 160 + math.sin(t * TAU) * 20, 90, 48, (255, 255, 255))
        draw_cloud(draw, 900, 70 + math.cos(t * TAU) * 10, 62, (245, 252, 255))
        draw.rectangle((0, 280, W, H), fill=(86, 176, 168))
        for n in range(8):
            y = 300 + n * 36 + math.sin((t + n * 0.12) * TAU) * 8
            draw.arc((30, y, 1250, y + 48), 0, 180, fill=(70, 150, 170), width=3)
        for lx in (80, 1180):
            sway = math.sin(t * TAU) * 8
            draw.polygon(((lx, 80), (lx - 18, 300), (lx + 18, 300)), fill=(64, 122, 72))
            for k in range(5):
                yy = 110 + k * 36
                draw.ellipse((lx - 46 + sway, yy, lx + 10 + sway, yy + 28), fill=(92, 168, 86))
        for hx, hy in ((240, 390), (470, 430), (820, 400), (1040, 440)):
            bob = math.sin((t + hx / 800) * TAU) * 7
            draw.ellipse((hx - 50, hy - 16 + bob, hx + 50, hy + 18 + bob), fill=(46, 140, 92))
            draw.ellipse((hx - 12, hy - 34 + bob, hx + 12, hy - 4 + bob), fill=(54, 122, 70))
        gx = 420 + math.sin(t * TAU) * 50
        gy = 330
        draw.ellipse((gx, gy, gx + 168, gy + 78), fill=(250, 250, 252))
        draw.ellipse((gx + 128, gy - 36, gx + 186, gy + 28), fill=(250, 250, 252))
        draw.polygon(((gx + 180, gy - 6), (gx + 228, gy + 10), (gx + 180, gy + 20)), fill=(240, 170, 50))
        draw.ellipse((gx + 158, gy - 18, gx + 170, gy - 6), fill=(40, 40, 40))
        draw.ellipse((gx + 28, gy + 8, gx + 58, gy + 28), fill=(255, 176, 176))
        draw.polygon(((gx + 36, gy + 54), (gx + 8, gy + 118), (gx + 64, gy + 54)), fill=(250, 250, 252))
        g2 = 760 + math.cos(t * TAU) * 36
        draw.ellipse((g2, 360, g2 + 120, 420), fill=(255, 255, 255))
        draw.ellipse((g2 + 90, 338, g2 + 132, 382), fill=(255, 255, 255))
        draw.polygon(((g2 + 128, 354), (g2 + 162, 366), (g2 + 128, 374)), fill=(240, 170, 50))
        frames.append(img)
    save_gif("yonge.gif", frames)


def min_nong() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((255, 186, 92), (132, 186, 86))
        draw = ImageDraw.Draw(img)
        sun_y = 96 + math.sin(t * TAU) * 10
        glow_circle(draw, 1080, sun_y, 110, (255, 220, 80))
        draw.polygon(((0, 430), (260, 300), (520, 430)), fill=(168, 132, 78))
        draw.polygon(((700, 450), (980, 280), (W, 450)), fill=(150, 118, 70))
        draw.polygon(((0, 500), (W, 470), (W, H), (0, H)), fill=(120, 168, 72))
        for col in range(14):
            x = 24 + col * 92
            sway = math.sin((t + col * 0.08) * TAU) * 10
            draw.polygon(((x, 640), (x + 28 + sway, 340), (x + 56, 640)), fill=(86, 140, 54))
            draw.ellipse((x + 12 + sway, 318, x + 46 + sway, 360), fill=(212, 176, 74))
            draw.ellipse((x + 18 + sway, 308, x + 40 + sway, 330), fill=(232, 196, 90))
        for d in range(4):
            dx = (80 + t * 900 + d * 220) % (W + 40) - 20
            dy = 240 + math.sin((t + d) * TAU * 2) * 18
            wing = 8 + abs(math.sin((t * 6 + d) * TAU)) * 6
            color = (255, 170, 80) if d % 2 == 0 else (170, 210, 255)
            draw.ellipse((dx - wing, dy - 5, dx, dy + 5), fill=color)
            draw.ellipse((dx, dy - 5, dx + wing, dy + 5), fill=color)
            draw.ellipse((dx - 3, dy - 3, dx + 3, dy + 3), fill=(60, 50, 40))
        draw.polygon(((108, 560), (148, 470), (188, 560)), fill=(164, 112, 64))
        draw_round_creature(draw, 148, 448, 22, (255, 214, 170))
        frames.append(img)
    save_gif("minnong.gif", frames)


def deng_guan_que_lou() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((255, 140, 90), (88, 48, 96))
        draw = ImageDraw.Draw(img)
        sun_x = 200 + t * 36
        glow_circle(draw, sun_x + 60, 128, 92, (255, 214, 90))
        draw.polygon(((0, 400), (240, 180), (460, 410)), fill=(92, 64, 110))
        draw.polygon(((300, 430), (620, 120), (940, 440)), fill=(72, 48, 96))
        draw.polygon(((760, 420), (1040, 200), (W, 430)), fill=(58, 40, 84))
        river_y = 470 + math.sin(t * TAU) * 8
        draw.polygon(((0, river_y), (W, river_y + 24), (W, H), (0, H)), fill=(255, 176, 110))
        for n in range(6):
            y = river_y + 18 + n * 16
            draw.arc((40, y, 1240, y + 20), 0, 180, fill=(255, 214, 150), width=2)
        tower_x = 860
        lamp = mix((255, 214, 140), (255, 160, 70), abs(math.sin(t * TAU)))
        draw.rectangle((tower_x, 250, tower_x + 150, 460), fill=(140, 72, 48))
        draw.polygon(((tower_x - 24, 250), (tower_x + 75, 168), (tower_x + 174, 250)), fill=(168, 84, 52))
        draw.rectangle((tower_x + 20, 280, tower_x + 58, 330), fill=lamp)
        draw.rectangle((tower_x + 92, 280, tower_x + 130, 330), fill=lamp)
        draw.rectangle((tower_x + 48, 360, tower_x + 102, 430), fill=(92, 46, 32))
        for b in range(5):
            bx = (40 + t * 420 + b * 160) % (W + 60) - 30
            by = 150 + (b % 3) * 28
            draw_bird(draw, bx, by, 10 + abs(math.sin((t * 3 + b) * TAU)) * 8, (48, 32, 54))
        frames.append(img)
    save_gif("dengguanquelou.gif", frames)


def default_bg() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((246, 236, 214), (210, 190, 158))
        draw = ImageDraw.Draw(img)
        for n in range(18):
            x = (n * 97 + i * 3) % W
            y = (n * 53) % 220
            draw.ellipse((x, 40 + y, x + 3, 43 + y), fill=(196, 176, 148))
        draw.polygon(((0, 430), (220, 260), (480, 430)), fill=(148, 150, 138))
        draw.polygon(((360, 460), (640, 220), (920, 460)), fill=(128, 132, 124))
        draw.polygon(((780, 480), (1040, 280), (W, 480)), fill=(158, 156, 144))
        for n in range(5):
            x = 40 + n * 250 + math.sin((t + n * 0.2) * TAU) * 28
            y = 150 + math.cos((t + n * 0.15) * TAU) * 14
            color = mix((232, 222, 200), (210, 198, 176), 0.4 + 0.3 * abs(math.sin((t + n) * TAU)))
            draw_cloud(draw, x, y, 58, color)
        draw.arc((180, 500, 1100, 680), 200, 340, fill=(176, 158, 128), width=4)
        frames.append(img)
    save_gif("default.gif", frames)


def pentatonic(root: float) -> list[float]:
    ratios = [1.0, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2.0, 9 / 4, 5 / 2, 3.0]
    return [root * r for r in ratios]


def tone(freq: float, idx: int, rate: int) -> float:
    phase = 2 * math.pi * freq * idx / rate
    return math.sin(phase) + 0.18 * math.sin(2 * phase) + 0.06 * math.sin(3 * phase)


def add_note(
    left: list[float],
    right: list[float],
    rate: int,
    freq: float,
    start: float,
    dur: float,
    gain: float,
    pan: float,
) -> None:
    n0 = int(start * rate)
    n = int(dur * rate)
    attack = max(1, int(0.02 * rate))
    release = max(1, int(0.22 * n))
    left_g = gain * (1 - pan) * 0.5
    right_g = gain * (1 + pan) * 0.5
    for i in range(n):
        idx = n0 + i
        if idx >= len(left):
            break
        env = 1.0
        if i < attack:
            env = i / attack
        tail = n - i
        if tail < release:
            env *= tail / release
        s = tone(freq, i, rate) * env
        left[idx] += s * left_g
        right[idx] += s * right_g


def write_score(path: Path, root: float, melody: list[int], beat: float, pad_gain: float, arp_gain: float) -> None:
    rate = 44100
    scale = pentatonic(root)
    phrase = beat * len(melody)
    repeats = max(2, math.ceil(16.5 / phrase))
    length = phrase * repeats + 0.5
    fade = int(rate * 0.4)
    total = int(rate * length) + fade
    left = [0.0] * total
    right = [0.0] * total
    t = 0.0
    for _ in range(repeats):
        for deg in melody:
            freq = scale[deg]
            add_note(left, right, rate, freq, t, beat * 0.92, 0.34, -0.35)
            add_note(left, right, rate, freq / 2, t, beat * 0.96, pad_gain, 0.15)
            add_note(left, right, rate, freq * 1.5, t + beat * 0.08, beat * 0.45, arp_gain, 0.55)
            t += beat
    peak = max(max(abs(s) for s in left), max(abs(s) for s in right), 1e-6)
    scale_amp = 0.72 / peak
    for i in range(total):
        left[i] *= scale_amp
        right[i] *= scale_amp
    loop_len = total - fade
    for i in range(fade):
        a = i / fade
        left[i] = left[i] * a + left[loop_len + i] * (1 - a)
        right[i] = right[i] * a + right[loop_len + i] * (1 - a)
    left = left[:loop_len]
    right = right[:loop_len]
    amp = 26000
    packed = bytearray()
    for l, r in zip(left, right):
        packed += struct.pack(
            "<hh",
            max(-32767, min(32767, int(l * amp))),
            max(-32767, min(32767, int(r * amp))),
        )
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        wf.writeframes(packed)


def main() -> None:
    ensure_dirs()
    jing_ye_si()
    chun_xiao()
    yong_e()
    min_nong()
    deng_guan_que_lou()
    default_bg()
    write_score(MUS_DIR / "jingyesi.wav", 220.0, [5, 4, 5, 2, 3, 2, 1, 0, 5, 7, 6, 5, 4, 2, 3, 5], 0.55, 0.22, 0.08)
    write_score(MUS_DIR / "chunxiao.wav", 261.6, [2, 3, 4, 5, 4, 3, 2, 4, 5, 7, 5, 4, 3, 2, 3, 2], 0.42, 0.16, 0.10)
    write_score(MUS_DIR / "yonge.wav", 293.7, [3, 4, 5, 4, 3, 5, 7, 5, 4, 3, 2, 3, 4, 5, 3, 2], 0.38, 0.14, 0.12)
    write_score(MUS_DIR / "minnong.wav", 196.0, [0, 2, 3, 2, 0, 2, 4, 3, 2, 0, 2, 3, 4, 2, 0, 0], 0.50, 0.24, 0.07)
    write_score(MUS_DIR / "dengguanquelou.wav", 246.9, [4, 5, 7, 5, 4, 3, 4, 5, 7, 8, 7, 5, 4, 2, 3, 4], 0.46, 0.18, 0.09)
    write_score(MUS_DIR / "default.wav", 220.0, [0, 2, 4, 5, 4, 2, 3, 0, 2, 4, 5, 4, 2, 0, 2, 0], 0.48, 0.20, 0.08)
    print(f"assets written to {IMG_DIR} and {MUS_DIR}")


if __name__ == "__main__":
    main()
