# EVE HaulSplitter

A browser-based tool for splitting EVE Online cargo lists into courier contract-sized batches, minimising the number of contracts while respecting ISK value and volume limits.

**Live demo:** https://slysmoke.github.io/splitter/

## Features

- Paste an item list directly from the in-game inventory window
- Fetches live prices and packaged volumes from ESI
- Two split algorithms to choose from (see below)
- Saves splits as ship fittings in-game via ESI
- EVE SSO login with PKCE + full JWT signature validation
- Preferences (limits, ship type, algorithm) saved in `localStorage`

## How to use

1. Log in with your EVE Online account
2. Open your cargo/hangar in-game, select all items, copy (`Ctrl+A`, `Ctrl+C`)
3. Paste the list into the **Items List** text area
4. Set your **Max Contract Value** and **Max Contract Volume**
5. Choose a **Split Algorithm**
6. Click **Calculate** — results appear instantly
7. Optionally click **Save as Ship Fits** to push splits directly to your character's fittings

## Split algorithms

| Algorithm | Strategy | Best for |
|-----------|----------|----------|
| **Fill First** (FFD) | Fills each batch with all available item types before opening the next. Minimises the number of splits. | Minimising contract count |
| **Balanced** | Distributes items evenly across a pre-calculated number of splits. | Equal-sized loads |

## Development

No build step required — plain HTML/CSS/JS.

```bash
git clone https://github.com/slysmoke/splitter.git
cd splitter
# open index.html in a browser, or serve with any static server:
npx serve .
```

### Running algorithm tests

```bash
node test.js
```

The test runs both algorithms against a sample cargo list and prints a detailed split report with verification.

## ESI scopes

The app requests only `esi-fittings.write_fittings.v1` — needed to save splits as in-game ship fittings. No read access to assets, wallet, or any other character data.

## License

MIT
