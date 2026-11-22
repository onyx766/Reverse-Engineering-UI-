"""
Cuts the photoreal assets in src/assets/ref out of the 1672x941 reference render:
  plate-projects.webp  the render minus the live UI (navbar, cards, panel contents)
  room.webp            the render minus all UI, filled, blurred and darkened (every other section)
  card-<name>.webp     flat 261x217 card faces with their text removed (art + arrow kept)
  card-blank.webp      an empty face for studies the render never showed
  nav.webp             the navbar slab (RGBA) with name and links removed

Requires opencv-python and numpy.
Usage: python scripts/ref_plates.py path/to/reference.png [out-dir]
"""
import os
import sys

import cv2
import numpy as np

if len(sys.argv) < 2:
    sys.exit('usage: python scripts/ref_plates.py <reference-render.png> [out-dir]')
ref = cv2.imread(sys.argv[1])
if ref is None or ref.shape[:2] != (941, 1672):
    sys.exit('expected the 1672x941 reference render')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'assets', 'ref')
os.makedirs(OUT, exist_ok=True)


def bar_poly():
    pts = [(232,26),(253,7.5),(507,26)]
    p0, c, p1 = np.array([507,26.]), np.array([866,33.]), np.array([1225,31.])
    for t in np.linspace(0,1,24)[1:]:
        pts.append(tuple((1-t)**2*p0 + 2*(1-t)*t*c + t*t*p1))
    pts += [(1433,6),(1450,19),(1450,83),(1433,98),(1258,110),(1235,97),(520,100),(507,109),(255,106),(232,81)]
    return pts

H, W = ref.shape[:2]
lum = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY).astype(np.float32)

CARDS = {
    -2: [(153, 522), (420, 541), (411, 768), (136, 758)],
    -1: [(443, 546), (697, 551), (695, 772), (434, 770)],
    0: [(716, 555), (977, 555), (978, 772), (715, 772)],
    1: [(999, 551), (1259, 548), (1263, 770), (1004, 773)],
    2: [(1274, 537), (1521, 519), (1541, 760), (1287, 768)],
}
FILTER = [(47, 127), (297, 157), (300, 497), (47, 505)]
ANALYSIS = [(1347, 194), (1619, 164), (1633, 500), (1347, 489)]
CW, CH = 261, 217
NAMES = {-2: 'api', -1: 'binary', 0: 'protocol', 1: 'format', 2: 'reimpl'}


def kernel(r):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def poly_mask(pts, dil=0, shape=(H, W)):
    m = np.zeros(shape, np.uint8)
    cv2.fillPoly(m, [np.round(np.array(pts, np.float32)).astype(np.int32)], 255)
    if dil > 0:
        m = cv2.dilate(m, kernel(dil))
    elif dil < 0:
        m = cv2.erode(m, kernel(-dil))
    return m


def text_mask(img_lum, region, thr_diff=22, thr_abs=125, blur=31, grow=2):
    bg = cv2.medianBlur(np.clip(img_lum, 0, 255).astype(np.uint8), blur).astype(np.float32)
    m = ((img_lum - bg > thr_diff) | (img_lum > thr_abs)).astype(np.uint8) * 255
    m &= region
    if grow:
        m = cv2.dilate(m, kernel(grow))
    return m


def push_pull(img, hole):
    """smooth fill of large holes: masked pyramid down, then fill each level from the one below"""
    img = img.astype(np.float32)
    known = (hole == 0).astype(np.float32)
    levels = []
    I, K = img * known[..., None], known
    while min(I.shape[:2]) > 4:
        levels.append((I, K))
        I = cv2.pyrDown(I)
        K = cv2.pyrDown(K)
    # coarsest: normalise
    acc = I / np.maximum(K[..., None], 1e-6)
    for I, K in reversed(levels):
        up = cv2.resize(acc, (I.shape[1], I.shape[0]), interpolation=cv2.INTER_LINEAR)
        norm = I / np.maximum(K[..., None], 1e-6)
        w = np.clip(K * 1.6, 0, 1)[..., None]
        acc = norm * w + up * (1 - w)
    out = img.copy()
    out[hole > 0] = acc[hole > 0]
    return np.clip(out, 0, 255).astype(np.uint8)


def feather_paste(base, fill, hole, r=4):
    """composite `fill` over `base` inside `hole` with a soft edge"""
    a = cv2.GaussianBlur((hole > 0).astype(np.float32), (0, 0), r)
    a = np.maximum(a, (hole > 0).astype(np.float32))[..., None]
    return np.clip(base * (1 - a) + fill * a, 0, 255).astype(np.uint8)


def soft_inpaint(img, mask, r=5, blur=3):
    """Telea for thin strokes, then soften the patched pixels so no blotches remain"""
    p = cv2.inpaint(img, mask, r, cv2.INPAINT_TELEA)
    if blur:
        b = cv2.GaussianBlur(p, (0, 0), blur)
        p = feather_paste(p, b, cv2.dilate(mask, kernel(1)), 1.5)
    return p


def webp(name, img, q=88):
    cv2.imwrite(os.path.join(OUT, name), img, [cv2.IMWRITE_WEBP_QUALITY, q])


# ---------------------------------------------------------------- card faces
for d, q in CARDS.items():
    src = np.array(q, np.float32)
    dst = np.array([(0, 0), (CW, 0), (CW, CH), (0, CH)], np.float32)
    flat = cv2.warpPerspective(ref, cv2.getPerspectiveTransform(src, dst), (CW, CH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
    fl = cv2.cvtColor(flat, cv2.COLOR_BGR2GRAY).astype(np.float32)
    region = np.zeros((CH, CW), np.uint8)
    cv2.rectangle(region, (12, 78), (CW - 12, CH - 8), 255, -1)
    m = text_mask(fl, region, thr_diff=16, thr_abs=95, blur=41, grow=2)
    pills = text_mask(fl, region, thr_diff=7, thr_abs=255, blur=61, grow=0)
    pill_rows = np.zeros_like(region)
    cv2.rectangle(pill_rows, (12, CH - 46), (CW - 26, CH - 11), 255, -1)
    m |= cv2.dilate(pills & pill_rows, kernel(3))
    clean = soft_inpaint(flat, m, 5, 3)
    webp(f'card-{NAMES[d]}.webp', clean, 92)

# blank face for projects without a reference card (6th study): centre card, art removed too
q = CARDS[0]
flat = cv2.warpPerspective(ref, cv2.getPerspectiveTransform(np.array(q, np.float32), np.array([(0, 0), (CW, 0), (CW, CH), (0, CH)], np.float32)), (CW, CH), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
fl = cv2.cvtColor(flat, cv2.COLOR_BGR2GRAY).astype(np.float32)
region = np.zeros((CH, CW), np.uint8)
cv2.rectangle(region, (12, 8), (CW - 12, CH - 8), 255, -1)
keep_arrow = np.zeros_like(region)
cv2.rectangle(keep_arrow, (CW - 56, 4), (CW - 4, 60), 255, -1)
m = text_mask(fl, region & ~keep_arrow, thr_diff=10, thr_abs=80, blur=41, grow=3)
art = np.zeros_like(region)
cv2.rectangle(art, (12, 6), (CW - 62, 80), 255, -1)
m |= art
blank = push_pull(flat, m)
blank = np.where((art > 0)[..., None], (blank.astype(np.float32) * 0.5).astype(np.uint8), blank)
blank = feather_paste(flat, cv2.GaussianBlur(blank, (0, 0), 3), m, 3)
webp('card-blank.webp', blank, 92)

# ---------------------------------------------------------------- projects plate
big = np.zeros((H, W), np.uint8)
big |= poly_mask(bar_poly(), 5)
for q in CARDS.values():
    big |= poly_mask(q, 8)
small = np.zeros((H, W), np.uint8)
f_in = poly_mask(FILTER, -12)
small |= text_mask(lum, f_in)
small |= poly_mask([(82, 212), (291, 226), (291, 262), (82, 261)], 4)
a_in = poly_mask(ANALYSIS, -12)
small |= text_mask(lum, a_in)
small |= poly_mask([(1368, 280), (1597, 262), (1597, 283), (1368, 299)], 4)

plate = soft_inpaint(ref, small, 6, 2)
filled = push_pull(plate, big)
filled = (filled.astype(np.float32) * 0.7).astype(np.uint8)
plate = feather_paste(plate, filled, big, 3)
webp('plate-projects.webp', plate, 90)

# ---------------------------------------------------------------- room for every other section
hole = big.copy()
hole |= poly_mask(FILTER, 12)
hole |= poly_mask(ANALYSIS, 12)
for q in [
    [(360, 145), (635, 196), (632, 360), (360, 340)],
    [(320, 342), (583, 357), (581, 478), (320, 480)],
    [(1004, 117), (1218, 117), (1215, 282), (1004, 284)],
    [(1085, 255), (1328, 252), (1325, 418), (1085, 418)],
    [(1080, 412), (1322, 412), (1322, 470), (1080, 470)],
    [(690, 815), (995, 815), (995, 865), (690, 865)],
    [(62, 590), (130, 590), (130, 655), (62, 655)],
    [(1544, 590), (1612, 590), (1612, 655), (1544, 655)],
]:
    hole |= poly_mask(q, 5)
room = push_pull(ref, hole)
room = feather_paste(ref, room, hole, 6)
room = cv2.GaussianBlur(room, (0, 0), 7)
# darker and a touch cooler so text on top stays readable
room = np.clip(room.astype(np.float32) * 0.72, 0, 255).astype(np.uint8)
small_room = cv2.resize(room, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
webp('room.webp', small_room, 86)

# ---------------------------------------------------------------- navbar slab (RGBA)
X0, Y0, NW, NH = 228, 0, 1228, 118
crop = ref[Y0:Y0 + NH, X0:X0 + NW].copy()
cl = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY).astype(np.float32)
poly = [(x - X0, y - Y0) for x, y in bar_poly()]
alpha = poly_mask(poly, 4, (NH, NW))
alpha = cv2.GaussianBlur(alpha.astype(np.float32), (0, 0), 1.2)
region = np.zeros((NH, NW), np.uint8)
cv2.rectangle(region, (335 - X0, 30), (522 - X0, 110), 255, -1)    # name + subtitle
cv2.rectangle(region, (560 - X0, 50), (1226 - X0, 100), 255, -1)   # links + underline
nm = text_mask(cl, region, thr_diff=20, thr_abs=110, blur=31, grow=2)
crop = soft_inpaint(crop, nm, 5, 2)
rgba = np.dstack([crop, np.clip(alpha, 0, 255).astype(np.uint8)])
cv2.imwrite(os.path.join(OUT, 'nav.webp'), rgba, [cv2.IMWRITE_WEBP_QUALITY, 92])
print('ok')
