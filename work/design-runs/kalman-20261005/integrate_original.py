"""Copy explicitly reviewed final deliverables, preserving unrelated root changes."""
import pathlib, json, subprocess, shutil, hashlib
run=pathlib.Path(__file__).resolve().parent
repo=run.parents[2]
source=run/'worktrees'/'final'
state=json.loads((run/'results'/'final'/'summary.json').read_text(encoding='utf-8'))
if not all(j.get('outcome')=='complete' and j.get('goal',{}).get('status')=='complete' for j in state['jobs']):
    raise SystemExit('Final native Goal is not complete; no copying performed.')
paths=['README.md','secret/index.html','tests/secret-projects.test.cjs','tests/kalman.test.cjs','DELIVERY.md']
paths += [str(p.relative_to(source)).replace('\\','/') for p in (source/'kalman').rglob('*') if p.is_file()]
paths += [str(p.relative_to(source)).replace('\\','/') for p in (source/'tests').glob('kalman*') if p.is_file() and str(p.relative_to(source)).replace('\\','/') not in paths]
paths += [str(p.relative_to(source)).replace('\\','/') for p in (source/'work'/'verification'/'kalman-final').rglob('*') if p.is_file()]
for name in paths:
    target=repo/name
    if not target.exists():continue
    tracked=subprocess.run(['git','ls-files','--error-unmatch','--',name],cwd=repo,capture_output=True)
    if tracked.returncode==0:
        diff=subprocess.run(['git','diff','HEAD','--',name],cwd=repo,capture_output=True,check=True)
        if diff.stdout:raise SystemExit('User changes detected: '+name)
    else:raise SystemExit('Existing untracked target needs review: '+name)
manifest={}
for name in paths:
    target=repo/name;target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(source/name,target)
    manifest[name]=hashlib.sha256(target.read_bytes()).hexdigest()
(run/'results'/'ORIGINAL_INTEGRATION.json').write_text(json.dumps({'source':str(source),'target':str(repo),'files':manifest},indent=2),encoding='utf-8')
print('Copied',len(manifest),'reviewed deliverables to',repo)
