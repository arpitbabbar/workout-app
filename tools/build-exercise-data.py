#!/usr/bin/env python3
"""Builds exercise-data.js and img/ex/*.jpg for the app.

Sources (both free to use):
  - free-exercise-db (public domain / Unlicense): photos, muscles, instructions
    https://github.com/yuhonas/free-exercise-db
  - react-body-highlighter (MIT, (c) 2020 GV79): body map shapes
    https://github.com/giavinh79/react-body-highlighter

Run from the project folder:  python3 tools/build-exercise-data.py
"""
import json
import os
import re
import subprocess
import urllib.request

FEDB = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main'
RBH = 'https://raw.githubusercontent.com/giavinh79/react-body-highlighter/master/src/assets/index.ts'

# Our exercise id -> free-exercise-db id (None = no photos available)
MATCHES = {
    'bench-press': 'Barbell_Bench_Press_-_Medium_Grip',
    'incline-bench-press': 'Barbell_Incline_Bench_Press_-_Medium_Grip',
    'decline-bench-press': 'Decline_Barbell_Bench_Press',
    'dumbbell-bench-press': 'Dumbbell_Bench_Press',
    'incline-dumbbell-press': 'Incline_Dumbbell_Press',
    'dumbbell-fly': 'Dumbbell_Flyes',
    'cable-crossover': 'Cable_Crossover',
    'chest-press-machine': 'Leverage_Chest_Press',
    'pec-deck': 'Butterfly',
    'push-up': 'Pushups',
    'chest-dips': 'Dips_-_Chest_Version',
    'deadlift': 'Barbell_Deadlift',
    'pull-up': 'Pullups',
    'chin-up': 'Chin-Up',
    'lat-pulldown': 'Wide-Grip_Lat_Pulldown',
    'barbell-row': 'Bent_Over_Barbell_Row',
    'dumbbell-row': 'One-Arm_Dumbbell_Row',
    'seated-cable-row': 'Seated_Cable_Rows',
    't-bar-row': 'T-Bar_Row_with_Handle',
    'face-pull': 'Face_Pull',
    'back-extension': 'Hyperextensions_Back_Extensions',
    'overhead-press': 'Standing_Military_Press',
    'dumbbell-shoulder-press': 'Dumbbell_Shoulder_Press',
    'arnold-press': 'Arnold_Dumbbell_Press',
    'lateral-raise': 'Side_Lateral_Raise',
    'front-raise': 'Front_Dumbbell_Raise',
    'rear-delt-fly': 'Reverse_Flyes',
    'upright-row': 'Upright_Barbell_Row',
    'shrug': 'Barbell_Shrug',
    'squat': 'Barbell_Full_Squat',
    'front-squat': 'Front_Barbell_Squat',
    'hack-squat': 'Hack_Squat',
    'goblet-squat': 'Goblet_Squat',
    'leg-press': 'Leg_Press',
    'romanian-deadlift': 'Romanian_Deadlift',
    'lunge': 'Dumbbell_Lunges',
    'bulgarian-split-squat': 'Split_Squat_with_Dumbbells',
    'leg-extension': 'Leg_Extensions',
    'leg-curl': 'Lying_Leg_Curls',
    'hip-thrust': 'Barbell_Hip_Thrust',
    'calf-raise': 'Standing_Calf_Raises',
    'barbell-curl': 'Barbell_Curl',
    'dumbbell-curl': 'Dumbbell_Bicep_Curl',
    'hammer-curl': 'Hammer_Curls',
    'preacher-curl': 'Preacher_Curl',
    'cable-curl': 'Standing_Biceps_Cable_Curl',
    'concentration-curl': 'Concentration_Curls',
    'tricep-pushdown': 'Triceps_Pushdown',
    'skull-crusher': 'EZ-Bar_Skullcrusher',
    'overhead-tricep-extension': 'Standing_Dumbbell_Triceps_Extension',
    'close-grip-bench-press': 'Close-Grip_Barbell_Bench_Press',
    'tricep-dips': 'Dips_-_Triceps_Version',
    'tricep-kickback': 'Tricep_Dumbbell_Kickback',
    'plank': 'Plank',
    'crunch': 'Crunches',
    'hanging-leg-raise': 'Hanging_Leg_Raise',
    'cable-crunch': 'Cable_Crunch',
    'russian-twist': 'Russian_Twist',
    'ab-wheel-rollout': 'Ab_Roller',
    'clean-and-press': 'Clean_and_Press',
    'kettlebell-swing': 'One-Arm_Kettlebell_Swings',
    'burpee': None,
    'farmer-s-walk': 'Farmers_Walk',
}

# Exercises without a database entry
MANUAL = {
    'burpee': {'primary': ['quadriceps', 'chest'], 'secondary': ['shoulders', 'triceps', 'abdominals', 'glutes'],
               'equipment': 'body only', 'level': 'beginner',
               'steps': ['Stand with feet shoulder-width apart.',
                         'Squat down and place your hands on the floor.',
                         'Jump your feet back into a push-up position and do a push-up.',
                         'Jump your feet back towards your hands.',
                         'Explode up into a jump with your arms overhead. Land softly and repeat.']},
}


def fetch(url):
    with urllib.request.urlopen(url) as r:
        return r.read()


def body_map():
    src = fetch(RBH).decode()
    names = {'TRAPEZIUS': 'trapezius', 'UPPER_BACK': 'upper-back', 'LOWER_BACK': 'lower-back', 'CHEST': 'chest',
             'BICEPS': 'biceps', 'TRICEPS': 'triceps', 'FOREARM': 'forearm', 'BACK_DELTOIDS': 'back-deltoids',
             'FRONT_DELTOIDS': 'front-deltoids', 'ABS': 'abs', 'OBLIQUES': 'obliques', 'ADDUCTOR': 'adductor',
             'ABDUCTORS': 'abductors', 'HAMSTRING': 'hamstring', 'QUADRICEPS': 'quadriceps', 'CALVES': 'calves',
             'GLUTEAL': 'gluteal', 'HEAD': 'head', 'NECK': 'neck', 'KNEES': 'knees', 'LEFT_SOLEUS': 'calves',
             'RIGHT_SOLEUS': 'calves'}
    out = {}
    for part, key in ((src.split('export const anteriorData')[1].split('export const posteriorData')[0], 'front'),
                      (src.split('export const posteriorData')[1], 'back')):
        shapes = []
        for m, pts in re.findall(r'MuscleType\.(\w+),\s*svgPoints:\s*\[(.*?)\]', part, re.S):
            for p in re.findall(r"'([\d ]+)'", pts):
                shapes.append([names[m], p])
        out[key] = shapes
    return out


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    img_dir = os.path.join(root, 'img', 'ex')
    os.makedirs(img_dir, exist_ok=True)
    db = {e['id']: e for e in json.loads(fetch(f'{FEDB}/dist/exercises.json'))}
    info = {}
    for ours, theirs in MATCHES.items():
        if theirs is None:
            info[ours] = {**MANUAL[ours], 'img': 0}
            continue
        e = db[theirs]
        for n in (0, 1):
            path = os.path.join(img_dir, f'{ours}-{n}.jpg')
            if not os.path.exists(path):
                with open(path, 'wb') as f:
                    f.write(fetch(f'{FEDB}/exercises/{theirs}/{n}.jpg'))
                # Shrink for phones: max 480px wide, lighter JPEG
                subprocess.run(['sips', '-Z', '480', '-s', 'formatOptions', '70', path], check=True, capture_output=True)
        info[ours] = {'img': 1, 'primary': e['primaryMuscles'], 'secondary': e['secondaryMuscles'],
                      'equipment': e.get('equipment') or '', 'level': e.get('level') or '', 'steps': e['instructions']}

    with open(os.path.join(root, 'exercise-data.js'), 'w') as f:
        f.write('// Generated by tools/build-exercise-data.py. Do not edit by hand.\n')
        f.write('// Exercise photos & instructions: free-exercise-db (public domain).\n')
        f.write('// Body map shapes: react-body-highlighter, MIT License, Copyright (c) 2020 GV79.\n')
        f.write(f'const EXERCISE_INFO = {json.dumps(info, separators=(",", ":"))};\n')
        f.write(f'const BODY_MAP = {json.dumps(body_map(), separators=(",", ":"))};\n')
    print(f'{len(info)} exercises written')


if __name__ == '__main__':
    main()
