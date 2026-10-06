import pathlib
run=pathlib.Path(__file__).resolve().parent
page=run/'worktrees'/'final'/'kalman'/'index.html'
text=page.read_text(encoding='utf-8')
old='https://www.cs.unc.edu/~welch/media/pdf/kalman_intro.pdf'
new='https://cis.temple.edu/~latecki/Courses/CIS750-03/Papers/KalmanFilterSIGGRAPH2001.pdf'
assert text.count(old)==1
page.write_text(text.replace(old,new),encoding='utf-8')
