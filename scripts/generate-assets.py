#!/usr/bin/env python3
"""Generate seed animated GIF backgrounds and WAV music."""

from __future__ import annotations

import math
import os
import struct
import wave
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
IMG_DIR = ROOT / "seed-assets" / "images"
MUS_DIR = ROOT / "seed-assets" / "music"
W, H = 960, 540
FRAMES = 12


def ensure_dirs() -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    MUS_DIR.mkdir(parents=True, exist_ok=True)


def lerp(a: int, b: int, t: float) -> int:
    return int(a + (b - a) * t)


def mix(c1: tuple[int, int, int], c2: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return (lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t))


def vertical_gradient(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        t = y / (H - 1)
        color = mix(top, bottom, t)
        for x in range(W):
            px[x, y] = color
    return img


def save_gif(name: str, frames: list[Image.Image], duration: int = 120) -> None:
    path = IMG_DIR / name
    frames[0].save(
        path,
        save_all=True,
        append_images=frames[1:],
        duration=duration,
        loop=0,
        optimize=True,
    )


def jing_ye_si() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((8, 16, 48), (18, 32, 72))
        draw = ImageDraw.Draw(img)
        moon_x = int(700 + math.sin(t * math.tau) * 18)
        moon_y = int(120 + math.cos(t * math.tau) * 8)
        draw.ellipse((moon_x - 54, moon_y - 54, moon_x + 54, moon_y + 54), fill=(246, 232, 168))
        draw.ellipse((moon_x - 28, moon_y - 40, moon_x + 44, moon_y + 32), fill=(18, 32, 72))
        for n, (sx, sy) in enumerate(((80, 70), (160, 140), (240, 50), (400, 90), (520, 40), (860, 80), (300, 200))):
            r = 2 + (n + i) % 3
            glow = 180 + int(70 * abs(math.sin((t + n * 0.1) * math.tau)))
            draw.ellipse((sx - r, sy - r, sx + r, sy + r), fill=(glow, glow, 220))
        draw.polygon(((0, 430), (180, 360), (360, 440), (0, 540)), fill=(22, 28, 46))
        draw.polygon(((500, 540), (640, 350), (820, 540)), fill=(16, 22, 40))
        window = (120, 280, 280, 460)
        draw.rectangle(window, outline=(210, 186, 120), width=6)
        draw.line((200, 280, 200, 460), fill=(210, 186, 120), width=4)
        draw.line((120, 370, 280, 370), fill=(210, 186, 120), width=4)
        frames.append(img)
    save_gif("jingyesi.gif", frames)


def chun_xiao() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((168, 214, 232), (214, 236, 196))
        draw = ImageDraw.Draw(img)
        draw.ellipse((70, 50, 170, 150), fill=(255, 236, 150))
        for bx, by, color in ((220, 360, (244, 143, 177)), (360, 390, (255, 183, 197)), (500, 350, (240, 120, 160)), (680, 380, (255, 170, 180))):
            bob = int(math.sin((t + bx / 800) * math.tau) * 8)
            draw.ellipse((bx - 28, by - 18 + bob, bx + 28, by + 18 + bob), fill=color)
            draw.ellipse((bx - 12, by - 36 + bob, bx + 12, by - 6 + bob), fill=color)
        bird_x = int(200 + t * 520)
        bird_y = int(160 + math.sin(t * math.tau * 2) * 20)
        wing = 16 + int(math.sin(t * math.tau * 4) * 10)
        draw.line((bird_x - 18, bird_y, bird_x, bird_y - wing), fill=(70, 70, 70), width=3)
        draw.line((bird_x, bird_y - wing, bird_x + 18, bird_y), fill=(70, 70, 70), width=3)
        draw.rectangle((0, 460, W, H), fill=(110, 168, 92))
        frames.append(img)
    save_gif("chunxiao.gif", frames)


def yong_e() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((126, 196, 222), (232, 246, 255))
        draw = ImageDraw.Draw(img)
        for n in range(6):
            y = 300 + n * 28 + int(math.sin((t + n * 0.12) * math.tau) * 6)
            draw.arc((40, y, 920, y + 40), 0, 180, fill=(90, 160, 190), width=2)
        gx = int(360 + math.sin(t * math.tau) * 40)
        gy = 250
        draw.ellipse((gx, gy, gx + 150, gy + 70), fill=(250, 250, 250))
        draw.ellipse((gx + 120, gy - 30, gx + 170, gy + 30), fill=(250, 250, 250))
        draw.polygon(((gx + 168, gy - 4), (gx + 210, gy + 8), (gx + 168, gy + 16)), fill=(240, 170, 50))
        draw.ellipse((gx + 148, gy - 16, gx + 158, gy - 6), fill=(40, 40, 40))
        draw.polygon(((gx + 30, gy + 50), (gx + 10, gy + 110), (gx + 50, gy + 50)), fill=(250, 250, 250))
        frames.append(img)
    save_gif("yonge.gif", frames)


def min_nong() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((255, 196, 92), (120, 168, 72))
        draw = ImageDraw.Draw(img)
        sun_y = int(90 + math.sin(t * math.tau) * 10)
        draw.ellipse((720, sun_y, 860, sun_y + 140), fill=(255, 220, 80))
        for col in range(10):
            x = 40 + col * 90
            sway = int(math.sin((t + col * 0.08) * math.tau) * 8)
            draw.polygon(((x, 520), (x + 30 + sway, 300), (x + 60, 520)), fill=(86, 140, 54))
            draw.ellipse((x + 16 + sway, 280, x + 44 + sway, 318), fill=(212, 176, 74))
        frames.append(img)
    save_gif("minnong.gif", frames)


def deng_guan_que_lou() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((255, 140, 90), (88, 48, 96))
        draw = ImageDraw.Draw(img)
        sun_x = int(180 + t * 40)
        draw.ellipse((sun_x, 70, sun_x + 120, 190), fill=(255, 214, 90))
        draw.polygon(((0, 360), (220, 180), (420, 380)), fill=(92, 64, 110))
        draw.polygon(((280, 400), (560, 140), (860, 420)), fill=(72, 48, 96))
        river_y = 430 + int(math.sin(t * math.tau) * 6)
        draw.polygon(((0, river_y), (W, river_y + 20), (W, H), (0, H)), fill=(255, 196, 120))
        draw.rectangle((620, 250, 760, 420), fill=(140, 72, 48))
        draw.polygon(((600, 250), (690, 180), (780, 250)), fill=(168, 84, 52))
        frames.append(img)
    save_gif("dengguanquelou.gif", frames)


def default_bg() -> None:
    frames = []
    for i in range(FRAMES):
        t = i / FRAMES
        img = vertical_gradient((236, 226, 206), (196, 178, 148))
        draw = ImageDraw.Draw(img)
        for n in range(5):
            x = 80 + n * 180
            y = int(180 + math.sin((t + n * 0.2) * math.tau) * 12)
            draw.ellipse((x, y, x + 140, y + 70), fill=(210, 198, 176))
        frames.append(img)
    save_gif("default.gif", frames)


def write_wav(path: Path, freqs: list[float], beat: float = 0.38) -> None:
    rate = 22050
    amplitude = 9000
    samples: list[float] = []
    for f in freqs:
        n = int(rate * beat)
        for i in range(n):
            env = 1.0
            if i < 400:
                env = i / 400
            tail = n - i
            if tail < 1200:
                env *= tail / 1200
            samples.append(math.sin(2 * math.pi * f * i / rate) * env)
        gap = int(rate * 0.06)
        samples.extend([0.0] * gap)
    fade = int(rate * 0.4)
    samples.extend([0.0] * fade)
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(rate)
        packed = b"".join(struct.pack("<h", max(-32767, min(32767, int(s * amplitude)))) for s in samples)
        wf.writeframes(packed)


PENT = {
    "gong": [262, 294, 330, 392, 440, 392, 330, 294],
    "shang": [294, 330, 392, 440, 523, 440, 392, 330],
    "jue": [330, 392, 440, 523, 587, 523, 440, 392],
    "zhi": [392, 440, 523, 587, 659, 587, 523, 440],
    "yu": [440, 523, 587, 659, 784, 659, 587, 523],
    "default": [262, 330, 392, 330, 294, 262, 330, 262],
}


def main() -> None:
    ensure_dirs()
    jing_ye_si()
    chun_xiao()
    yong_e()
    min_nong()
    deng_guan_que_lou()
    default_bg()
    write_wav(MUS_DIR / "jingyesi.wav", PENT["yu"], 0.42)
    write_wav(MUS_DIR / "chunxiao.wav", PENT["shang"], 0.34)
    write_wav(MUS_DIR / "yonge.wav", PENT["jue"], 0.36)
    write_wav(MUS_DIR / "minnong.wav", PENT["gong"], 0.40)
    write_wav(MUS_DIR / "dengguanquelou.wav", PENT["zhi"], 0.38)
    write_wav(MUS_DIR / "default.wav", PENT["default"], 0.40)
    print(f"assets written to {IMG_DIR} and {MUS_DIR}")


if __name__ == "__main__":
    main()
