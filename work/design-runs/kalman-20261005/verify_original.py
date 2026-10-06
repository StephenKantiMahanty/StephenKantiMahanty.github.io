import pathlib, hashlib, json
run=pathlib.Path(__file__).resolve().parent;repo=run.parents[2];source=run/'worktrees'/'final'
files=[p for p in (source/'kalman').rglob('*') if p.is_file()]
files += [source/name for name in ['secret/index.html','README.md','tests/secret-projects.test.cjs','tests/kalman.test.cjs','tests/kalman-integration.test.cjs','tests/kalman-preview.html']]
verified={}
for path in files:
    name=str(path.relative_to(source)).replace('\\','/')
    assert path.read_bytes()==(repo/name).read_bytes(),name
    verified[name]=hashlib.sha256((repo/name).read_bytes()).hexdigest()
(run/'results'/'FINAL_IDENTITY.json').write_text(json.dumps(verified,indent=2),encoding='utf-8')
print('Original product/tests/README match reviewed final source:',len(verified),'files')
