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
        // 200-type realistic haul: battleships, faction ships, T2/T3 cruisers,
        // HACs, frigates, destroyers, battlecruisers, modules, rigs, drones.
        // Tests the 250-item-type-per-split limit and mixed ISK/volume densities.
        name: 'Large realistic haul — 147 item types  (ships + modules + rigs + drones)',
        items: [
            // ── T1 Battleships (50 000 m³, 150–300M ISK) ────────────────────
            { name: 'Raven',                     quantity: 5,   price: 185_000_000, volume: 50_000 },
            { name: 'Megathron',                 quantity: 5,   price: 195_000_000, volume: 50_000 },
            { name: 'Abaddon',                   quantity: 5,   price: 205_000_000, volume: 50_000 },
            { name: 'Tempest',                   quantity: 5,   price: 185_000_000, volume: 50_000 },
            { name: 'Scorpion',                  quantity: 3,   price: 180_000_000, volume: 50_000 },
            { name: 'Dominix',                   quantity: 4,   price: 175_000_000, volume: 50_000 },
            { name: 'Apocalypse',                quantity: 4,   price: 200_000_000, volume: 50_000 },
            { name: 'Typhoon',                   quantity: 3,   price: 185_000_000, volume: 50_000 },
            // ── Faction Battleships (50 000 m³, 500M–2B ISK) ────────────────
            { name: 'Vindicator',                quantity: 3,   price: 800_000_000, volume: 50_000 },
            { name: 'Nightmare',                 quantity: 2,   price: 1_200_000_000, volume: 50_000 },
            { name: 'Machariel',                 quantity: 3,   price: 500_000_000, volume: 50_000 },
            { name: 'Bhaalgorn',                 quantity: 2,   price: 1_500_000_000, volume: 50_000 },
            // ── T2 Battleships (50 000 m³, 1.5–2.5B ISK) ───────────────────
            { name: 'Golem',                     quantity: 1,   price: 1_800_000_000, volume: 50_000 },
            { name: 'Kronos',                    quantity: 1,   price: 2_000_000_000, volume: 50_000 },
            { name: 'Paladin',                   quantity: 1,   price: 2_100_000_000, volume: 50_000 },
            { name: 'Vargur',                    quantity: 1,   price: 1_900_000_000, volume: 50_000 },
            // ── T1 Battlecruisers (15 000 m³, 40–80M ISK) ───────────────────
            { name: 'Hurricane',                 quantity: 10,  price: 48_000_000,  volume: 15_000 },
            { name: 'Drake',                     quantity: 10,  price: 52_000_000,  volume: 15_000 },
            { name: 'Brutix',                    quantity: 8,   price: 46_000_000,  volume: 15_000 },
            { name: 'Prophecy',                  quantity: 8,   price: 50_000_000,  volume: 15_000 },
            { name: 'Ferox',                     quantity: 8,   price: 48_000_000,  volume: 15_000 },
            { name: 'Myrmidon',                  quantity: 8,   price: 47_000_000,  volume: 15_000 },
            // ── T2 Battlecruisers (15 000 m³, 300–450M ISK) ─────────────────
            { name: 'Sleipnir',                  quantity: 3,   price: 380_000_000, volume: 15_000 },
            { name: 'Vulture',                   quantity: 3,   price: 350_000_000, volume: 15_000 },
            { name: 'Astarte',                   quantity: 2,   price: 410_000_000, volume: 15_000 },
            { name: 'Eos',                       quantity: 2,   price: 390_000_000, volume: 15_000 },
            // ── Faction Battlecruisers (15 000 m³, 230–300M ISK) ────────────
            { name: 'Hurricane Fleet Issue',     quantity: 5,   price: 280_000_000, volume: 15_000 },
            { name: 'Drake Navy Issue',          quantity: 5,   price: 270_000_000, volume: 15_000 },
            { name: 'Brutix Navy Issue',         quantity: 5,   price: 255_000_000, volume: 15_000 },
            // ── T2 Cruisers — HAC (10 000 m³, 130–320M ISK) ─────────────────
            { name: 'Zealot',                    quantity: 6,   price: 131_000_000, volume: 10_000 },
            { name: 'Sacrilege',                 quantity: 5,   price: 155_000_000, volume: 10_000 },
            { name: 'Eagle',                     quantity: 5,   price: 220_000_000, volume: 10_000 },
            { name: 'Cerberus',                  quantity: 5,   price: 250_000_000, volume: 10_000 },
            { name: 'Vagabond',                  quantity: 5,   price: 200_000_000, volume: 10_000 },
            { name: 'Muninn',                    quantity: 5,   price: 150_000_000, volume: 10_000 },
            { name: 'Ishtar',                    quantity: 6,   price: 170_000_000, volume: 10_000 },
            { name: 'Deimos',                    quantity: 5,   price: 165_000_000, volume: 10_000 },
            // ── T2 Cruisers — Recon (10 000 m³, 250–310M ISK) ───────────────
            { name: 'Pilgrim',                   quantity: 3,   price: 280_000_000, volume: 10_000 },
            { name: 'Curse',                     quantity: 3,   price: 305_000_000, volume: 10_000 },
            { name: 'Huginn',                    quantity: 3,   price: 255_000_000, volume: 10_000 },
            { name: 'Rapier',                    quantity: 3,   price: 285_000_000, volume: 10_000 },
            // ── T2 Cruisers — Logistics (10 000 m³, 180–210M ISK) ───────────
            { name: 'Basilisk',                  quantity: 4,   price: 200_000_000, volume: 10_000 },
            { name: 'Scimitar',                  quantity: 4,   price: 185_000_000, volume: 10_000 },
            { name: 'Guardian',                  quantity: 4,   price: 195_000_000, volume: 10_000 },
            { name: 'Oneiros',                   quantity: 4,   price: 190_000_000, volume: 10_000 },
            // ── Faction Cruisers (10 000 m³, 190–360M ISK) ──────────────────
            { name: 'Stratios',                  quantity: 4,   price: 313_000_000, volume: 10_000 },
            { name: 'Gila',                      quantity: 6,   price: 197_000_000, volume: 10_000 },
            { name: 'Orthrus',                   quantity: 3,   price: 244_000_000, volume: 10_000 },
            { name: 'Vigilant',                  quantity: 3,   price: 305_000_000, volume: 10_000 },
            { name: 'Cynabal',                   quantity: 3,   price: 355_000_000, volume: 10_000 },
            { name: 'Ashimmu',                   quantity: 3,   price: 238_000_000, volume: 10_000 },
            { name: 'Phantasm',                  quantity: 3,   price: 233_000_000, volume: 10_000 },
            // ── T3 Cruisers (10 000 m³, 280–450M ISK) ───────────────────────
            { name: 'Tengu',                     quantity: 4,   price: 380_000_000, volume: 10_000 },
            { name: 'Loki',                      quantity: 4,   price: 350_000_000, volume: 10_000 },
            { name: 'Legion',                    quantity: 4,   price: 360_000_000, volume: 10_000 },
            { name: 'Proteus',                   quantity: 4,   price: 320_000_000, volume: 10_000 },
            // ── T1 Cruisers (10 000 m³, 7–12M ISK) ─────────────────────────
            { name: 'Caracal',                   quantity: 20,  price: 7_500_000,   volume: 10_000 },
            { name: 'Thorax',                    quantity: 20,  price: 8_000_000,   volume: 10_000 },
            { name: 'Rupture',                   quantity: 20,  price: 7_000_000,   volume: 10_000 },
            { name: 'Maller',                    quantity: 20,  price: 8_500_000,   volume: 10_000 },
            { name: 'Vexor',                     quantity: 20,  price: 9_000_000,   volume: 10_000 },
            // ── T2 Frigates (2 500 m³, 15–40M ISK) ─────────────────────────
            { name: 'Harpy',                     quantity: 10,  price: 22_000_000,  volume: 2_500 },
            { name: 'Hawk',                      quantity: 10,  price: 18_000_000,  volume: 2_500 },
            { name: 'Vengeance',                 quantity: 10,  price: 25_000_000,  volume: 2_500 },
            { name: 'Retribution',               quantity: 10,  price: 28_000_000,  volume: 2_500 },
            { name: 'Jaguar',                    quantity: 10,  price: 30_000_000,  volume: 2_500 },
            { name: 'Wolf',                      quantity: 10,  price: 32_000_000,  volume: 2_500 },
            { name: 'Enyo',                      quantity: 10,  price: 20_000_000,  volume: 2_500 },
            { name: 'Ishkur',                    quantity: 10,  price: 24_000_000,  volume: 2_500 },
            { name: 'Taranis',                   quantity: 10,  price: 22_000_000,  volume: 2_500 },
            { name: 'Ares',                      quantity: 10,  price: 16_000_000,  volume: 2_500 },
            { name: 'Stiletto',                  quantity: 10,  price: 18_000_000,  volume: 2_500 },
            { name: 'Crow',                      quantity: 10,  price: 20_000_000,  volume: 2_500 },
            // ── Faction Frigates (2 500 m³, 50–130M ISK) ────────────────────
            { name: 'Daredevil',                 quantity: 5,   price: 120_000_000, volume: 2_500 },
            { name: 'Dramiel',                   quantity: 5,   price: 55_000_000,  volume: 2_500 },
            { name: 'Worm',                      quantity: 10,  price: 58_000_000,  volume: 2_500 },
            { name: 'Succubus',                  quantity: 5,   price: 90_000_000,  volume: 2_500 },
            { name: 'Astero',                    quantity: 8,   price: 96_000_000,  volume: 2_500 },
            // ── T1 Destroyers (5 000 m³, 1.5–3M ISK) ───────────────────────
            { name: 'Catalyst',                  quantity: 30,  price: 1_500_000,   volume: 5_000 },
            { name: 'Thrasher',                  quantity: 30,  price: 1_600_000,   volume: 5_000 },
            { name: 'Cormorant',                 quantity: 20,  price: 2_000_000,   volume: 5_000 },
            { name: 'Coercer',                   quantity: 20,  price: 2_000_000,   volume: 5_000 },
            // ── T2 Destroyers / Interdictors (5 000 m³, 45–65M ISK) ─────────
            { name: 'Heretic',                   quantity: 5,   price: 45_000_000,  volume: 5_000 },
            { name: 'Flycatcher',                quantity: 5,   price: 50_000_000,  volume: 5_000 },
            { name: 'Eris',                      quantity: 5,   price: 55_000_000,  volume: 5_000 },
            { name: 'Sabre',                     quantity: 5,   price: 42_000_000,  volume: 5_000 },
            // ── Deadspace / Faction Modules (5–50 m³, 50M–500M ISK) ─────────
            { name: 'Pithum A-Type Med Shield Booster',  quantity: 10, price: 390_000_000, volume: 5  },
            { name: 'Pith A-Type XL Shield Booster',     quantity: 8,  price: 243_000_000, volume: 50 },
            { name: 'Gist X-Type 500MN MWD',             quantity: 5,  price: 420_000_000, volume: 10 },
            { name: 'Gist A-Type Large Shield Booster',  quantity: 6,  price: 280_000_000, volume: 10 },
            { name: 'Republic Fleet Gyrostabilizer',      quantity: 15, price: 85_000_000,  volume: 5  },
            { name: 'Shadow Serpentis Stasis Web',        quantity: 8,  price: 150_000_000, volume: 5  },
            { name: 'Federation Navy Web',                quantity: 10, price: 95_000_000,  volume: 5  },
            { name: 'Caldari Navy BCU',                   quantity: 12, price: 55_000_000,  volume: 5  },
            { name: 'Imperial Navy Heat Sink',            quantity: 12, price: 48_000_000,  volume: 5  },
            // ── T2 Modules (5–25 m³, 1–20M ISK) ────────────────────────────
            { name: 'Damage Control II',                 quantity: 50,  price: 2_000_000,   volume: 5  },
            { name: 'Warp Disruptor II',                 quantity: 50,  price: 1_200_000,   volume: 5  },
            { name: 'Warp Scrambler II',                 quantity: 50,  price: 900_000,     volume: 5  },
            { name: 'Stasis Webifier II',                quantity: 50,  price: 1_500_000,   volume: 5  },
            { name: '1MN Afterburner II',                quantity: 50,  price: 500_000,     volume: 5  },
            { name: '10MN Afterburner II',               quantity: 40,  price: 2_000_000,   volume: 5  },
            { name: '50MN Microwarpdrive II',            quantity: 30,  price: 6_000_000,   volume: 10 },
            { name: '500MN Microwarpdrive II',           quantity: 15,  price: 18_000_000,  volume: 10 },
            { name: 'Medium Shield Extender II',         quantity: 50,  price: 350_000,     volume: 10 },
            { name: 'Large Shield Extender II',          quantity: 30,  price: 700_000,     volume: 10 },
            { name: 'Energized Adaptive Nano Membrane II', quantity: 40, price: 4_500_000,  volume: 5  },
            { name: 'Adaptive Invulnerability Field II', quantity: 30,  price: 3_800_000,   volume: 10 },
            { name: 'Heavy Pulse Laser II',              quantity: 60,  price: 5_500_000,   volume: 10 },
            { name: 'Heavy Neutron Blaster II',          quantity: 60,  price: 6_000_000,   volume: 10 },
            { name: '425mm AutoCannon II',               quantity: 60,  price: 4_800_000,   volume: 10 },
            { name: 'Medium Armor Repairer II',          quantity: 40,  price: 1_800_000,   volume: 10 },
            { name: 'Large Armor Repairer II',           quantity: 20,  price: 4_000_000,   volume: 10 },
            { name: 'Capacitor Power Relay II',          quantity: 40,  price: 800_000,     volume: 5  },
            { name: 'Power Diagnostic System II',        quantity: 40,  price: 600_000,     volume: 5  },
            { name: 'Co-Processor II',                   quantity: 40,  price: 700_000,     volume: 5  },
            // ── Rigs — Small (2 m³, 0.3–3M ISK) ────────────────────────────
            { name: 'Small Trimark Armor Pump I',        quantity: 100, price: 400_000,     volume: 2  },
            { name: 'Small Core Defense Field Extender I', quantity: 100, price: 300_000,   volume: 2  },
            { name: 'Small Ancillary Current Router I',  quantity: 80,  price: 500_000,     volume: 2  },
            { name: 'Small Anti-Explosive Screen Reinf I', quantity: 80, price: 350_000,    volume: 2  },
            { name: 'Small Transverse Bulkhead I',       quantity: 60,  price: 600_000,     volume: 2  },
            { name: 'Small Explosive Armor Reinforcer I', quantity: 60, price: 250_000,     volume: 2  },
            // ── Rigs — Medium (5 m³, 1–15M ISK) ────────────────────────────
            { name: 'Medium Trimark Armor Pump I',       quantity: 50,  price: 2_500_000,   volume: 5  },
            { name: 'Medium Core Defense Field Extender I', quantity: 50, price: 1_800_000, volume: 5  },
            { name: 'Medium Ancillary Current Router I', quantity: 40,  price: 2_000_000,   volume: 5  },
            { name: 'Medium Anti-Explosive Screen Reinf I', quantity: 40, price: 1_500_000, volume: 5  },
            { name: 'Medium Capacitor Control Circuit I', quantity: 30, price: 3_500_000,   volume: 5  },
            { name: 'Medium Semiconductor Memory Cell I', quantity: 30, price: 4_000_000,   volume: 5  },
            // ── Rigs — Large (40 m³, 5–80M ISK) ────────────────────────────
            { name: 'Large Trimark Armor Pump I',        quantity: 20,  price: 4_000_000,   volume: 40 },
            { name: 'Large Core Defense Field Extender I', quantity: 20, price: 5_000_000,  volume: 40 },
            { name: 'Large Ancillary Current Router I',  quantity: 15,  price: 8_000_000,   volume: 40 },
            { name: 'Large Anti-Explosive Screen Reinf I', quantity: 15, price: 4_500_000,  volume: 40 },
            { name: 'Large Capacitor Control Circuit I', quantity: 10,  price: 12_000_000,  volume: 40 },
            // ── Drones — Light (5 m³, 0.1–2M ISK) ──────────────────────────
            { name: 'Hobgoblin II',                      quantity: 200, price: 200_000,     volume: 5  },
            { name: 'Acolyte II',                        quantity: 200, price: 200_000,     volume: 5  },
            { name: 'Warrior II',                        quantity: 200, price: 180_000,     volume: 5  },
            { name: 'Hornet EC-300',                     quantity: 100, price: 150_000,     volume: 5  },
            // ── Drones — Medium (10 m³, 0.5–5M ISK) ────────────────────────
            { name: 'Hammerhead II',                     quantity: 100, price: 550_000,     volume: 10 },
            { name: 'Infiltrator II',                    quantity: 100, price: 600_000,     volume: 10 },
            { name: 'Vespa EC-600',                      quantity: 80,  price: 450_000,     volume: 10 },
            { name: 'Valkyrie II',                       quantity: 80,  price: 500_000,     volume: 10 },
            // ── Drones — Heavy (25 m³, 1.5–20M ISK) ────────────────────────
            { name: 'Ogre II',                           quantity: 50,  price: 1_500_000,   volume: 25 },
            { name: 'Bouncer II',                        quantity: 30,  price: 2_200_000,   volume: 25 },
            { name: 'Berserker II',                      quantity: 50,  price: 1_800_000,   volume: 25 },
            // ── Sentry Drones (50 m³, 7–15M ISK) ───────────────────────────
            { name: 'Garde II',                          quantity: 30,  price: 8_000_000,   volume: 50 },
            { name: 'Curator II',                        quantity: 30,  price: 10_000_000,  volume: 50 },
            { name: 'Warden II',                         quantity: 30,  price: 9_000_000,   volume: 50 },
            { name: 'Wasp II',                           quantity: 30,  price: 12_000_000,  volume: 50 },
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
