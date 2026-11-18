"""Build the local audit gallery/coverage and verify artifacts; never edits product source."""
from pathlib import Path
import json, hashlib, html, re, struct, zlib
from collections import Counter
from datetime import datetime, timezone

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
def read(name): return json.loads((BASE / name).read_text(encoding='utf-8'))
def write(name, value): (BASE / name).write_text(value, encoding='utf-8')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def image_name(v): return str(v).replace('\\', '/').split('/')[-1]
def link_img(v):
    n = image_name(v)
    return f'[{n}](screenshots/{n})' if n else '—'

boards = read('evidence/boards-browser.json')['boards']
parts = read('evidence/components-browser.json')['components']
lessons = read('evidence/lessons-all.json')['cases']
mobile = read('evidence/mobile-routes.json')['pages']
desktop = read('evidence/route-smoke-desktop.json')['pages']
shots = sorted((BASE / 'screenshots').glob('*.png'))
counts = {'boards':len(boards),'boardViewers':sum(bool(x['hasCanvas']) for x in boards),
          'parts':len(parts),'part3D':sum(bool(x['has3d']) for x in parts),
          'lessonCases':len(lessons),'lessons':len({x['id'] for x in lessons}),
          'desktopRouteSmoke':len(desktop),'mobileRouteSmoke':len(mobile),'screenshots':len(shots)}

lines = ['# Ma trận bao phủ audit Mạch Mở', '',
         'Ngày 16–17/11/2026 · Task MM-SW-USER-AUDIT-20261116. TESTED nghĩa là đã thực hiện đúng hành trình ghi ở bằng chứng; không có nghĩa mọi tổ hợp đầu vào/đặc tính vật lý đã được kiểm.', '',
         '[Báo cáo](report.md) · [Gallery ảnh](gallery.html) · [Finding](findings.json)', '',
         '## Route smoke desktop', '', '| Route | Ảnh |', '|---|---|',
         '| / | [Trang chủ](screenshots/001-home-desktop.png) |']
for x in desktop: lines.append(f"| `{x['route']}` | {link_img(x['file'])} |")
lines += ['', '## Mobile 375×812', '',
          'Không thấy document tràn ngang ở 20 route mẫu. Chiều cao/nested scroll dưới đây là số đo snapshot, không phải tiêu chí PASS UX.', '',
          '| Route | Document W×H CSS px | Vùng cuộn | Ảnh |', '|---|---:|---:|---|']
for x in mobile:
    m=x['metrics']; lines.append(f"| `{x['route']}` | {m['docWidth']}×{m['docHeight']} | {len(m['scrollAreas'])} | {link_img(x['file'])} |")
lines += ['', '## Toàn bộ 28 hồ sơ board', '',
          'VIEWER_TESTED = render canvas/scene và đọc profile; LOOKUP_TESTED = không có viewer, đã xác nhận giới hạn. Thêm scene ESP32 LED đã mở và chụp riêng: [ảnh](screenshots/board-esp32-extra-led-scene.png). Pin picking mọi pad và xác nhận vật lý vẫn NOT_RUN.', '',
          '| Board | Trạng thái | Ảnh |', '|---|---|---|']
for x in boards: lines.append(f"| {x['name']} | {'VIEWER_TESTED' if x['hasCanvas'] else 'LOOKUP_TESTED'} | {link_img(x['file'])} |")
lines += ['', '## Toàn bộ 59 thẻ linh kiện', '',
          'Đã mở từng card/2D; 45 card có GLB được chuyển sang 3D và render. 14 card MCU thuộc luồng board; không tự coi có thêm 14 GLB component độc lập. Không đo footprint/vị trí mọi chân.', '',
          '| ID / tên | Thao tác | Ảnh 2D | Ảnh 3D |', '|---|---|---|---|']
for x in parts: lines.append(f"| `{x['id']}` · {x['name']} | {'2D + 3D render' if x['has3d'] else '2D/profile; 3D theo board'} | {link_img(x['image2d'])} | {link_img(x.get('image3d','')) if x.get('image3d') else '—'} |")
lines += ['', '## Bài học', '',
          '44 case = 11 bài × breadboard/schematic/3D/run trên target được ghi trong JSON. Run là đã vào/thử trạng thái chạy theo case; không xác nhận mọi branch, mức input, board target hay tiêu chí sư phạm. Bài khái niệm không được gọi là solver/firmware.', '',
          '| Bài | View/case và ảnh |', '|---|---|']
for lid in dict.fromkeys(x['id'] for x in lessons):
    cases=[x for x in lessons if x['id']==lid]
    lines.append(f"| `{lid}` | "+' · '.join(f"{x['view']}: {link_img(x['screenshot'])}" for x in cases)+' |')
lines += ['', '## Các hành trình còn lại', '', '| Nhóm | Đã thử | Giới hạn / bằng chứng |', '|---|---|---|',
 '| Freestyle | 8 board, 4 view, 4 mẫu, trace, dây click/drag/keyboard, draft JSON | [6 board](evidence/freestyle-boards.json), [2 STM32 + Uno compiler](evidence/freestyle-remaining-and-compile.json), [mẫu](evidence/freestyle-samples.json), [drag A/B sạch](evidence/wire-drag-fresh-comparison.json), [keyboard](evidence/keyboard-pin-pin.json). Nano/Mega compile chưa chờ hoàn tất. |',
 '| Board/copper | 4 board F.Cu/B.Cu, net GND, vùng đồng, fit | [Viewers](evidence/copper-viewers.json), [layout](evidence/copper-layout.json). Không suy copper ra net điện workspace. |',
 '| Sketch | 5 ví dụ, 8 target, button/slider, invalid syntax | [14 case](evidence/sketch-cases.json). Interpreter subset, không chạy ngoại vi mạng. |',
 '| Firmware | AVR samples, target-confirmation, Pico, invalid file, CSV | [Evidence](evidence/firmware-cases.json). Không flash thiết bị/không UF2 tùy ý. |',
 '| SPICE | .op/.tran/.ac/.dc, LED, CSV, .include, nhập KiCad XML+IPC | [Analyses](evidence/spice-cases.json), [CAD import](evidence/spice-cad-import.json), [ảnh solver](screenshots/spice-cad-import-solver.png). Cursor/probe interactive chưa đủ bằng chứng, không đánh PASS. |',
 '| Calculators | 4 bộ tính, default/0/âm/rỗng, handoff | [Evidence](evidence/calculators-and-robot.json). Chưa thử mọi miền số. |',
 '| Project | Save/export/import, duplicate/rename/tags/delete bản thử, mở project riêng, bad JSON | [Import](evidence/project-isolated-import.json), [Open](evidence/project-open-and-extra-scene.json), [rename](screenshots/project-isolated-rename-tags.png), [delete](screenshots/project-isolated-delete-copy.png). Quota/eviction/crash/restore từng revision NOT_RUN. |',
 '| Kit | 8 trạm, 0 trạm, JSON/share/CSV roundtrip, bad JSON | [Evidence](evidence/kit-cases.json). Override UI/legacy mapping chưa đi hết; unit v1/v2 đã chạy. |',
 '| Community | Local Markdown/ảnh/.ino, 6-file reject, reload/download, comment/report/filter/search | [Attachments](evidence/community-attachments.json), [post/guide](evidence/community-and-guide.json). Online/RLS/moderation NOT_RUN, Supabase chưa cấu hình. |',
 '| Feedback | Empty validation, review, file download | [Evidence](evidence/feedback-and-community.json). Clipboard/email sending NOT_RUN. |',
 '| Bot | 10 câu, source/unknown handling, 3D, reduced-motion | [Queries](evidence/community-and-guide.json), [reduced motion](evidence/mobile-interaction.json). Không phải AI từ xa. |',
 '| Tour/theme | 7 tour, 34 bước, desktop/mobile; 3 theme | [Tours](evidence/tours.json), [theme](evidence/critical-route-and-theme.json). Theme không audit lại mọi màn. |',
 '| Robot | 6 lệnh/tình huống + checklist 3/3 | [Evidence](evidence/calculators-and-robot.json). Chỉ minh họa khái niệm. |',
 '| Accessibility | axe 6 màn, keyboard pin-pin và vài control | [axe](evidence/axe-sample.json), [keyboard](evidence/keyboard-pin-pin.json). Screen reader/physical touch/cross-browser NOT_RUN. |',
 '| Auth/admin/offline | Đọc route và trạng thái kết nối | Login/admin online, offline SW và remote services NOT_RUN. Không thao tác tài khoản hoặc thiết bị thật. |',
 '', '## Lỗi công cụ và case không dùng làm bằng chứng kết luận', '',
 '- Timeout locator theo accessible name hoặc phần tử bị ẩn không tự được tính là lỗi sản phẩm. Một số macro bị ngắt nên chỉ còn ảnh, đã nêu riêng thay vì bịa kết quả JSON.',
 '- `wire-drag-comparison.json` có clickStart tồn dư: không dùng làm bằng chứng chính; dùng `wire-drag-fresh-comparison.json` A/B sạch.',
 '- `spice-cad-final.json` ghi probe NOT_RUN do không match accessible button; ảnh solver/điện áp quan sát được vẫn hợp lệ. Không đánh probe/cursor PASS.',
 '- Vài ảnh locator copper/profile bị clipping do nested scroll. Dùng `copper-mega-svg.png` cùng layout JSON để đánh giá vùng đồng.',
 '- Unit test 4 ca compiler đỏ vì môi trường Arduino trong sandbox; log đầy đủ được giữ, không skip/assertion edit.',
 '- 12 board lookup-only và các model tham số/reconstruction không bị tính là asset lỗi chỉ vì chưa có CAD/solver/firmware.', '']
write('coverage.md','\n'.join(lines))

def group(n):
    if n.startswith(('issue-','fresh-drag','wire-')): return 'Lỗi và dây'
    if n.startswith('mobile-'): return 'Mobile'
    if n.startswith('component-'): return 'Linh kiện'
    if n.startswith(('board-','copper-','s3-')): return 'Board và copper'
    if n.startswith(('lesson-','robot-')): return 'Bài học'
    if n.startswith('freestyle-'): return 'Freestyle'
    if n.startswith(('spice-','calculator-','sketch-','firmware-','avr-','pico-')): return 'Công cụ'
    if n.startswith(('guide-','tour-','theme-')): return 'Hướng dẫn'
    if n.startswith(('community-','project-','kit-','feedback-')): return 'Lưu và chia sẻ'
    return 'Tổng quan'
cards=[]
for p in shots:
    name=html.escape(p.name); g=group(p.name)
    cards.append(f'<article data-group="{html.escape(g)}" data-name="{name.lower()}"><a href="screenshots/{name}" target="_blank" rel="noopener"><img loading="lazy" src="screenshots/{name}" alt="{name}"></a><p>{name}</p><small>{html.escape(g)}</small></article>')
groups=''.join(f'<option>{html.escape(g)}</option>' for g in sorted({group(p.name) for p in shots}))
gallery='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mạch Mở · Gallery audit</title>
<style>body{margin:0;background:#f8f3e8;color:#18243d;font:16px/1.5 system-ui,sans-serif}header{padding:24px;position:sticky;top:0;background:#f8f3e8f5;z-index:2;border-bottom:1px solid #d4c7ad}h1{font-size:24px;margin:0 0 8px}p{margin:8px 0}a{color:#087b80}input,select{font:inherit;padding:10px;border:1px solid #a9a18d;border-radius:6px;max-width:100%;box-sizing:border-box}input{width:440px}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:16px;padding:24px}article{background:#fffaf1;border:1px solid #dacdb5;border-radius:10px;padding:12px;overflow:hidden}article img{width:100%;height:230px;object-fit:contain;background:#eee8dc}article p{overflow-wrap:anywhere;font-size:13px}small{color:#6b6152}[hidden]{display:none!important}</style>
<header><h1>Mạch Mở — ảnh audit người dùng thật</h1><p>__COUNTS__ · 16–17/11/2026 · <a href="report.md">Báo cáo</a> · <a href="coverage.md">Coverage</a></p><p>Ảnh nguyên bản; click để mở đầy đủ. Có cả case đúng, lỗi và giới hạn. Không suy verdict chỉ từ tên ảnh.</p><input id="q" type="search" aria-label="Tìm ảnh" placeholder="Tìm: capacitor, button, mobile, pico…"> <select id="g" aria-label="Nhóm ảnh"><option value="">Tất cả nhóm</option>__GROUPS__</select> <span id="count" role="status"></span></header><main>__CARDS__</main>
<script>const q=document.querySelector('#q'),g=document.querySelector('#g'),c=document.querySelector('#count'),cards=[...document.querySelectorAll('article')];function filter(){let n=0;const s=q.value.toLowerCase();for(const x of cards){x.hidden=!(x.dataset.name.includes(s)&&(!g.value||x.dataset.group===g.value));if(!x.hidden)n++}c.textContent=n+' / '+cards.length+' ảnh'}q.addEventListener('input',filter);g.addEventListener('change',filter);filter();</script></html>'''
write('gallery.html',gallery.replace('__COUNTS__',f"{len(shots)} ảnh · 28 board · 59 thẻ linh kiện").replace('__GROUPS__',groups).replace('__CARDS__','\n'.join(cards)))

before=read('snapshot-before.json')
paths=[]
for d in ['src','public/models','public/cad','e2e']:
    paths += [p for p in (ROOT/d).rglob('*') if p.is_file()] if (ROOT/d).exists() else []
paths += [ROOT/p for p in ['package.json','playwright.config.mjs','README.md']]
hashes={p.relative_to(ROOT).as_posix():sha(p) for p in sorted(paths)}
changed=[p for p,h in before['hashes'].items() if hashes.get(p)!=h]
added=sorted(set(hashes)-set(before['hashes']))
after={'at':datetime.now(timezone.utc).isoformat(),'hashes':hashes,'changedSinceBefore':changed,'addedSinceBefore':added}
write('snapshot-after.json',json.dumps(after,ensure_ascii=False,indent=2)+'\n')

def png_info(p):
    data=p.read_bytes(); assert data[:8]==b'\x89PNG\r\n\x1a\n',p
    pos=8; width,height=struct.unpack('>II',data[16:24]); end=False
    while pos<len(data):
        length=struct.unpack('>I',data[pos:pos+4])[0];typ=data[pos+4:pos+8];chunk=data[pos+8:pos+8+length]
        stored=struct.unpack('>I',data[pos+8+length:pos+12+length])[0]
        assert zlib.crc32(typ+chunk)&0xffffffff==stored,p
        pos+=length+12
        if typ==b'IEND':end=True;break
    assert end and pos==len(data),p
    return {'width':width,'height':height,'crcValid':True}

bad_links=[]
for name in ['report.md','coverage.md']:
    for target in re.findall(r'\]\(([^)]+)\)',(BASE/name).read_text(encoding='utf-8')):
        if target.startswith(('http:','https:','#')):continue
        if not (BASE/target.split('#')[0]).exists():bad_links.append({'document':name,'target':target})
source_bad=[]
for f in read('findings.json')['findings']:
    for s in f['source']:
        file=re.sub(r':\d+$','',s)
        if not (ROOT/file).exists():source_bad.append(s)
        elif re.search(r':\d+$',s):
            line=int(s.rsplit(':',1)[1]); assert line<=len((ROOT/file).read_text(encoding='utf-8').splitlines()),s
image_data=[{'file':p.relative_to(BASE).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p),**png_info(p)} for p in shots]
result={'at':datetime.now(timezone.utc).isoformat(),'counts':counts,'sourceFilesChecked':len(hashes),'sourceChanged':changed,'sourceAdded':added,'brokenReportLinks':bad_links,'missingSourceReferences':source_bad,'pngChecked':len(image_data),'pngAllCrcValid':True}
write('artifact-check.json',json.dumps(result,ensure_ascii=False,indent=2)+'\n')
files=[{'file':p.relative_to(BASE).as_posix(),'bytes':p.stat().st_size,'sha256':sha(p)} for p in sorted(BASE.rglob('*')) if p.is_file() and p.name!='artifact-index.json']
write('artifact-index.json',json.dumps({'at':result['at'],'files':files,'screenshots':image_data,'limits':'Hashes are snapshot evidence; this manifest excludes itself.'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
