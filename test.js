#!/usr/bin/env node

// EVE packaged volumes (m³):  frigate 2500, cruiser 10000
// modules: medium 5, x-large 50

const MAX_VALUE  = 3_500_000_000;
const MAX_VOLUME = 320_000;

const TEST_CASES = [
    {
        name: 'Mixed ships + Liquid Ozone  (volume-bound: min 10 splits)',
        items: [
            { name: 'Exequror Navy Issue', quantity: 20,        price: 41_000_000,  volume: 10_000 },
            { name: 'Osprey Navy Issue',   quantity: 20,        price: 43_820_000,  volume: 10_000 },
            { name: 'Zealot',              quantity: 15,        price: 130_900_000, volume: 10_000 },
            { name: 'Sacrilege',           quantity: 8,         price: 154_500_000, volume: 10_000 },
            { name: 'Ashimmu',             quantity: 4,         price: 237_900_000, volume: 10_000 },
            { name: 'Orthrus',             quantity: 4,         price: 244_400_000, volume: 10_000 },
            { name: 'Phantasm',            quantity: 5,         price: 233_400_000, volume: 10_000 },
            { name: 'Stratios',            quantity: 12,        price: 312_800_000, volume: 10_000 },
            { name: 'Gila',                quantity: 28,        price: 197_300_000, volume: 10_000 },
            { name: 'Liquid Ozone',        quantity: 2_000_000, price: 95.05,       volume: 0.9   },
        ],
    },
    {
        // Vindicators are expensive (800M) but huge (50k m³).
        // Each split can hold only 4 before hitting 320k m³.
        // 4 × 800M = 3.2B ISK → 300M ISK headroom left per split.
        // Liquid Ozone (0.9 m³, 95 ISK) fills the leftover volume for almost no ISK.
        // FFD packs LO into every split alongside ships; Balanced keeps them separate.
        name: 'Faction battleships + Liquid Ozone  (volume-bound: min 6 splits)',
        items: [
            { name: 'Vindicator',   quantity: 20,        price: 800_000_000, volume: 50_000 },
            { name: 'Liquid Ozone', quantity: 1_000_000, price: 95,          volume: 0.9   },
        ],
    },
    {
        // Uniform T2 cruisers, no cheap filler.
        // All items have similar ISK/m³ (14–25k), so both algorithms distribute
        // them the same way. ISK is the binding constraint; neither can beat 5 splits.
        name: 'Uniform T2 cruisers, no filler  (ISK-bound: min 5 splits)',
        items: [
            { name: 'Cerberus',  quantity: 15, price: 250_000_000, volume: 10_000 },
            { name: 'Eagle',     quantity: 15, price: 220_000_000, volume: 10_000 },
            { name: 'Sacrilege', quantity: 20, price: 155_000_000, volume: 10_000 },
            { name: 'Ishtar',    quantity: 20, price: 170_000_000, volume: 10_000 },
            { name: 'Vagabond',  quantity: 15, price: 200_000_000, volume: 10_000 },
        ],
    },
    {
        name: 'Ships + deadspace modules  (ISK-bound: min 11 splits)',
        items: [
            { name: 'Exequror Navy Issue',                   quantity: 20, price: 41_000_000,  volume: 10_000 },
            { name: 'Osprey Navy Issue',                     quantity: 20, price: 43_820_000,  volume: 10_000 },
            { name: 'Zealot',                                quantity: 15, price: 130_900_000, volume: 10_000 },
            { name: 'Sacrilege',                             quantity: 8,  price: 154_500_000, volume: 10_000 },
            { name: 'Ashimmu',                               quantity: 4,  price: 237_900_000, volume: 10_000 },
            { name: 'Orthrus',                               quantity: 4,  price: 244_400_000, volume: 10_000 },
            { name: 'Phantasm',                              quantity: 5,  price: 233_400_000, volume: 10_000 },
            { name: 'Stratios',                              quantity: 12, price: 312_800_000, volume: 10_000 },
            { name: 'Gila',                                  quantity: 28, price: 197_300_000, volume: 10_000 },
            { name: 'Pithum A-Type Medium Shield Booster',   quantity: 30, price: 390_000_000, volume: 5     },
            { name: 'Pithum A-Type Explosive Shield Amp',    quantity: 40, price: 1_924_000,   volume: 5     },
            { name: 'Pith A-Type X-Large Shield Booster',   quantity: 20, price: 243_400_000, volume: 50    },
            { name: 'Astero',                                quantity: 10, price: 96_000_000,  volume: 2_500 },
            { name: 'Dramiel',                               quantity: 3,  price: 55_570_000,  volume: 2_500 },
            { name: 'Worm',                                  quantity: 12, price: 57_970_000,  volume: 2_500 },
            { name: 'Caldari Navy Hookbill',                 quantity: 25, price: 10_000_000,  volume: 2_500 },
            { name: 'Federation Navy Comet',                 quantity: 25, price: 8_663_000,   volume: 2_500 },
        ],
    },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtISK(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(3) + 'B';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    return n.toFixed(0);
}

function fmtVol(m3) {
    return (m3 / 1000).toFixed(1) + 'k';
}

// ── FFD Algorithm ────────────────────────────────────────────────────────────

function createSplitsFFD(items, maxVolume, maxValue) {
    const remaining = [...items]
        .sort((a, b) => b.price - a.price)
        .map(item => ({ ...item }));

    const splits = [];

    while (remaining.some(r => r.quantity > 0)) {
        const split = { items: [], totalVolume: 0, totalValue: 0, totalItems: 0 };

        // Fill this split with ALL available item types before opening the next one.
        // This lets cheap/small items fill unused volume left by expensive items.
        for (const item of remaining) {
            if (item.quantity <= 0 || split.totalItems >= 250) continue;

            const maxByValue  = item.price  > 0 ? Math.floor((maxValue  - split.totalValue)  / item.price)  : item.quantity;
            const maxByVolume = item.volume > 0 ? Math.floor((maxVolume - split.totalVolume) / item.volume) : item.quantity;
            const qty = Math.min(item.quantity, maxByValue, maxByVolume);

            if (qty <= 0) continue;

            split.items.push({ ...item, quantity: qty });
            split.totalVolume += qty * item.volume;
            split.totalValue  += qty * item.price;
            split.totalItems++;
            item.quantity -= qty;
        }

        if (split.items.length === 0) break;
        splits.push(split);
    }

    return splits.map(({ items, totalVolume, totalValue }) => ({ items, totalVolume, totalValue }));
}

// ── Balanced Algorithm ───────────────────────────────────────────────────────

function createSplitsBalanced(items, splitCount, maxVolume, maxValue) {
    const sortedItems = [...items].sort((a, b) =>
        (b.price * b.quantity) / (b.volume * b.quantity) -
        (a.price * a.quantity) / (a.volume * a.quantity)
    );

    let splits = Array.from({ length: splitCount }, () => ({
        items: [], totalVolume: 0, totalValue: 0, totalItems: 0
    }));

    for (const item of sortedItems) {
        let remaining = item.quantity;

        while (remaining > 0) {
            const split = splits.reduce((best, cur) => {
                if (cur.totalItems >= 250) return best;
                const bestRatio = best.totalItems >= 250 ? Infinity :
                    (best.totalValue / maxValue + best.totalVolume / maxVolume);
                const curRatio = cur.totalValue / maxValue + cur.totalVolume / maxVolume;
                return curRatio < bestRatio ? cur : best;
            });

            if (split.totalItems >= 250) {
                splits.push({ items: [], totalVolume: 0, totalValue: 0, totalItems: 0 });
                continue;
            }

            const maxByValue  = item.price  > 0 ? Math.floor((maxValue  - split.totalValue)  / item.price)  : remaining;
            const maxByVolume = item.volume > 0 ? Math.floor((maxVolume - split.totalVolume) / item.volume) : remaining;
            const qty = Math.min(remaining, maxByValue, maxByVolume);

            if (qty <= 0) {
                // All existing splits are full for this item.
                // If a single unit exceeds the limits it can never fit — stop.
                if ((item.price  > 0 && item.price  > maxValue) ||
                    (item.volume > 0 && item.volume > maxVolume)) break;
                splits.push({ items: [], totalVolume: 0, totalValue: 0, totalItems: 0 });
                continue;
            }

            split.items.push({ ...item, quantity: qty });
            split.totalVolume += qty * item.volume;
            split.totalValue  += qty * item.price;
            split.totalItems++;
            remaining -= qty;
        }
    }

    return splits.filter(s => s.items.length > 0)
                 .map(({ items, totalVolume, totalValue }) => ({ items, totalVolume, totalValue }));
}

// ── Verification ─────────────────────────────────────────────────────────────

function verify(splits, originalItems) {
    const errors = [];

    splits.forEach((split, i) => {
        if (split.totalValue > MAX_VALUE * 1.0001)
            errors.push(`Split ${i+1}: ISK overflow (${fmtISK(split.totalValue)} > ${fmtISK(MAX_VALUE)})`);
        if (split.totalVolume > MAX_VOLUME * 1.0001)
            errors.push(`Split ${i+1}: volume overflow (${fmtVol(split.totalVolume)} > ${fmtVol(MAX_VOLUME)})`);
        if (split.items.length > 250)
            errors.push(`Split ${i+1}: too many item types (${split.items.length} > 250)`);
    });

    const resultQtys = new Map();
    splits.forEach(split => split.items.forEach(item => {
        resultQtys.set(item.name, (resultQtys.get(item.name) || 0) + item.quantity);
    }));
    originalItems.forEach(item => {
        const got = resultQtys.get(item.name) || 0;
        if (got !== item.quantity)
            errors.push(`${item.name}: expected qty ${item.quantity}, got ${got}`);
    });

    return errors.length === 0 ? '✓ OK' : errors.map(e => `✗ ${e}`).join('\n    ');
}

// ── Report ───────────────────────────────────────────────────────────────────

function report(algoName, splits, originalItems) {
    const totalISK = splits.reduce((s, x) => s + x.totalValue,  0);
    const totalVol = splits.reduce((s, x) => s + x.totalVolume, 0);
    const avgISK   = splits.reduce((s, x) => s + x.totalValue  / MAX_VALUE,  0) / splits.length * 100;
    const avgVol   = splits.reduce((s, x) => s + x.totalVolume / MAX_VOLUME, 0) / splits.length * 100;

    console.log(`\n  ── ${algoName} ${'─'.repeat(Math.max(0, 50 - algoName.length))}`);
    console.log(`  Splits: ${splits.length}  |  Avg ISK fill: ${avgISK.toFixed(1)}%  |  Avg vol fill: ${avgVol.toFixed(1)}%`);
    console.log(`  Verification: ${verify(splits, originalItems)}`);
    console.log();
    console.log(`  ${'#'.padStart(2)}  ${'ISK'.padStart(10)}  ${'ISK%'.padStart(6)}  ${'Vol'.padStart(8)}  ${'Vol%'.padStart(5)}  Items`);
    console.log(`  ${'─'.repeat(55)}`);
    splits.forEach((split, i) => {
        const iskPct = (split.totalValue  / MAX_VALUE  * 100).toFixed(1);
        const volPct = (split.totalVolume / MAX_VOLUME * 100).toFixed(1);
        console.log(
            `  ${String(i+1).padStart(2)}  ${fmtISK(split.totalValue).padStart(10)}  ${iskPct.padStart(5)}%  ` +
            `${fmtVol(split.totalVolume).padStart(7)}  ${volPct.padStart(4)}%  ` +
            `${split.items.map(it => `${it.name}×${it.quantity}`).join(', ')}`
        );
    });
}

// ── Run ──────────────────────────────────────────────────────────────────────

for (const tc of TEST_CASES) {
    const totalValue  = tc.items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalVolume = tc.items.reduce((s, i) => s + i.volume * i.quantity, 0);
    const minByISK    = Math.ceil(totalValue  / MAX_VALUE);
    const minByVol    = Math.ceil(totalVolume / MAX_VOLUME);
    const minSplits   = Math.max(minByISK, minByVol);

    console.log(`\n${'═'.repeat(72)}`);
    console.log(`  ${tc.name}`);
    console.log(`${'═'.repeat(72)}`);
    console.log(`  Items: ${tc.items.length} types  |  Total ISK: ${fmtISK(totalValue)}  |  Total vol: ${fmtVol(totalVolume)} m³`);
    console.log(`  Constraints: max ${fmtISK(MAX_VALUE)} / ${fmtVol(MAX_VOLUME)} m³`);
    console.log(`  Theoretical minimum: ${minSplits} splits  (by ISK: ${minByISK}, by vol: ${minByVol})`);

    const ffd = createSplitsFFD(tc.items, MAX_VOLUME, MAX_VALUE);

    const splitCount = Math.max(minByISK, minByVol);
    const balanced   = createSplitsBalanced(tc.items, splitCount, MAX_VOLUME, MAX_VALUE);

    report('FFD — Fill First (new)', ffd, tc.items);
    report('Balanced (old)', balanced, tc.items);

    const winner = ffd.length <= balanced.length ? `FFD wins (${balanced.length - ffd.length} fewer splits)` : `Balanced wins (${ffd.length - balanced.length} fewer splits)`;
    console.log(`\n  Result: FFD=${ffd.length}  Balanced=${balanced.length}  →  ${winner}`);
}

console.log(`\n${'═'.repeat(72)}\n`);
