from pathlib import Path
p=Path('kalman/app.js');s=p.read_text(encoding='utf-8')
a=s.index('    const water=');b=s.index('    // Task silhouettes',a)
s=s[:a]+"    ctx.fillStyle='#050810';ctx.fillRect(0,0,w,h);\n"+s[b:]
s=s.replace("'#f4d795'","'#c3d4c9'").replace("'#b29156'","'#7fa98b'").replace("'#504c3b'","'#00661a'")
p.write_text(s,encoding='utf-8')
