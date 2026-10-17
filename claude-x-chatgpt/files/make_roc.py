"""Accurate ROC/AUC animation, 10 s, 1280x720, 30 fps.
Every number on screen is computed from the simulated scores below."""
import numpy as np, matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import animation, font_manager as fm

OUT = "roc_accurate.mp4"
for f in fm.findSystemFonts():
    if "Inter" in f: fm.fontManager.addfont(f)
plt.rcParams.update({"font.family": "Inter", "text.color": "#e6edf6",
                     "axes.labelcolor": "#9fb0c8", "xtick.color": "#7f90a8",
                     "ytick.color": "#7f90a8"})

# ---- data: a churn classifier's scores (fixed seed, reproducible) ----
rng = np.random.default_rng(7)
neg = np.clip(rng.normal(0.38, 0.12, 4000), 0, 1)   # customers who stayed
pos = np.clip(rng.normal(0.64, 0.12, 1000), 0, 1)   # customers who churned
y = np.r_[np.zeros_like(neg), np.ones_like(pos)]
s = np.r_[neg, pos]

thr_grid = np.linspace(1.0, 0.0, 401)               # high -> low threshold
tpr = np.array([(pos >= t).mean() for t in thr_grid])
fpr = np.array([(neg >= t).mean() for t in thr_grid])
auc_trap = np.trapezoid(tpr, fpr)
# exact AUC = P(score_pos > score_neg) (Mann-Whitney), ties count half
order = np.argsort(s); ranks = np.empty_like(order, float); ranks[order] = np.arange(1, len(s)+1)
auc_mw = (ranks[y == 1].sum() - len(pos)*(len(pos)+1)/2) / (len(pos)*len(neg))
assert abs(auc_trap - auc_mw) < 0.002, (auc_trap, auc_mw)
AUC = auc_mw
assert tpr.max() <= 1 and fpr.max() <= 1 and tpr.min() >= 0
print(f"AUC trapezoid={auc_trap:.4f}  Mann-Whitney={auc_mw:.4f}")

# ---- style ----
BG, GRID, NEG_C, POS_C, ACC = "#0a1120", "#1b2a40", "#5b8def", "#2ee6c4", "#ffd166"
FPS, T = 30, 10
N = FPS * T
fig = plt.figure(figsize=(12.8, 7.2), dpi=100, facecolor=BG)
axD = fig.add_axes([0.06, 0.17, 0.40, 0.58], facecolor=BG)
axR = fig.add_axes([0.57, 0.12, 0.36, 0.64], facecolor=BG)
for ax in (axD, axR):
    for sp in ax.spines.values(): sp.set_color(GRID)
    ax.tick_params(labelsize=11)
    ax.grid(color=GRID, lw=0.8)

title = fig.text(0.06, 0.90, "How good is the churn model?", fontsize=30, weight="bold")
sub = fig.text(0.06, 0.845, "The ROC curve traces every possible decision threshold",
               fontsize=15, color="#9fb0c8")

# distributions
bins = np.linspace(0, 1, 51)
axD.hist(neg, bins, density=True, color=NEG_C, alpha=0.55, label="Stayed (4,000)")
axD.hist(pos, bins, density=True, color=POS_C, alpha=0.55, label="Churned (1,000)")
axD.set_xlim(0, 1); axD.set_yticks([])
axD.set_xlabel("Model score (predicted churn risk)", fontsize=13)
axD.set_ylim(0, axD.get_ylim()[1]*1.22)
axD.legend(loc="lower left", bbox_to_anchor=(0, 1.0), ncol=2, frameon=False, fontsize=12, labelcolor="#e6edf6", borderaxespad=0.2)
thr_line = axD.axvline(1.0, color=ACC, lw=2.2)
thr_lbl = axD.text(1.0, 0.0, "", color=ACC, fontsize=12,
                   ha="left", va="top", weight="bold")
axD.text(0.0, -0.20, "The model flags every customer scoring above the threshold", transform=axD.transAxes, fontsize=12, color="#7f90a8")

# ROC
axR.set_xlim(0, 1); axR.set_ylim(0, 1); axR.set_aspect("equal")
axR.set_xticks(np.linspace(0, 1, 6)); axR.set_yticks(np.linspace(0, 1, 6))
pct = lambda v, _: f"{v*100:.0f}%"
axR.xaxis.set_major_formatter(pct); axR.yaxis.set_major_formatter(pct)
axR.set_xlabel("False positive rate (1 − specificity)", fontsize=13)
axR.set_ylabel("True positive rate (sensitivity)", fontsize=13)
axR.plot([0, 1], [0, 1], ls="--", color="#5a6a82", lw=1.4)
axR.text(0.60, 0.50, "coin toss = 0.50", color="#7f90a8", fontsize=11, rotation=45,
         ha="center", va="center")
roc_line, = axR.plot([], [], color=POS_C, lw=3)
dot, = axR.plot([], [], "o", ms=11, color=ACC, mec=BG, mew=2)
fill = [None]
readout = fig.text(0.57, 0.785, "", fontsize=14, color="#e6edf6")
auc_txt = axR.text(0.62, 0.22, "", fontsize=30, weight="bold", color=ACC, ha="center")
auc_note = axR.text(0.62, 0.12, "", fontsize=12, color="#c9d6e6", ha="center")
foot = fig.text(0.06, 0.012, "", fontsize=12, color="#7f90a8")

ease = lambda x: 0.5 - 0.5*np.cos(np.pi*np.clip(x, 0, 1))

def frame(i):
    t = i / FPS
    a = ease(t / 0.8)
    for art in (title, sub): art.set_alpha(a)
    # sweep 1.0s -> 7.0s
    k = int(round(ease((t - 1.0) / 6.0) * (len(thr_grid) - 1)))
    th = thr_grid[k]
    thr_line.set_xdata([th, th])
    ytop = axD.get_ylim()[1]*0.97
    if th > 0.62: thr_lbl.set_position((th - 0.012, ytop)); thr_lbl.set_ha("right")
    else: thr_lbl.set_position((th + 0.012, ytop)); thr_lbl.set_ha("left")
    thr_lbl.set_text(f"threshold {th:.2f}")
    roc_line.set_data(fpr[:k+1], tpr[:k+1]); dot.set_data([fpr[k]], [tpr[k]])
    readout.set_text(f"Catches {tpr[k]*100:.1f}% of churners  ·  {fpr[k]*100:.1f}% false alarms")
    # area 7.2s -> 8.6s
    fa = ease((t - 7.2) / 1.4)
    if fill[0] is not None: fill[0].remove(); fill[0] = None
    if fa > 0:
        m = fpr <= fa
        fill[0] = axR.fill_between(fpr[m], tpr[m], 0, color=POS_C, alpha=0.25, lw=0)
        part = np.trapezoid(tpr[m], fpr[m]) if fa < 1 else AUC
        auc_txt.set_text(f"AUC = {part:.2f}")
    else:
        auc_txt.set_text("")
    if t >= 8.6:
        auc_note.set_text(f"A random churner outranks a random\nstayer {AUC*100:.0f}% of the time")
        foot.set_text("Illustrative model on simulated data · every figure on screen is computed, not drawn")
    else:
        auc_note.set_text(""); foot.set_text("")
    return []

anim = animation.FuncAnimation(fig, frame, frames=N, interval=1000/FPS)
anim.save(OUT, writer=animation.FFMpegWriter(fps=FPS, codec="libx264",
          extra_args=["-pix_fmt", "yuv420p", "-crf", "18"]), savefig_kwargs={"facecolor": BG})
print("saved", OUT)
