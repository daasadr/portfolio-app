"""Builds the 1200x630 link-preview image for Portfolio Paradise.
Usage: python scripts/make-og-image.py . public/og-image-cs.jpg cs   (needs Pillow + Windows Segoe UI fonts)
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

root, out, lang = sys.argv[1], sys.argv[2], sys.argv[3]
W, H = 1200, 630
FONTS = 'C:/Windows/Fonts/'

TEXT = {
    'cs': ('Online portfolio pro děti', 'na domácím vzdělávání',
           ['Portfolio', 'Čtenářský deník', 'Cíle a sny', 'Bobříci']),
    'en': ('An online portfolio for', 'home-educated children',
           ['Portfolio', 'Reading diary', 'Goals & dreams', 'Beavers']),
}[lang]

# Background: the app's own paradise image, cover-cropped and softly blurred
bg = Image.open(f'{root}/public/images/paradise-bg.webp').convert('RGB')
scale = max(W / bg.width, H / bg.height)
bg = bg.resize((round(bg.width * scale), round(bg.height * scale)), Image.LANCZOS)
left, top = (bg.width - W) // 2, (bg.height - H) // 2
bg = bg.crop((left, top, left + W, top + H)).filter(ImageFilter.GaussianBlur(2))
img = bg.convert('RGBA')

# Frosted card
card = Image.new('RGBA', (W, H), (0, 0, 0, 0))
cd = ImageDraw.Draw(card)
cx0, cy0, cx1, cy1 = 90, 80, W - 90, H - 80
shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle((cx0 + 6, cy0 + 12, cx1 + 6, cy1 + 12), 40, fill=(30, 20, 60, 90))
img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(18)))
cd.rounded_rectangle((cx0, cy0, cx1, cy1), 40, fill=(255, 255, 255, 228))
img = Image.alpha_composite(img, card)
d = ImageDraw.Draw(img)

# Logo — the favicon's book + star, drawn large
lx, ly, ls = 150, 135, 120
grad = Image.new('RGBA', (ls, ls))
gd = ImageDraw.Draw(grad)
for i in range(ls * 2):
    t = i / (ls * 2 - 1)
    c = tuple(round(a + (b - a) * t) for a, b in zip((0x7C, 0x3A, 0xED), (0xEC, 0x48, 0x99)))
    gd.line([(i, 0), (0, i)], fill=c + (255,))
mask = Image.new('L', (ls, ls), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, ls - 1, ls - 1), 26, fill=255)
img.paste(grad, (lx, ly), mask)
u = ls / 32
d.rounded_rectangle((lx + 7 * u, ly + 12 * u, lx + 14.5 * u, ly + 23 * u), 4, fill=(255, 255, 255, 242))
d.rounded_rectangle((lx + 17.5 * u, ly + 12 * u, lx + 25 * u, ly + 23 * u), 4, fill=(255, 255, 255, 205))
d.rounded_rectangle((lx + 15 * u, ly + 11 * u, lx + 17 * u, ly + 24 * u), 4, fill=(255, 255, 255, 255))
star = [(16, 3.5), (17, 6.5), (20.2, 6.5), (17.6, 8.4), (18.6, 11.4), (16, 9.5), (13.4, 11.4), (14.4, 8.4), (11.8, 6.5), (15, 6.5)]
d.polygon([(lx + x * u, ly + y * u) for x, y in star], fill=(0xFC, 0xD3, 0x4D, 255))

title_font = ImageFont.truetype(FONTS + 'segoeuib.ttf', 76)
sub_font = ImageFont.truetype(FONTS + 'seguisb.ttf', 40)
chip_font = ImageFont.truetype(FONTS + 'seguisb.ttf', 26)
url_font = ImageFont.truetype(FONTS + 'segoeui.ttf', 28)

tx = lx + ls + 40
d.text((tx, ly - 4), 'Portfolio Paradise', font=title_font, fill=(31, 41, 55))
d.text((tx, ly + 92), TEXT[0], font=sub_font, fill=(91, 33, 182))
d.text((tx, ly + 142), TEXT[1], font=sub_font, fill=(91, 33, 182))

# Feature chips
chip_colors = [((224, 242, 254), (3, 105, 161)), ((255, 228, 230), (190, 18, 60)),
               ((237, 233, 254), (109, 40, 217)), ((204, 251, 241), (15, 118, 110))]
x, y = 150, 400
for label, (bgc, fg) in zip(TEXT[2], chip_colors):
    w = d.textlength(label, font=chip_font) + 44
    d.rounded_rectangle((x, y, x + w, y + 52), 26, fill=bgc + (255,))
    d.text((x + 22, y + 9), label, font=chip_font, fill=fg)
    x += w + 16

d.text((150, 482), 'portfolioparadise.eu', font=url_font, fill=(107, 114, 128))

img.convert('RGB').save(out, 'JPEG', quality=86, optimize=True, progressive=True)  # small: WhatsApp skips large previews
print('saved', out, img.size)
