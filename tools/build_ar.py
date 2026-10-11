"""Build ar.html (Arabic, right to left) from haseeb.html.

Run from the repo root after any change to haseeb.html:  python tools/build_ar.py
English -> Arabic strings live in tools/ar-strings.json (keys are the exact English text nodes /
attribute values). The script prints any English text left untranslated; merchant names and raw
statement lines are expected to stay in Latin script.
"""
import json, re
SRC = 'haseeb.html'
OUT = 'ar.html'
MAP = json.load(open('tools/ar-strings.json', encoding='utf-8'))

s = open(SRC, encoding='utf-8').read()
keep = []
def protect(html):
    keep.append(html); return '\x00%d\x00' % (len(keep) - 1)

def rep(old, new, count=1):
    global s
    n = s.count(old); assert n == count, (n, old[:80]); s = s.replace(old, new)

# ---- head ----
rep('<html lang="en" data-theme="light">', '<html lang="ar" dir="rtl" data-theme="light">')
rep('<link rel="canonical" href="https://haseeb.app/" />', '<link rel="canonical" href="https://haseeb.app/ar" />')
rep('<meta property="og:url" content="https://haseeb.app/" />', '<meta property="og:url" content="https://haseeb.app/ar" />\n<meta property="og:locale" content="ar_KW" />')
rep('family=Noto+Sans+Arabic:wght@400;500;600', 'family=Noto+Sans+Arabic:wght@400;500;600;700')

# ---- language switches and bilingual labels: the second language on the Arabic page is English ----
rep('<a class="langlink" href="ar.html" hreflang="ar" lang="ar" title="النسخة العربية">العربية</a>',
    protect('<a class="langlink en" href="haseeb.html" hreflang="en" lang="en" title="English version">English</a>'))
rep('    <a href="ar.html" hreflang="ar" lang="ar">العربية</a>\n', '    ' + protect('<a href="haseeb.html" hreflang="en" lang="en">English</a>') + '\n')
rep('<b aria-current="page">English</b><a href="ar.html" hreflang="ar" lang="ar">العربية</a>',
    protect('<b aria-current="page">العربية</b><a href="haseeb.html" hreflang="en" lang="en">English</a>'))
rep('<p class="hero-ar"><span class="ar" dir="rtl" lang="ar">حسيب · محاسبة ذكية للكويت</span></p>',
    '<p class="hero-ar">' + protect('<span class="alt" dir="ltr" lang="en">Haseeb · Smart accounting for Kuwait</span>') + '</p>')
def swap(m):
    return '<span>' + m.group(2) + '</span>' + protect('<span class="alt" dir="ltr" lang="en">' + m.group(1) + '</span>')
s, n = re.subn(r'<span>([^<]+)</span><span class="ar" dir="rtl" lang="ar">([^<]+)</span>', swap, s)
print('label swaps', n)

# ---- translate text nodes (outside script/style) and attributes ----
head, body = s.split('<body>', 1)
def tx(m):
    raw = m.group(1); k = raw.strip()
    if k in MAP: return '>' + raw.replace(k, MAP[k]) + '<'
    return m.group(0)
def tr_html(h):
    parts = re.split(r'(<script[\s\S]*?</script>|<style[\s\S]*?</style>)', h)
    for i in range(0, len(parts), 2):
        parts[i] = re.sub(r'>([^<>]+)<', tx, parts[i])
        parts[i] = re.sub(r'\b(aria-label|alt|placeholder|title|content)="([^"]*)"',
                          lambda m: '%s="%s"' % (m.group(1), MAP.get(m.group(2), m.group(2))), parts[i])
    return ''.join(parts)
s = tr_html(head) + '<body>' + tr_html(body)
s = re.sub('\x00(\\d+)\x00', lambda m: keep[int(m.group(1))], s)

# mono spans that now hold Arabic words (dates, "د.ك") read right to left; numbers-only spans stay LTR via CSS
def monodir(m):
    tag, attrs, txt = m.group(1), m.group(2), m.group(3)
    if ' dir=' in attrs or not re.search('[؀-ۿ]', txt): return m.group(0)
    return '<%s%s dir="rtl">%s<' % (tag, attrs, txt)
s = re.sub(r'<(\w+)((?:\s[^>]*)?\sclass="[^"]*mono[^"]*"[^>]*)>([^<]*)<', monodir, s)
AR = re.compile('[\u0600-\u06FF]')
n = 0
def f(m):
    global n
    tag, attrs, txt = m.group(1), m.group(2), m.group(3)
    if 'dir=' in attrs or not AR.search(txt):
        return m.group(0)
    n += 1
    return '<%s%s dir="rtl">%s<' % (tag, attrs, txt)
s = re.sub(r'<(\w+)(\s[^>]*?class="[^"]*\bmono\b[^"]*"[^>]*)>([^<]*)<', f, s)
print('marked', n)
open(OUT, 'w', encoding='utf-8', newline='').write(s)

# leftovers: English text nodes still on the page (names on statements are expected)
left = set()
b = s.split('<body>', 1)[1]
b = re.sub(r'<script[\s\S]*?</script>', '', b)
b = re.sub(r'<span class="alt"[^>]*>[^<]*</span>', '', b)
for t in re.findall(r'>([^<>]+)<', b):
    t = t.strip()
    if re.search('[A-Za-z]{3,}', t): left.add(t)
print(sorted(left))
