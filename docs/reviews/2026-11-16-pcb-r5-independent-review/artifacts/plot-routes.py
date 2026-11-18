"""Review diagram from extracted PCB data; does not render or modify a design file."""
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle

ROOT = Path(__file__).resolve().parents[1]
boards = json.loads((ROOT/'artifacts/board-analysis.json').read_text())
routes = json.loads((ROOT/'artifacts/route-measurements.json').read_text())['routes']
panels = [
    ('handset', ['U1', 'C2', 'C3'], [('U1.1','C2.1'), ('U1.1','C3.1')],
     (18.5, 32.0, 57.3, 66.5), 'Handset: VOUT to output capacitors'),
    ('robot', ['U6', 'R28'], [('U6.6','R28.1')],
     (77.3, 85.2, 17.3, 28.3), 'Robot: BISEN to current shunt'),
]
fig, axes = plt.subplots(1, 2, figsize=(13, 7), layout='constrained')
for ax, (board, refs, pairs, limits, title) in zip(axes, panels):
    data=boards[board]
    ax.set_facecolor('#faf7ef')
    for t in data['tracks']:
        if t.get('via'): continue
        xs=[t['start'][0],t['end'][0]]; ys=[t['start'][1],t['end'][1]]
        ax.plot(xs, ys, color='#c7c9c6', lw=.6, zorder=0)
    for f in data['footprints']:
        if f['ref'] not in refs: continue
        ax.annotate(f['ref'], f['xy'], xytext=(7, 11), textcoords='offset points',
                    fontsize=10, weight='bold', color='#142b3b')
        for p in f['pads']:
            w,h=p['size']
            if round(f['rotation'])%180: w,h=h,w
            x,y=p['xy']
            ax.add_patch(Rectangle((x-w/2,y-h/2),w,h,facecolor='#dbb86e',
                                   edgecolor='#8a6b32',lw=.8,zorder=2))
            ax.text(x,y,p['pin'],ha='center',va='center',fontsize=7,zorder=5,clip_on=True)
    messages=[]
    for color, pair in zip(['#bf352e','#007e87'],pairs):
        r=next(r for r in routes if r['board']==board and (r['from'],r['to'])==pair)
        for t in r['route']:
            if t.get('via'):
                ax.add_patch(Circle(t['xy'],.17,facecolor='white',edgecolor=color,lw=2,zorder=6))
            else:
                ax.plot([t['start'][0],t['end'][0]],[t['start'][1],t['end'][1]],
                        color=color,ls='-' if t['layer']=='F.Cu' else '--',lw=2.7,zorder=4)
        messages.append(f"{r['from']} -> {r['to']}: track {r['trackPathMm']:.2f} mm; "
                        f"pad centres {r['straightMm']:.3f} mm; {r['vias']} vias")
    ax.set_title(title,fontsize=12,weight='bold',pad=14)
    ax.set_xlim(*limits[:2]);ax.set_ylim(limits[3],limits[2]);ax.set_aspect('equal')
    ax.set_xlabel('PCB X (mm)');ax.set_ylabel('PCB Y (mm)')
    ax.grid(alpha=.2)
    ax.text(0,-.17,'\n'.join(messages),transform=ax.transAxes,fontsize=9,va='top')
fig.suptitle('r5 actual connected tracks: proximity does not imply a short route',fontsize=15)
fig.supxlabel('Solid = F.Cu | Dashed = B.Cu | Circle = via | Grey = other tracks\n'
              'Shortest track path; pad interiors/via barrels excluded; no plane or physical measurement.',fontsize=10)
fig.savefig(ROOT/'images/route-detours.png',dpi=180)
plt.close(fig)
print('Saved images/route-detours.png')
