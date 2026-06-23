#!/usr/bin/env node

// Packaged volumes: cruisers = 10,000 m³, Liquid Ozone = 0.9 m³/unit
const MAX_VALUE  = 3_500_000_000;
const MAX_VOLUME = 320_000;

const items = [
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

function verify(name, splits, originalItems) {
    const errors = [];

    // Check constraints
    splits.forEach((split, i) => {
        if (split.totalValue > MAX_VALUE * 1.0001)
            errors.push(`Split ${i+1}: ISK overflow (${fmtISK(split.totalValue)} > ${fmtISK(MAX_VALUE)})`);
        if (split.totalVolume > MAX_VOLUME * 1.0001)
            errors.push(`Split ${i+1}: volume overflow (${fmtVol(split.totalVolume)} > ${fmtVol(MAX_VOLUME)})`);
        if (split.items.length > 250)
            errors.push(`Split ${i+1}: too many item types (${split.items.length} > 250)`);
    });

    // Check all items accounted for
    const resultQtys = new Map();
    splits.forEach(split => split.items.forEach(item => {
        resultQtys.set(item.name, (resultQtys.get(item.name) || 0) + item.quantity);
    }));
    originalItems.forEach(item => {
        const got = resultQtys.get(item.name) || 0;
        if (got !== item.quantity)
            errors.push(`${item.name}: expected qty ${item.quantity}, got ${got}`);
    });

    if (errors.length === 0) {
        console.log(`  Verification: ✓ OK`);
    } else {
        errors.forEach(e => console.log(`  Verification: ✗ ${e}`));
    }
}

// ── Report ───────────────────────────────────────────────────────────────────

function report(name, splits) {
    const totalISK = splits.reduce((s, x) => s + x.totalValue,  0);
    const totalVol = splits.reduce((s, x) => s + x.totalVolume, 0);
    const avgISK   = splits.reduce((s, x) => s + x.totalValue  / MAX_VALUE,  0) / splits.length * 100;
    const avgVol   = splits.reduce((s, x) => s + x.totalVolume / MAX_VOLUME, 0) / splits.length * 100;

    console.log(`\n${'═'.repeat(72)}`);
    console.log(`  ${name}`);
    console.log(`${'═'.repeat(72)}`);
    console.log(`  Splits:       ${splits.length}`);
    console.log(`  Total ISK:    ${fmtISK(totalISK)}`);
    console.log(`  Total vol:    ${fmtVol(totalVol)} m³`);
    console.log(`  Avg ISK fill: ${avgISK.toFixed(1)}%  (limit ${fmtISK(MAX_VALUE)})`);
    console.log(`  Avg vol fill: ${avgVol.toFixed(1)}%  (limit ${fmtVol(MAX_VOLUME)} m³)`);
    verify(name, splits, items);
    console.log();
    console.log(`  ${'#'.padStart(2)}  ${'ISK'.padStart(10)}  ${'ISK%'.padStart(6)}  ${'Vol m³'.padStart(8)}  ${'Vol%'.padStart(6)}  Items  Contents`);
    console.log(`  ${'─'.repeat(70)}`);
    splits.forEach((split, i) => {
        const iskPct = (split.totalValue  / MAX_VALUE  * 100).toFixed(1);
        const volPct = (split.totalVolume / MAX_VOLUME * 100).toFixed(1);
        const contents = split.items.map(it => `${it.name}×${it.quantity}`).join(', ');
        console.log(
            `  ${String(i+1).padStart(2)}  ${fmtISK(split.totalValue).padStart(10)}  ${iskPct.padStart(5)}%  ` +
            `${fmtVol(split.totalVolume).padStart(8)}  ${volPct.padStart(5)}%  ` +
            `${String(split.items.length).padStart(5)}  ${contents}`
        );
    });
}

// ── Run ──────────────────────────────────────────────────────────────────────

const totalValue  = items.reduce((s, i) => s + i.price * i.quantity, 0);
const totalVolume = items.reduce((s, i) => s + i.volume * i.quantity, 0);
const minSplits   = Math.max(Math.ceil(totalValue / MAX_VALUE), Math.ceil(totalVolume / MAX_VOLUME));

console.log('\n── Input ──────────────────────────────────────────────────────────────');
items.forEach(i => {
    const total = i.price * i.quantity;
    console.log(`  ${i.name.padEnd(22)} qty: ${String(i.quantity).padStart(9)}  price: ${fmtISK(i.price).padStart(8)}  total: ${fmtISK(total).padStart(9)}`);
});
console.log(`  ${'─'.repeat(70)}`);
console.log(`  ${'TOTAL'.padEnd(22)}                                   ${fmtISK(totalValue).padStart(9)}`);
console.log(`\n  Constraints:  max ${fmtISK(MAX_VALUE)} ISK / ${fmtVol(MAX_VOLUME)} m³ per split`);
console.log(`  Total volume: ${fmtVol(totalVolume)} m³`);
console.log(`  Min splits (theoretical): ${minSplits}  (by ISK: ${Math.ceil(totalValue/MAX_VALUE)}, by vol: ${Math.ceil(totalVolume/MAX_VOLUME)})`);

const ffd = createSplitsFFD(items, MAX_VOLUME, MAX_VALUE);
report('FFD — Fill First Decreasing (new)', ffd);

const splitCount = Math.max(Math.ceil(totalVolume / MAX_VOLUME), Math.ceil(totalValue / MAX_VALUE));
const balanced   = createSplitsBalanced(items, splitCount, MAX_VOLUME, MAX_VALUE);
report('Balanced — Equal Distribution (old)', balanced);

console.log(`\n── Summary ${'─'.repeat(61)}`);
console.log(`  FFD:      ${ffd.length} splits`);
console.log(`  Balanced: ${balanced.length} splits`);
console.log(`  Winner:   ${ffd.length <= balanced.length ? 'FFD' : 'Balanced'} (${Math.abs(ffd.length - balanced.length)} fewer splits)\n`);
