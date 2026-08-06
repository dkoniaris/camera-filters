#!/usr/bin/env python3
"""Generate a 512x512 app icon (gradient + camera glyph) as pure PNG, no deps."""
import zlib, struct, math

W = H = 512

def lerp(a, b, t): return a + (b - a) * t

def px(x, y):
    # rounded-square background gradient (pink -> purple, diagonal)
    t = (x + y) / (W + H)
    r, g, b = lerp(255, 123, t), lerp(45, 47, t), lerp(120, 247, t)
    # rounded corner mask
    rad = 100
    cx = min(x, W - 1 - x); cy = min(y, H - 1 - y)
    if cx < rad and cy < rad:
        d = math.hypot(rad - cx, rad - cy)
        if d > rad:
            return 11, 11, 18  # outside -> bg
    # camera glyph (white)
    in_body = (118 <= x <= 394) and (196 <= y <= 356)
    in_bump = (214 <= x <= 298) and (160 <= y <= 212)
    lens_c = (256, 276)
    in_lens = math.hypot(x - lens_c[0], y - lens_c[1]) <= 78
    in_lens2 = math.hypot(x - lens_c[0], y - lens_c[1]) <= 56
    white = (252, 252, 255)
    if (in_body and not in_lens2) or in_bump or (in_lens and not in_lens2):
        # soften glyph edges slightly
        return white
    if in_lens2:
        return 46, 26, 84  # dark lens
    # sparkle star
    if 392 <= x <= 420 and 150 <= y <= 178:
        if abs(x - 406) + abs(y - 164) <= 14:
            return 255, 208, 45
    return int(r), int(g), int(b)

rows = []
for y in range(H):
    row = bytearray([0])  # filter type 0
    for x in range(W):
        r, g, b = px(x, y)
        row += bytes((r, g, b))
    rows.append(bytes(row))

def chunk(tag, data):
    return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data))

png = b'\x89PNG\r\n\x1a\n'
png += chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(b''.join(rows), 9))
png += chunk(b'IEND', b'')

with open('icon.png', 'wb') as f:
    f.write(png)
print('icon.png written:', len(png), 'bytes')
