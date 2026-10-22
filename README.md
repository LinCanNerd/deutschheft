# Deutschheft

An A1 German course with spaced-repetition cards, grammar drills that explain every answer, and weak-spot tracking.

The same sources run in two places:

- **Claude version**: https://claude.ai/artifact/BFzYLpAtdphhvZ32DZzzzD. Progress is saved to your Claude account. The "Ask Claude" buttons and the writing coach work here.
- **Desktop app**: works offline and saves everything on this computer. The Claude features aren't available offline.

## Desktop app (Linux)

As a Debian/Ubuntu package:

```sh
./build_deb.sh [version]                              # → dist/deutschheft_<version>_all.deb
sudo apt install ./dist/deutschheft_1.0.0_all.deb     # adds the `deutschheft` command and a launcher entry
sudo apt remove deutschheft
```

Or, without root, from this folder:

```sh
./install_app.sh            # builds ./app and adds "Deutschheft" to your app launcher
./install_app.sh --uninstall
```

Pick one. Both serve the app at the same address, so they share your progress. A home-folder launcher hides the package's launcher entry, so run `./install_app.sh --uninstall` after installing the package.

The launcher (`deutschheft.sh`) starts `serve_app.py`, a tiny local server on `127.0.0.1:47613` that quits after a minute idle. It then opens the app in a Chrome app window. The app also keeps an offline copy of itself (service worker), so it still opens if the server isn't running. Keep the port as it is: Chrome stores your progress per address.

### Where your progress lives

- **In the app**: Chrome keeps it in your browser profile (for `127.0.0.1:47613`), and the app asks Chrome to keep it persistent.
- **In a save file (recommended)**: go to *Progress → Your data → Choose a save file…*. The app rewrites that JSON file after every answer. At start-up it combines the file with its own progress, so a file in a synced folder lets you use the app on more than one computer. Chrome may ask you to reconnect the file after a restart.
- **Backup files**: *Download backup file* / *Load backup file…* move your progress between the desktop app and the Claude version. Loading one offers **Combine both** (each card keeps its most recent review, XP from both sides is added up) or **Replace**, so you can study in both places without losing anything.

### Phone or other devices

`app/` is a complete offline web app (manifest and service worker). Host the folder on any HTTPS static host, such as GitHub Pages, and use "Install app" or "Add to Home Screen" in the browser. Progress then lives on that device.

## Changing the content

| File | What's in it |
| --- | --- |
| `content.js` | Vocabulary, gender rules, grammar skills, lessons, sentence banks, writing tasks |
| `engine.js` | Conjugation, plurals, numbers and time, answer checking, scheduling, exercise generators |
| `app.js` | Interface, storage, sessions, Claude features |
| `index.html` | Styles and the page shell, in the artifact format (no `<html>`/`<head>`) |

After editing, run `./install_app.sh` (or `python3 build_app.py`) to rebuild `app/`, and republish the artifact for the Claude version.
