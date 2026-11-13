# Loop & Bell

A standalone daily exercise tool with a two-week strength schedule and a randomized, standing 15-minute warmup/stretch session.

## Run locally

Open `index.html` directly in a browser, or serve this directory (requires Python 3):

```bash
python -m http.server 8000
```

Visit `http://localhost:8000/`. No build or dependency installation is required. Exercise graphics and application code are embedded in the HTML; Google Fonts are optional and have local font fallbacks. No environment variables or server credentials are required.

## Publish on GitHub Pages

Repository: [ilushareg/sport_kb](https://github.com/ilushareg/sport_kb).

After the initial upload, open [Settings → Pages](https://github.com/ilushareg/sport_kb/settings/pages). Choose **Deploy from a branch**, select **main** and **/ (root)**, and save. GitHub will show the deployment status and published URL. Expected address: https://ilushareg.github.io/sport_kb/.

`index.html` opens the application using a relative link, so the repository subpath works. `.nojekyll` keeps hosting static. The check workflow runs tests on pushes and pull requests; branch-based Pages publishing runs separately, so run tests before pushing.

For subsequent updates:

```bash
node --test tests/loop-and-bell.test.cjs
git add loop-and-bell.html index.html README.md tests .github .nojekyll .gitignore AGENTS.md
git commit -m "Describe your change"
git push origin main
```

## Review notes and next improvements

- The app needs no backend and stores only the sound preference locally. There is no workout history or session recovery after a refresh.
- Timer checks use wall-clock deadlines. If the browser suspends execution, the current interval completes when it resumes, but later intervals start then rather than catching up. Keep the page visible for reliable session timing; an explicit background/pause policy is a useful next improvement.
- Browser checks are still required for mobile layout, keyboard navigation, sound, and screen wake lock. Automated tests use a simulated DOM.
- The single HTML file is easy to host but mixes exercise data, rendering, styles, and timing. Splitting those responsibilities would help once the program grows.

## What changed

- All 31 original exercise descriptions now include setup, movement, breathing, common mistakes, and easier options.
- The current S3 version uses static WebP exercise illustrations, including 28 embedded images. It also references 16 separate images under `assets/exercises/`; the source server currently returns HTTP 403 for those files, so those illustrations are unavailable. The application HTML is preserved as supplied.
- **Random warmup / stretch** creates 12 stations from 15 standing options: three easy stepping movements, six randomly selected mobility exercises covering upper body, trunk and lower body, and three stretches. Preview the exercises, shuffle again, then start.
- Default timing is five seconds of preparation, 730 seconds of activity and eleven 15-second transitions: 15 minutes before pauses or timing adjustments. Subsequent stations start automatically. Stretch stations cue a side switch halfway through.
- Timed side planks include both sides of each set. Single-bell floor press targets explicitly specify reps per side.

## Verify

Requires Node.js 20 or newer:

```bash
node --test tests/loop-and-bell.test.cjs
```

The 15 checks use the actual application script with a lightweight DOM and controlled clock. They cover exercise metadata, randomization, duration, progression, pause/resume, side switches, exits, both-side holds, reduced motion, previews, and schedule navigation. They do not substitute for browser layout testing.

For a browser check, use a narrow viewport, preview an exercise, then start a warmup and exercise the pause, skip, transition and exit controls. Repeat with reduced motion and dark mode enabled. The tests validate image references and embedded WebP integrity; they do not certify that external images are available.

## Exercise guidance references

The instructions are original wording. Form and warmup guidance were checked against [ACE's exercise library](https://www.acefitness.org/resources/everyone/exercise-library/), its [bird-dog instructions](https://www.acefitness.org/resources/everyone/exercise-library/14/bird-dog/) and [two-handed swing guidance](https://www.acefitness.org/continuing-education/certified/january-2025/8788/the-ace-do-it-better-series-the-two-handed-kettlebell-swing/), plus [NHS warmup](https://www.nhs.uk/live-well/exercise/how-to-warm-up-before-exercising/) and [flexibility guidance](https://www.nhs.uk/live-well/exercise/flexibility-exercises/). The random sequence is this app's own design.

To run one check, use `node --test --test-name-pattern="pause and resume" tests/loop-and-bell.test.cjs`.
