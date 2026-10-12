import { formatNumber, InputError, readNumber } from "@/lib/format";
import { convertUnit } from "@/lib/units";
import { item, pack, type CalcDef } from "../types";

const wasteNote = "Add a waste allowance before you buy. A calculator cannot see offcuts, breakage, or a room that is not square.";

export const homeCalcs: CalcDef[] = [
  {
    slug: "paint-calculator",
    title: "Paint calculator",
    description: "Estimate paint for the walls of a rectangular room, after doors, windows, coats, and waste.",
    category: "home",
    keywords: ["paint", "how much paint", "wall area"],
    synonyms: ["paint litres"],
    affiliateTags: ["home", "paint-calculator"],
    inputs: [
      { id: "length", label: "Room length", type: "number", unit: "m", defaultValue: "4.2", required: true, min: 0 },
      { id: "width", label: "Room width", type: "number", unit: "m", defaultValue: "3.4", required: true, min: 0 },
      { id: "height", label: "Wall height", type: "number", unit: "m", defaultValue: "2.7", required: true, min: 0 },
      { id: "doors", label: "Doors", type: "number", defaultValue: "1", required: true, min: 0 },
      { id: "windows", label: "Windows", type: "number", defaultValue: "1", required: true, min: 0 },
      { id: "coats", label: "Coats", type: "number", defaultValue: "2", required: true, min: 1, max: 5 },
      { id: "coverage", label: "Coverage", type: "number", unit: "m²/L", defaultValue: "10", required: true, min: 1 },
      { id: "waste", label: "Waste allowance", type: "number", unit: "%", defaultValue: "10", required: true, min: 0 },
      { id: "ceiling", label: "Include ceiling", type: "select", defaultValue: "no", options: [{ value: "no", label: "Walls only" }, { value: "yes", label: "Walls and ceiling" }] },
    ],
    compute: (v) => {
      const length = readNumber(v, "length", "Length", { min: 0 });
      const width = readNumber(v, "width", "Width", { min: 0 });
      const height = readNumber(v, "height", "Height", { min: 0 });
      const doors = readNumber(v, "doors", "Doors", { min: 0 });
      const windows = readNumber(v, "windows", "Windows", { min: 0 });
      const coats = readNumber(v, "coats", "Coats", { min: 1, max: 5 });
      const coverage = readNumber(v, "coverage", "Coverage", { min: 1 });
      const waste = readNumber(v, "waste", "Waste", { min: 0 }) / 100;
      let area = 2 * (length + width) * height - doors * 0.9 * 2.1 - windows * 1.2 * 1.2;
      if (v.ceiling === "yes") area += length * width;
      if (area <= 0) throw new InputError("Openings are larger than the walls. Check the counts.");
      const litres = (area * coats * (1 + waste)) / coverage;
      return pack([
        item("Paint to buy", `${formatNumber(litres, 1)} litres`, true),
        item("Paintable area", `${formatNumber(area, 2)} m²`),
        item("Area with coats", `${formatNumber(area * coats, 2)} m²`),
      ], { notes: [wasteNote, "A door is assumed to be 0.9 × 2.1 m and a window 1.2 × 1.2 m. Change the result if yours differ by measuring the openings and subtracting them yourself."] });
    },
    formula: "Litres = (wall area − openings) × coats × (1 + waste) / coverage.",
    howItWorks: "Paint estimates fail when openings and a second coat are forgotten, or when the tin’s coverage is treated as a promise on a rough wall. This page uses a stated coverage and a waste allowance so both assumptions stay visible.",
    steps: ["Measure the room in metres.", "Count doors and windows.", "Use the coverage printed on the tin, and raise waste for a textured wall."],
    example: "A 4.2 × 3.4 m room with 2.7 m walls, one door, one window, two coats, and 10 m²/L needs a little over 8 litres before you round up to whole tins.",
    faqs: [
      { q: "Should I round up?", a: "Yes, to a tin size you can buy. The page shows litres, not tins." },
      { q: "Does colour change coverage?", a: "A large colour change can need an extra coat. Add a coat rather than trusting the label." },
    ],
    related: ["room-area-calculator", "wallpaper-calculator", "flooring-calculator"],
  },
  {
    slug: "flooring-calculator",
    title: "Flooring calculator",
    description: "Estimate flooring area and the number of planks from a plank size and a waste allowance.",
    category: "home",
    keywords: ["flooring", "planks", "laminate"],
    synonyms: ["wood floor calculator"],
    affiliateTags: ["home"],
    inputs: [
      { id: "length", label: "Room length", type: "number", unit: "m", defaultValue: "4.2", required: true, min: 0 },
      { id: "width", label: "Room width", type: "number", unit: "m", defaultValue: "3.4", required: true, min: 0 },
      { id: "plankL", label: "Plank length", type: "number", unit: "mm", defaultValue: "1200", required: true, min: 1 },
      { id: "plankW", label: "Plank width", type: "number", unit: "mm", defaultValue: "180", required: true, min: 1 },
      { id: "waste", label: "Waste", type: "number", unit: "%", defaultValue: "10", required: true, min: 0 },
    ],
    compute: (v) => {
      const area = readNumber(v, "length", "Length", { min: 0 }) * readNumber(v, "width", "Width", { min: 0 });
      const plank = (readNumber(v, "plankL", "Plank length", { min: 1 }) / 1000) * (readNumber(v, "plankW", "Plank width", { min: 1 }) / 1000);
      const waste = readNumber(v, "waste", "Waste", { min: 0 }) / 100;
      const needed = area * (1 + waste);
      return pack([
        item("Planks", formatNumber(Math.ceil(needed / plank), 0), true),
        item("Floor area", `${formatNumber(area, 2)} m²`),
        item("Area with waste", `${formatNumber(needed, 2)} m²`),
      ], { notes: [wasteNote, "Diagonal layouts usually need more waste than 10%."] });
    },
    formula: "Planks = ceil(room area × (1 + waste) / plank area).",
    howItWorks: "Flooring is bought in pieces, so the last partial plank still counts as a whole plank. Waste covers cuts against walls. A patterned or diagonal lay needs a larger allowance than a straight lay.",
    steps: ["Measure the room, not the nominal drawing, if the walls are out of square.", "Enter the plank size from the pack.", "Raise waste for diagonals and small rooms with many cuts."],
    example: "14.28 m² with 10% waste is 15.71 m². A 1.2 × 0.18 m plank covers 0.216 m², so you need 73 planks.",
    faqs: [
      { q: "Does this include underlay?", a: "Buy underlay for the room area, usually without the plank waste, unless the roll has its own offcut." },
      { q: "What about a doorway?", a: "Add that small area to the length and width product, or measure it separately and add the planks." },
    ],
    related: ["tile-calculator", "room-area-calculator", "square-feet-to-square-metres"],
  },
  {
    slug: "tile-calculator",
    title: "Tile calculator",
    description: "Estimate tiles and boxes for a floor or wall, including waste.",
    category: "home",
    keywords: ["tiles", "tile boxes", "how many tiles"],
    synonyms: ["tiling calculator"],
    affiliateTags: ["home"],
    inputs: [
      { id: "area", label: "Area to tile", type: "number", unit: "m²", defaultValue: "12", required: true, min: 0 },
      { id: "tile", label: "Tile size", type: "number", unit: "cm", defaultValue: "60", required: true, min: 1, help: "Square tile edge. For a rectangle, enter the side that makes the area match, or calculate area first." },
      { id: "other", label: "Other tile edge", type: "number", unit: "cm", defaultValue: "60", required: true, min: 1 },
      { id: "box", label: "Tiles per box", type: "number", defaultValue: "4", required: true, min: 1 },
      { id: "waste", label: "Waste", type: "number", unit: "%", defaultValue: "10", required: true, min: 0 },
    ],
    compute: (v) => {
      const area = readNumber(v, "area", "Area", { min: 0 });
      const tileArea = (readNumber(v, "tile", "Tile edge", { min: 1 }) / 100) * (readNumber(v, "other", "Other edge", { min: 1 }) / 100);
      const waste = readNumber(v, "waste", "Waste", { min: 0 }) / 100;
      const tiles = Math.ceil((area * (1 + waste)) / tileArea);
      const perBox = readNumber(v, "box", "Tiles per box", { min: 1, integer: true });
      return pack([
        item("Tiles", formatNumber(tiles, 0), true),
        item("Boxes", formatNumber(Math.ceil(tiles / perBox), 0)),
        item("Tile area", `${formatNumber(tileArea, 4)} m²`),
      ], { notes: [wasteNote] });
    },
    formula: "Tiles = ceil(area × (1 + waste) / tile area). Boxes = ceil(tiles / tiles per box).",
    howItWorks: "Tile counts round up because a cut tile still comes from a whole tile. Boxes round up again. Buying the exact calculated area with no waste is a common reason a job stops one box short.",
    steps: ["Measure the area after subtracting places you will not tile, or use the room-area page.", "Enter both tile edges in centimetres.", "Use the tiles-per-box figure from the supplier."],
    example: "12 m² with 10% waste and 60 cm tiles needs 37 tiles. At 4 per box, that is 10 boxes.",
    faqs: [
      { q: "Do grout joints change the count?", a: "A wide joint slightly reduces the count. Waste usually matters more. This page does not subtract joints." },
      { q: "Should I keep a spare box?", a: "A spare is useful for later repairs. It is not included unless you raise the waste." },
    ],
    related: ["flooring-calculator", "room-area-calculator", "paint-calculator"],
  },
  {
    slug: "concrete-calculator",
    title: "Concrete calculator",
    description: "Estimate wet volume, dry volume, cement bags, sand, and aggregate for a rectangular pour.",
    category: "home",
    keywords: ["concrete", "cement bags", "m3 concrete"],
    synonyms: ["concrete volume"],
    inputs: [
      { id: "length", label: "Length", type: "number", unit: "m", defaultValue: "4", required: true, min: 0 },
      { id: "width", label: "Width", type: "number", unit: "m", defaultValue: "3", required: true, min: 0 },
      { id: "depth", label: "Depth", type: "number", unit: "m", defaultValue: "0.1", required: true, min: 0 },
      { id: "mix", label: "Mix", type: "select", defaultValue: "1:1.5:3", options: [
        { value: "1:1.5:3", label: "1 : 1.5 : 3" },
        { value: "1:2:4", label: "1 : 2 : 4" },
        { value: "1:3:6", label: "1 : 3 : 6" },
      ] },
    ],
    compute: (v) => {
      const wet = readNumber(v, "length", "Length", { min: 0 }) * readNumber(v, "width", "Width", { min: 0 }) * readNumber(v, "depth", "Depth", { min: 0 });
      const dry = wet * 1.54;
      const parts = (v.mix || "1:1.5:3").split(":").map(Number);
      const sum = parts.reduce((s, n) => s + n, 0);
      const cement = (dry * parts[0]) / sum;
      const bags = cement / 0.035;
      return pack([
        item("Wet volume", `${formatNumber(wet, 3)} m³`, true),
        item("Dry volume", `${formatNumber(dry, 3)} m³`, false, "Wet volume × 1.54"),
        item("Cement", `${formatNumber(Math.ceil(bags), 0)} bags`, false, "50 kg bags, 0.035 m³ each, rounded up"),
        item("Sand", `${formatNumber((dry * parts[1]) / sum, 3)} m³`),
        item("Aggregate", `${formatNumber((dry * parts[2]) / sum, 3)} m³`),
      ], { notes: ["This is a planning estimate for a rectangular pour. A structural element needs an engineer’s specification, not a website mix."] });
    },
    formula: "Wet volume = length × width × depth. Dry volume ≈ wet × 1.54. Cement volume = dry × cement parts / total parts.",
    howItWorks: "Wet concrete occupies less volume than the dry materials because of voids. A 1.54 factor is a common allowance, not a law of physics. Bag volume of 0.035 m³ for a 50 kg bag is another planning convention. Both are stated so a site engineer can replace them.",
    steps: ["Measure the pour in metres. Convert centimetres before entering depth.", "Choose a mix only as a planning default.", "Order a little extra for spillage, and do not use the result as a structural design."],
    example: "4 × 3 × 0.1 m is 1.2 m³ wet, about 1.85 m³ dry.",
    faqs: [
      { q: "Why multiply by 1.54?", a: "It is a dry-volume allowance for voids. Some estimators use 1.5. The factor is disclosed." },
      { q: "Can I use this for a column?", a: "Only for a rough volume. Reinforcement and specification are outside this page." },
    ],
    related: ["cement-sand-calculator", "brick-calculator", "room-area-calculator"],
  },
  {
    slug: "brick-calculator",
    title: "Brick calculator",
    description: "Estimate bricks for a wall from brick size and a mortar joint.",
    category: "home",
    keywords: ["bricks", "brick wall", "how many bricks"],
    synonyms: ["brick count"],
    inputs: [
      { id: "length", label: "Wall length", type: "number", unit: "m", defaultValue: "6", required: true, min: 0 },
      { id: "height", label: "Wall height", type: "number", unit: "m", defaultValue: "2.6", required: true, min: 0 },
      { id: "thick", label: "Wall thickness", type: "number", unit: "m", defaultValue: "0.23", required: true, min: 0.05 },
      { id: "brickL", label: "Brick length", type: "number", unit: "mm", defaultValue: "190", required: true, min: 1 },
      { id: "brickW", label: "Brick width", type: "number", unit: "mm", defaultValue: "90", required: true, min: 1 },
      { id: "brickH", label: "Brick height", type: "number", unit: "mm", defaultValue: "90", required: true, min: 1 },
      { id: "joint", label: "Mortar joint", type: "number", unit: "mm", defaultValue: "10", required: true, min: 0 },
    ],
    compute: (v) => {
      const wall = readNumber(v, "length", "Length", { min: 0 }) * readNumber(v, "height", "Height", { min: 0 }) * readNumber(v, "thick", "Thickness", { min: 0.05 });
      const joint = readNumber(v, "joint", "Joint", { min: 0 });
      const brick = ((readNumber(v, "brickL", "Length", { min: 1 }) + joint) * (readNumber(v, "brickW", "Width", { min: 1 }) + joint) * (readNumber(v, "brickH", "Height", { min: 1 }) + joint)) / 1e9;
      const count = Math.ceil(wall / brick);
      return pack([
        item("Bricks", formatNumber(count, 0), true),
        item("Wall volume", `${formatNumber(wall, 3)} m³`),
        item("Bricks per m³", formatNumber(1 / brick, 0)),
      ], { notes: ["Openings are not deducted. Subtract their volume, or about 500 bricks per m³ as a cross-check for a standard modular brick with mortar."] });
    },
    formula: "Bricks = wall volume / (brick length + joint) × (width + joint) × (height + joint).",
    howItWorks: "A brick count depends on the brick plus the mortar that surrounds it, not the brick alone. A 190 × 90 × 90 mm brick with a 10 mm joint occupies a 200 × 100 × 100 mm space. The page uses the dimensions you enter rather than assuming one regional brick.",
    steps: ["Measure the wall.", "Enter the actual brick, not a nominal name.", "Deduct doors and windows before you buy, or add their bricks back only if they will be bricked."],
    example: "A 6 × 2.6 × 0.23 m wall is about 3.59 m³. At 500 bricks per m³ that is about 1,794 bricks before openings.",
    faqs: [
      { q: "Why might a supplier use 500 per m³?", a: "That is a rule of thumb for a common modular brick with mortar. This page calculates from your dimensions and can be compared with that rule." },
      { q: "Does it include wastage?", a: "No. Add 5% or so for breakage if the site is rough." },
    ],
    related: ["cement-sand-calculator", "concrete-calculator", "paint-calculator"],
  },
  {
    slug: "cement-sand-calculator",
    title: "Cement and sand estimator",
    description: "Estimate cement and sand for plaster from area, thickness, and a mix ratio.",
    category: "home",
    keywords: ["cement sand", "plaster", "mortar"],
    synonyms: ["plaster calculator"],
    inputs: [
      { id: "area", label: "Area", type: "number", unit: "m²", defaultValue: "40", required: true, min: 0 },
      { id: "thickness", label: "Thickness", type: "number", unit: "mm", defaultValue: "12", required: true, min: 1 },
      { id: "sandParts", label: "Sand parts per 1 part cement", type: "number", defaultValue: "4", required: true, min: 1, max: 8 },
    ],
    compute: (v) => {
      const wet = readNumber(v, "area", "Area", { min: 0 }) * (readNumber(v, "thickness", "Thickness", { min: 1 }) / 1000);
      const dry = wet * 1.35;
      const sandParts = readNumber(v, "sandParts", "Sand parts", { min: 1, max: 8 });
      const cement = dry / (1 + sandParts);
      const sand = dry * sandParts / (1 + sandParts);
      return pack([
        item("Cement bags", formatNumber(Math.ceil(cement / 0.035), 0), true),
        item("Sand", `${formatNumber(sand, 3)} m³`),
        item("Wet volume", `${formatNumber(wet, 3)} m³`),
        item("Dry volume", `${formatNumber(dry, 3)} m³`),
      ], { notes: ["Dry volume uses a 1.35 factor for plaster. A 50 kg bag is taken as 0.035 m³. Confirm both with the specification."] });
    },
    formula: "Wet volume = area × thickness. Dry volume ≈ wet × 1.35. Cement = dry / (1 + sand parts).",
    howItWorks: "Plaster quantities are a volume split by the mix ratio after a dry-volume allowance. The page is for planning a rectangular area of even thickness. It is not a substitute for a masonry specification.",
    steps: ["Measure the area to be plastered.", "Enter the specified thickness in millimetres.", "Use the mix ratio from the specification, often 1:4 or 1:6."],
    example: "40 m² at 12 mm is 0.48 m³ wet. A 1:4 mix then splits the dry volume into cement and sand.",
    faqs: [
      { q: "Is 1.35 always right?", a: "It is a common plaster allowance. Concrete on the other page uses 1.54. Do not swap them silently." },
      { q: "Does this include wastage?", a: "No. Add site waste separately." },
    ],
    related: ["concrete-calculator", "brick-calculator", "paint-calculator"],
  },
  {
    slug: "roofing-calculator",
    title: "Roofing calculator",
    description: "Estimate sloped roof area from a footprint, overhang, and pitch.",
    category: "home",
    keywords: ["roof area", "roof pitch", "roofing"],
    synonyms: ["roof calculator"],
    inputs: [
      { id: "length", label: "Building length", type: "number", unit: "m", defaultValue: "10", required: true, min: 0 },
      { id: "width", label: "Building width", type: "number", unit: "m", defaultValue: "6", required: true, min: 0 },
      { id: "overhang", label: "Overhang each side", type: "number", unit: "m", defaultValue: "0.3", required: true, min: 0 },
      { id: "rise", label: "Rise", type: "number", unit: "m", defaultValue: "1", required: true, min: 0 },
      { id: "run", label: "Run", type: "number", unit: "m", defaultValue: "3", required: true, min: 0.01 },
      { id: "waste", label: "Waste", type: "number", unit: "%", defaultValue: "10", required: true, min: 0 },
    ],
    compute: (v) => {
      const length = readNumber(v, "length", "Length", { min: 0 }) + 2 * readNumber(v, "overhang", "Overhang", { min: 0 });
      const width = readNumber(v, "width", "Width", { min: 0 }) + 2 * readNumber(v, "overhang", "Overhang", { min: 0 });
      const rise = readNumber(v, "rise", "Rise", { min: 0 });
      const run = readNumber(v, "run", "Run", { min: 0.01 });
      const pitch = Math.atan(rise / run);
      const area = (length * width) / Math.cos(pitch);
      const waste = readNumber(v, "waste", "Waste", { min: 0 }) / 100;
      return pack([
        item("Roof area with waste", `${formatNumber(area * (1 + waste), 2)} m²`, true),
        item("Sloped area", `${formatNumber(area, 2)} m²`),
        item("Pitch", `${formatNumber((pitch * 180) / Math.PI, 1)}°`),
        item("Footprint with overhang", `${formatNumber(length * width, 2)} m²`),
      ], { notes: ["A simple gable or hip is more complicated than a single pitch factor. Use this for a planning area, then confirm with a roofer."] });
    },
    formula: "Sloped area ≈ footprint / cos(pitch), where pitch = arctan(rise / run).",
    howItWorks: "A sloping roof has more area than the building footprint. Dividing by the cosine of the pitch stretches the plan area. Overhangs are added before that stretch. Valleys, hips, and dormers need extra material this single factor does not draw.",
    steps: ["Enter the building size and the overhang.", "Enter rise and run from the same triangle.", "Add waste for cuts, then ask a roofer to confirm a complex roof."],
    example: "A 10 × 6 m building with 0.3 m overhangs and a 1-in-3 rise has a larger sloped area than 60 m².",
    faqs: [
      { q: "Is this a materials list?", a: "No. It is an area. Sheets and tiles have their own coverage and lap." },
      { q: "What if the roof has two pitches?", a: "Calculate each plane and add them." },
    ],
    related: ["room-area-calculator", "paint-calculator", "flooring-calculator"],
  },
  {
    slug: "wallpaper-calculator",
    title: "Wallpaper calculator",
    description: "Estimate rolls from wall size, roll size, and pattern repeat.",
    category: "home",
    keywords: ["wallpaper", "rolls", "pattern repeat"],
    synonyms: ["wallpaper rolls"],
    inputs: [
      { id: "length", label: "Room length", type: "number", unit: "m", defaultValue: "4", required: true, min: 0 },
      { id: "width", label: "Room width", type: "number", unit: "m", defaultValue: "3", required: true, min: 0 },
      { id: "height", label: "Wall height", type: "number", unit: "m", defaultValue: "2.5", required: true, min: 0 },
      { id: "rollW", label: "Roll width", type: "number", unit: "m", defaultValue: "0.53", required: true, min: 0.1 },
      { id: "rollL", label: "Roll length", type: "number", unit: "m", defaultValue: "10", required: true, min: 0.1 },
      { id: "repeat", label: "Pattern repeat", type: "number", unit: "m", defaultValue: "0", required: true, min: 0 },
    ],
    compute: (v) => {
      const perimeter = 2 * (readNumber(v, "length", "Length", { min: 0 }) + readNumber(v, "width", "Width", { min: 0 }));
      const height = readNumber(v, "height", "Height", { min: 0 });
      const rollW = readNumber(v, "rollW", "Roll width", { min: 0.1 });
      const rollL = readNumber(v, "rollL", "Roll length", { min: 0.1 });
      const repeat = readNumber(v, "repeat", "Repeat", { min: 0 });
      const drop = repeat > 0 ? Math.ceil(height / repeat) * repeat : height;
      const strips = Math.ceil(perimeter / rollW);
      const perRoll = Math.floor(rollL / drop);
      if (perRoll < 1) throw new InputError("One drop is longer than the roll. Check the roll length and repeat.");
      return pack([
        item("Rolls", formatNumber(Math.ceil(strips / perRoll), 0), true),
        item("Strips", formatNumber(strips, 0)),
        item("Drop length", `${formatNumber(drop, 2)} m`),
        item("Strips per roll", formatNumber(perRoll, 0)),
      ], { notes: ["Doors and windows are not deducted. Pattern matching can use more paper than the drop length suggests."] });
    },
    formula: "Strips = ceil(perimeter / roll width). Rolls = ceil(strips / strips per roll).",
    howItWorks: "Wallpaper is cut in drops. A pattern repeat means each drop may need to be longer than the wall so the pattern aligns. The page rounds the drop up to a whole repeat, then sees how many drops fit in a roll.",
    steps: ["Measure the perimeter and the full height you will paper.", "Enter the roll size from the label.", "Enter the pattern repeat, or zero for a plain paper."],
    example: "A 4 × 3 m room has a 14 m perimeter. At 0.53 m wide, that is 27 strips before openings.",
    faqs: [
      { q: "Should I subtract the door?", a: "A door may save part of a strip, but the strip is often still cut. Do not subtract unless you are sure the strip is omitted." },
      { q: "Why buy an extra roll?", a: "Dye lots differ. An extra roll from the same batch is a repair, not waste." },
    ],
    related: ["paint-calculator", "room-area-calculator", "tile-calculator"],
  },
  {
    slug: "room-area-calculator",
    title: "Room area calculator",
    description: "Calculate floor area, perimeter, and volume of a rectangular room.",
    category: "home",
    keywords: ["room area", "floor area", "perimeter"],
    synonyms: ["room size"],
    inputs: [
      { id: "length", label: "Length", type: "number", unit: "m", defaultValue: "4.5", required: true, min: 0 },
      { id: "width", label: "Width", type: "number", unit: "m", defaultValue: "3.2", required: true, min: 0 },
      { id: "height", label: "Height", type: "number", unit: "m", defaultValue: "2.7", required: true, min: 0 },
    ],
    compute: (v) => {
      const length = readNumber(v, "length", "Length", { min: 0 });
      const width = readNumber(v, "width", "Width", { min: 0 });
      const height = readNumber(v, "height", "Height", { min: 0 });
      const area = length * width;
      return pack([
        item("Floor area", `${formatNumber(area, 2)} m²`, true),
        item("Square feet", formatNumber(area / 0.09290304, 1)),
        item("Perimeter", `${formatNumber(2 * (length + width), 2)} m`),
        item("Volume", `${formatNumber(area * height, 2)} m³`),
      ]);
    },
    formula: "Area = length × width. Perimeter = 2(length + width). Volume = area × height.",
    howItWorks: "A rectangular-room estimate is the starting point for paint, flooring, and cooling load. Real rooms have bays and slopes. Measure each rectangle and add them if the room is L-shaped.",
    steps: ["Measure to the faces you will cover.", "Enter metres.", "Use the square-foot line only as a conversion of the same area."],
    example: "4.5 × 3.2 m is 14.4 m², about 155 square feet, with a perimeter of 15.4 m.",
    faqs: [
      { q: "What about an L-shaped room?", a: "Split it into two rectangles and add the areas. Do not multiply the overall length by the overall width." },
      { q: "Does height affect floor area?", a: "No. It is used only for volume." },
    ],
    related: ["square-feet-to-square-metres", "paint-calculator", "flooring-calculator"],
  },
  {
    slug: "electricity-bill-calculator",
    title: "Electricity bill estimator",
    description: "Estimate a bill from units, a single rate or a two-slab rate, and a fixed charge.",
    category: "home",
    keywords: ["electricity bill", "units", "tariff"],
    synonyms: ["power bill"],
    inputs: [
      { id: "units", label: "Units", type: "number", unit: "kWh", defaultValue: "280", required: true, min: 0 },
      { id: "rate", label: "Rate", type: "number", unit: "per kWh", defaultValue: "8", required: true, min: 0 },
      { id: "slab", label: "First-slab units", type: "number", defaultValue: "100", required: true, min: 0 },
      { id: "rate2", label: "Rate after the slab", type: "number", unit: "per kWh", defaultValue: "10", required: true, min: 0 },
      { id: "fixed", label: "Fixed charge", type: "number", defaultValue: "100", required: true, min: 0 },
    ],
    compute: (v) => {
      const units = readNumber(v, "units", "Units", { min: 0 });
      const first = Math.min(units, readNumber(v, "slab", "Slab", { min: 0 }));
      const rest = units - first;
      const energy = first * readNumber(v, "rate", "First rate", { min: 0 }) + rest * readNumber(v, "rate2", "Second rate", { min: 0 });
      const fixed = readNumber(v, "fixed", "Fixed charge", { min: 0 });
      return pack([
        item("Estimated bill", formatNumber(energy + fixed, 2), true),
        item("Energy charge", formatNumber(energy, 2)),
        item("Fixed charge", formatNumber(fixed, 2)),
      ], { notes: ["Real tariffs can have more slabs, fuel adjustments, and taxes. Enter the rates from your bill. This is not a utility quote."] });
    },
    formula: "Bill = units in slab × rate 1 + remaining units × rate 2 + fixed charge.",
    howItWorks: "A two-slab sketch is enough to see why the next unit can cost more than the average unit. It is not your distributor’s full tariff. Taxes and adjustments should be added from the bill if you need a payable total.",
    steps: ["Read the units from the meter or the bill.", "Enter the two rates and the slab size. Set them equal if your tariff is flat.", "Add the fixed charge."],
    example: "280 units with 100 at 8 and 180 at 10, plus 100 fixed, is 2,700.",
    faqs: [
      { q: "Where are the official slabs?", a: "On your distributor’s tariff order. They differ by state and consumer category. Do not treat the defaults as a tariff." },
      { q: "Does this include tax?", a: "Only if you gross up the rate yourself. The page does not add a hidden tax." },
    ],
    related: ["electricity-consumption-calculator", "solar-panel-calculator", "water-consumption-calculator"],
  },
  {
    slug: "electricity-consumption-calculator",
    title: "Electricity consumption calculator",
    description: "Estimate kWh and cost for one appliance, or a short list of appliances.",
    category: "home",
    keywords: ["electricity consumption", "kwh", "appliance energy"],
    synonyms: ["power consumption"],
    inputs: [
      { id: "rows", label: "Appliances", type: "textarea", defaultValue: "Fridge, 150, 24\nFan, 75, 8\nLaptop, 60, 6", required: true, rows: 5, help: "One per line: name, watts, hours per day." },
      { id: "days", label: "Days", type: "number", defaultValue: "30", required: true, min: 1 },
      { id: "tariff", label: "Tariff", type: "number", unit: "per kWh", defaultValue: "8", required: true, min: 0 },
    ],
    compute: (v) => {
      const days = readNumber(v, "days", "Days", { min: 1 });
      const tariff = readNumber(v, "tariff", "Tariff", { min: 0 });
      const lines = (v.rows || "").split(/\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length === 0) throw new InputError("Enter at least one appliance.");
      let kwh = 0;
      const rows = lines.map((line, index) => {
        const bits = line.split(",").map((bit) => bit.trim());
        if (bits.length < 3) throw new InputError(`Line ${index + 1} needs a name, watts, and hours.`);
        const watts = Number(bits[1]);
        const hours = Number(bits[2]);
        if (!Number.isFinite(watts) || !Number.isFinite(hours) || watts < 0 || hours < 0) throw new InputError(`Line ${index + 1} has an invalid number.`);
        const energy = (watts * hours * days) / 1000;
        kwh += energy;
        return [bits[0], formatNumber(energy, 2)];
      });
      return pack([
        item("Energy", `${formatNumber(kwh, 2)} kWh`, true),
        item("Estimated cost", formatNumber(kwh * tariff, 2)),
      ], { table: { caption: "Energy by appliance", headers: ["Appliance", "kWh"], rows }, notes: ["Nameplate watts are a maximum or a rating, not always the power drawn. A tariff is an input, not a utility rate."] });
    },
    formula: "kWh = watts × hours × days / 1,000.",
    howItWorks: "Energy is power times time. A 1,000 watt load for one hour is one kilowatt-hour. Listing appliances separately shows which device dominates the bill. Standby loads are missing unless you add them.",
    steps: ["Enter each appliance’s watts and typical hours.", "Set the number of days.", "Multiply by the tariff from your bill if you want a cost."],
    example: "A 150 W fridge for 24 hours uses 3.6 kWh a day, or 108 kWh in 30 days, before its real duty cycle.",
    faqs: [
      { q: "Why is my fridge not using its nameplate all day?", a: "The compressor cycles. Nameplate watts overstate average draw. Lower the hours or the watts if you have a measured figure." },
      { q: "Are line losses included?", a: "No. This is appliance energy, not a meter bill." },
    ],
    related: ["electricity-bill-calculator", "solar-panel-calculator", "energy-converter"],
  },
  {
    slug: "solar-panel-calculator",
    title: "Solar panel sizing estimator",
    description: "Estimate a PV array size from daily energy use, peak sun hours, and system efficiency.",
    category: "home",
    keywords: ["solar", "pv size", "solar panels"],
    synonyms: ["solar calculator"],
    inputs: [
      { id: "daily", label: "Daily energy use", type: "number", unit: "kWh", defaultValue: "8", required: true, min: 0 },
      { id: "sun", label: "Peak sun hours", type: "number", defaultValue: "5", required: true, min: 1, max: 8 },
      { id: "efficiency", label: "System efficiency", type: "number", unit: "%", defaultValue: "75", required: true, min: 40, max: 95 },
      { id: "panel", label: "Panel wattage", type: "number", unit: "W", defaultValue: "400", required: true, min: 50 },
    ],
    compute: (v) => {
      const daily = readNumber(v, "daily", "Daily use", { min: 0 });
      const sun = readNumber(v, "sun", "Sun hours", { min: 1, max: 8 });
      const efficiency = readNumber(v, "efficiency", "Efficiency", { min: 40, max: 95 }) / 100;
      const panel = readNumber(v, "panel", "Panel", { min: 50 });
      const kw = daily / (sun * efficiency);
      const panels = Math.ceil((kw * 1000) / panel);
      return pack([
        item("Array size", `${formatNumber(kw, 2)} kW`, true),
        item("Panels", formatNumber(panels, 0)),
        item("Nameplate total", `${formatNumber((panels * panel) / 1000, 2)} kW`),
      ], { notes: ["Peak sun hours are a site figure, not a promise of five sunny hours. Shading, roof direction, and export limits are not modelled. This is not an installation design."] });
    },
    formula: "Array kW = daily kWh / (peak sun hours × efficiency).",
    howItWorks: "A panel’s wattage is a laboratory rating. On a roof it produces less because of heat, inverter loss, dirt, and the sun’s path. Dividing daily need by sun hours and an efficiency factor turns that into a planning size. A designer still has to place the panels.",
    steps: ["Use a month of meter data, not one hot day.", "Set sun hours for your location. Five is only a starting illustration.", "Lower efficiency if the roof is shaded or faces away from the sun."],
    example: "8 kWh a day, 5 peak sun hours, and 75% efficiency suggest about a 2.13 kW array, or 6 panels of 400 W after rounding up.",
    faqs: [
      { q: "Will this take me off the grid?", a: "No. The page does not size batteries or a backup. It estimates an array for the daily energy you entered." },
      { q: "Is 75% realistic?", a: "It is a planning factor, not a measured performance ratio. A good unshaded system may do better. A shaded one will do worse." },
    ],
    related: ["electricity-consumption-calculator", "electricity-bill-calculator", "energy-converter"],
  },
  {
    slug: "water-consumption-calculator",
    title: "Water consumption calculator",
    description: "Estimate household water use from people, a per-person allowance, and days.",
    category: "home",
    keywords: ["water consumption", "litres per day", "household water"],
    synonyms: ["water usage"],
    inputs: [
      { id: "people", label: "People", type: "number", defaultValue: "4", required: true, min: 1, max: 50 },
      { id: "litres", label: "Litres per person per day", type: "number", defaultValue: "135", required: true, min: 20, max: 400 },
      { id: "days", label: "Days", type: "number", defaultValue: "30", required: true, min: 1 },
      { id: "tank", label: "Tank size", type: "number", unit: "litres", defaultValue: "1000", required: true, min: 1 },
    ],
    compute: (v) => {
      const litres = readNumber(v, "people", "People", { min: 1 }) * readNumber(v, "litres", "Allowance", { min: 20, max: 400 }) * readNumber(v, "days", "Days", { min: 1 });
      const tank = readNumber(v, "tank", "Tank", { min: 1 });
      return pack([
        item("Water used", `${formatNumber(litres, 0)} litres`, true),
        item("Cubic metres", formatNumber(litres / 1000, 2)),
        item("Tank refills", formatNumber(litres / tank, 1)),
      ], { notes: ["135 litres per person per day is a common planning figure, not a measurement of your home. Garden and leakage can dominate."] });
    },
    formula: "Litres = people × litres per person per day × days.",
    howItWorks: "A per-person allowance is a planning average. It is useful for sizing a tank or reading a bill, and weak as a judgement of a household. The refill count shows how often a tank of the size you enter would be emptied at that rate.",
    steps: ["Count the people who actually live there.", "Change 135 if you know your own daily use.", "Enter the tank size if you want a refill count."],
    example: "4 people at 135 litres for 30 days use 16,200 litres, or 16.2 tank-fills of 1,000 litres.",
    faqs: [
      { q: "Is 135 litres a standard?", a: "It is widely used in Indian planning discussions. Your municipality and your habits can differ." },
      { q: "Does this include a garden?", a: "Only if you raise the allowance. A hose can use more than the people." },
    ],
    related: ["tank-volume-calculator", "electricity-bill-calculator", "room-area-calculator"],
  },
  {
    slug: "tank-volume-calculator",
    title: "Tank volume calculator",
    description: "Calculate the capacity of a rectangular or vertical cylindrical tank.",
    category: "home",
    keywords: ["tank volume", "water tank", "litres"],
    synonyms: ["cistern calculator"],
    inputs: [
      { id: "shape", label: "Shape", type: "select", defaultValue: "rect", options: [
        { value: "rect", label: "Rectangular" },
        { value: "cyl", label: "Vertical cylinder" },
      ] },
      { id: "a", label: "Length or diameter", type: "number", unit: "m", defaultValue: "1", required: true, min: 0 },
      { id: "b", label: "Width", type: "number", unit: "m", defaultValue: "1", min: 0, showIf: { field: "shape", equals: "rect" } },
      { id: "h", label: "Height", type: "number", unit: "m", defaultValue: "1", required: true, min: 0 },
    ],
    compute: (v) => {
      const a = readNumber(v, "a", "First dimension", { min: 0 });
      const h = readNumber(v, "h", "Height", { min: 0 });
      const m3 = v.shape === "cyl" ? Math.PI * (a / 2) ** 2 * h : a * readNumber(v, "b", "Width", { min: 0 }) * h;
      return pack([
        item("Capacity", `${formatNumber(m3 * 1000, 0)} litres`, true),
        item("Cubic metres", formatNumber(m3, 3)),
      ], { notes: ["This is the full internal volume. A tank is not usually filled to the brim, and wall thickness is not deducted."] });
    },
    formula: "Rectangular volume = length × width × height. Cylinder volume = πr²h. Litres = cubic metres × 1,000.",
    howItWorks: "Capacity is internal volume. Measure inside the tank if you can. A nominal 1,000 litre tank may not hold 1,000 litres once fittings and freeboard are allowed for.",
    steps: ["Choose the shape.", "For a cylinder, the first field is the diameter.", "Multiply cubic metres by 1,000 for litres."],
    example: "A 1 × 1 × 1 m tank holds 1,000 litres if the measurements are internal.",
    faqs: [
      { q: "What about a horizontal cylinder?", a: "A full horizontal cylinder has the same volume. A partly filled one needs a different formula and is not estimated here." },
      { q: "Should I include the lid thickness?", a: "No. Use internal dimensions." },
    ],
    related: ["water-consumption-calculator", "volume-converter", "concrete-calculator"],
  },
  {
    slug: "land-area-converter",
    title: "Land area converter",
    description: "Convert among square metres, acres, hectares, and labelled regional units such as guntha and bigha.",
    category: "home",
    keywords: ["land area", "bigha", "guntha", "acre"],
    synonyms: ["plot area"],
    inputs: [
      { id: "value", label: "Value", type: "number", defaultValue: "1", required: true },
      { id: "from", label: "From", type: "select", defaultValue: "acre", options: [
        { value: "m2", label: "Square metres" },
        { value: "ft2", label: "Square feet" },
        { value: "acre", label: "Acres" },
        { value: "ha", label: "Hectares" },
        { value: "guntha", label: "Guntha (Maharashtra, 121 sq yd)" },
        { value: "bigha-up", label: "Bigha (Uttar Pradesh, 27,225 sq ft)" },
        { value: "bigha-wb", label: "Bigha (West Bengal, 14,400 sq ft)" },
      ] },
      { id: "to", label: "To", type: "select", defaultValue: "m2", options: [
        { value: "m2", label: "Square metres" },
        { value: "ft2", label: "Square feet" },
        { value: "acre", label: "Acres" },
        { value: "ha", label: "Hectares" },
        { value: "guntha", label: "Guntha (Maharashtra, 121 sq yd)" },
        { value: "bigha-up", label: "Bigha (Uttar Pradesh, 27,225 sq ft)" },
        { value: "bigha-wb", label: "Bigha (West Bengal, 14,400 sq ft)" },
      ] },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Value");
      const converted = convertUnit("land", value, v.from || "acre", v.to || "m2");
      return pack([
        item("Converted area", formatNumber(converted, 4), true),
        item("Square metres", formatNumber(convertUnit("land", value, v.from || "acre", "m2"), 2)),
        item("Acres", formatNumber(convertUnit("land", value, v.from || "acre", "acre"), 4)),
      ], { notes: ["Bigha, guntha, and similar units vary by region. The option label states the convention used. Do not use an unlabelled bigha in a deed."] });
    },
    formula: "Convert to square metres with the labelled factor, then to the target unit.",
    howItWorks: "International units such as the acre and hectare have standard definitions. Several South Asian land units do not. This page refuses a generic bigha and instead offers two labelled conventions. If your local unit differs, convert from the square-foot definition in the deed.",
    steps: ["Choose the unit named in the document.", "Read the regional note before using a bigha result.", "Prefer square metres in a new record if the parties can agree."],
    example: "1 acre = 4,046.8564224 square metres.",
    faqs: [
      { q: "Which bigha is correct?", a: "The one defined in the local revenue record. The two options here are examples, not a national standard." },
      { q: "Is a hectare 10,000 square metres?", a: "Yes." },
    ],
    related: ["area-converter", "square-feet-to-square-metres", "room-area-calculator"],
  },
  {
    slug: "square-feet-to-square-metres",
    title: "Square feet to square metres converter",
    description: "Convert both ways between square feet and square metres with the exact factor.",
    category: "home",
    keywords: ["sq ft to sq m", "square feet", "square metres"],
    synonyms: ["ft2 to m2"],
    inputs: [
      { id: "value", label: "Value", type: "number", defaultValue: "1000", required: true },
      { id: "direction", label: "Direction", type: "select", defaultValue: "ft-m", options: [
        { value: "ft-m", label: "Square feet to square metres" },
        { value: "m-ft", label: "Square metres to square feet" },
      ] },
    ],
    compute: (v) => {
      const value = readNumber(v, "value", "Value");
      const factor = 0.09290304;
      const result = v.direction === "m-ft" ? value / factor : value * factor;
      return pack([
        item("Result", formatNumber(result, 4), true),
        item("Factor", "1 square foot = 0.09290304 square metres"),
      ]);
    },
    formula: "Square metres = square feet × 0.09290304.",
    howItWorks: "The international foot is 0.3048 metres exactly, so a square foot is 0.3048² square metres. The factor 0.09290304 is that square. Older survey feet differ slightly and are not used here.",
    steps: ["Enter the area.", "Choose the direction.", "Keep extra decimals if you will convert back."],
    example: "1,000 square feet = 92.90304 square metres.",
    faqs: [
      { q: "Is the factor exact?", a: "Yes for the international foot. It is not a rounded 0.093 unless you choose to round the result." },
      { q: "Does this convert acres?", a: "No. Use the land-area or area converter." },
    ],
    related: ["area-converter", "land-area-converter", "feet-inches-converter"],
  },
  {
    slug: "feet-inches-converter",
    title: "Feet and inches converter",
    description: "Convert between feet and inches, decimal feet, centimetres, and metres.",
    category: "home",
    keywords: ["feet and inches", "ft in", "cm to feet"],
    synonyms: ["height converter"],
    inputs: [
      { id: "feet", label: "Feet", type: "number", defaultValue: "5", required: true, min: 0 },
      { id: "inches", label: "Inches", type: "number", defaultValue: "7", required: true, min: 0, max: 11.999 },
    ],
    compute: (v) => {
      const inches = readNumber(v, "feet", "Feet", { min: 0 }) * 12 + readNumber(v, "inches", "Inches", { min: 0 });
      return pack([
        item("Centimetres", formatNumber(inches * 2.54, 2), true),
        item("Metres", formatNumber(inches * 0.0254, 4)),
        item("Decimal feet", formatNumber(inches / 12, 4)),
        item("Total inches", formatNumber(inches, 2)),
      ]);
    },
    formula: "Total inches = feet × 12 + inches. Centimetres = inches × 2.54.",
    howItWorks: "Building measurements are often written as feet and inches, while metric drawings use millimetres or metres. The international inch is 25.4 millimetres exactly. This page adds the inches to the feet before converting, so 5 ft 7 in is not treated as 5.7 ft.",
    steps: ["Enter whole feet and the remaining inches.", "Inches can include a decimal, such as 7.5.", "Use centimetres if the other drawing is metric."],
    example: "5 feet 7 inches = 67 inches = 170.18 centimetres.",
    faqs: [
      { q: "What if I have 13 inches?", a: "The field asks for the remainder under 12 so the feet are not double-counted. Use 1 foot and 1 inch, or enter 0 feet and the page will still convert if you raise the maximum by using decimal feet instead." },
      { q: "Is 5.7 feet the same as 5 ft 7 in?", a: "No. 5.7 feet is 5 feet and 8.4 inches." },
    ],
    related: ["length-converter", "square-feet-to-square-metres", "room-area-calculator"],
  },
];
