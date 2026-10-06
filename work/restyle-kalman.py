from pathlib import Path
p=Path('kalman/index.html')
s=p.read_text(encoding='utf-8')
changes={
'<link rel="stylesheet" href="styles.css">':'<link rel="stylesheet" href="../styles.css">\n  <link rel="stylesheet" href="styles.css">',
'<body>':'<body class="kalman-page">\n<div class="grid-background" aria-hidden="true"></div>',
'Find your way.<br><em>Through uncertainty.</em>':'KALMAN FILTERS',
'A robot. An imperfect sensor. One better estimate.<br>The white line shows where it really is; amber circles are noisy fixes; teal is its best estimate.':'How does a robot figure out where it is when its sensor is wrong some of the time? The idea here is to combine what the robot expects from its motion with what the sensor measures. Run the mission, change the assumptions, and see what happens to the estimate.',
'Follow one correction':'See how one correction works',
'THE DEEP TRANSECT':'DEPTH SIMULATION',
'teal':'green', 'Teal':'Green',
'REPEATABLE BY DESIGN':'SAME SEED, SAME DATA',
'CONFIDENCE ≠ ACCURACY':'ERROR AND UNCERTAINTY',
'NAVIGATION SCORECARD':'COMPARE THE ESTIMATES',
'Predict. Listen.<br><em>Correct.</em>':'HOW THE FILTER WORKS',
'The filter never sees the white truth trace. It combines a motion model with imperfect depth fixes, and tracks how uncertain that estimate is.':'The white line lets us check the result, but the filter does not get to use it. It only has a model of the robot’s motion and the measurements. So it has to decide how much to trust each one.',
'First, use the last depth, speed and commanded acceleration to predict where the robot will be. Uncertain acceleration widens the range of plausible depths.':'The robot starts with its previous depth and speed. It uses the commanded acceleration to predict the next depth. Since the actual acceleration can differ from the command, the prediction also has some uncertainty.',
'Then listen to the sensor. How far is its fix from the prediction? Gain K is the fraction of that gap to follow: larger R means less trust in the fix.':'For example, the sensor might place the robot deeper than the prediction does. The difference is called the innovation. The gain K determines how much of that difference to use. Increasing R tells the filter that the sensor is less reliable, so it follows the measurement less.',
'Move the estimate partway toward the fix. The same correction also adjusts speed. With no fix, keep the prediction and its growing uncertainty.':'The filter adds the gain times the innovation to its prediction. This changes both the depth estimate and the speed estimate. If a measurement is missing, it keeps predicting. What this means is that the robot can keep moving, but the filter becomes less certain about its depth.',
'Correct, without seeing truth':'Update the estimate',
'ONE CORRECTION, UNPACKED':'LOOK AT ONE CORRECTION',
'Model, units & honest limits':'The model and its limits',
'ABYSS / BUILT TO MAKE UNCERTAINTY VISIBLE':'KALMAN LAB / SECRET PROJECTS',
'RMSE = typical depth error. Fixes score only when available; estimate and dead reckoning score every step. Lower is better; improvement is not guaranteed.':'RMSE measures the size of the depth errors. A lower number means a better estimate for this run. Measurements are scored when they exist; the two estimates are scored at every step. A filter can still do worse if its assumptions are wrong.',
'Save a baseline, change R or q, then run again to compare.':'Save the current tuning, then change R or q. You can compare both estimates using the same measurements.',
'Any setting change pauses and rewinds. Same seed + real-world settings = same data.':'Changing a setting pauses the mission and returns it to the start. Keeping the seed and real-world settings the same gives you the same measurements.',
'Standard deviations. These change the physical mission and its measurements.':'These are standard deviations. They control how much the actual acceleration and sensor measurements vary.',
'Higher R trusts fixes less. Higher q allows more motion uncertainty. Tuning replays the <strong>same sensor data</strong>. q = 0 is the leftmost setting.':'R describes the assumed measurement noise; q describes the assumed acceleration noise. A larger R gives the sensor less influence. A larger q makes the motion prediction less certain. Changing these reuses the <strong>same sensor data</strong>. The leftmost q setting is zero.'
}
for a,b in changes.items():
    if a not in s: raise ValueError(a)
    s=s.replace(a,b)
p.write_text(s,encoding='utf-8')
p=Path('kalman/app.js');s=p.read_text(encoding='utf-8').replace('#60e1c1','#00ff41').replace('Teal bounds','Green bounds').replace('teal','green')
s=s.replace("'Save a baseline, change R or q, then run again to compare.'", "'Save the current tuning, then change R or q to compare estimates using the same measurements.'")
p.write_text(s,encoding='utf-8')
