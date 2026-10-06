import pathlib,json,hashlib
root=pathlib.Path(__file__).resolve().parent
guidance=pathlib.Path('C:/Users/steph/Documents/AGENTS.md').read_text(encoding='utf-8')
jobs=[]
priorities={'clarity':'Guided expedition notebook: teach newcomers with progressively revealed math and an engaging mission, crisp editorial hierarchy.','cinematic':'Cinematic deep-sea mission control: exceptional visual expression and immersive underwater robot scene without sacrificing clarity.','workbench':'Uncertainty observatory/workbench: fast experiments, paired tuning comparisons and failure diagnosis, elegant scientific instrumentation.'}
for name in [*priorities,'final']:
    cwd=root/'worktrees'/name
    (cwd/'AGENTS.md').write_text(guidance,encoding='utf-8')
    inp=cwd/'.design-input';inp.mkdir(exist_ok=True)
    for file in ['PROJECT_BRIEF.md','EVALUATION.md']:
        (inp/file).write_bytes((root/'shared'/file).read_bytes())
    if name=='final':continue
    goal='Follow AGENTS.md and the frozen .design-input/PROJECT_BRIEF.md and EVALUATION.md. Build every mandatory feature independently. Priority: '+priorities[name]+' Do not inspect rivals or their reports before first completion. Write DELIVERY.md with actual verification, setup and preview, rationale and limitations. Use the three-role cycle required by AGENTS.md; no model override. Complete only when requirements are actually verified; unsupported browser checks must be recorded. Do not publish or commit. Numerical tests required. Keep edits inside this candidate.'
    (inp/'GOAL.md').write_text(goal,encoding='utf-8')
    jobs.append({'name':name,'cwd':str(cwd),'objective':'Build and validate the complete independent '+name+' robotics Kalman lab specified in .design-input/GOAL.md. Follow AGENTS.md, preserve other projects, and deliver DELIVERY.md.','prompt':'Read .design-input/GOAL.md and follow it. Implement the complete activity now independently. Do not merely plan. All edits belong inside your assigned working copy.','sandbox':'workspace-write'})
(root/'build-jobs.json').write_text(json.dumps({'jobs':jobs},indent=2),encoding='utf-8')
(root/'shared'/'MANIFEST.json').write_text(json.dumps({'baseline':'3deee5f45039401fa73f5ce21fab8a24cfd25fb6','guidance_source':'C:/Users/steph/Documents/AGENTS.md','hashes':{f:hashlib.sha256((root/'shared'/f).read_bytes()).hexdigest() for f in ['PROJECT_BRIEF.md','EVALUATION.md']},'excluded_changes':[]},indent=2),encoding='utf-8')
