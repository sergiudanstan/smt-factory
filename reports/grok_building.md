# BUILDING delivery

Owned outputs:
- <repo>/src/factory/building.js
- <repo>/src/factory/areas.js
- <repo>/src/pages/building.html
- <repo>/src/pages/building.page.js
- <repo>/src/pages/building.css
- <repo>/reports/grok_building.md

`node --check` on the three JS files exited 0. `python3 <repo>/build.py building` wrote `<repo>/dist/building.html` (805 KB). Props are inlined from `<repo>/src/factory/props.js` (`SMT_PROPS`). No placeholder boxes were needed.

## Features

- Hall 72 × 42 m, origin on the floor centre. X −36000..36000, Z −21000..21000, eaves 8000, ridge 9500. 13 portal frames at 6 m: HEA-like columns (cast), haunches, rafters, purlins (InstancedMesh). Two roof slopes, ridge cap, gable infill, two emissive skylight strips.
- Sandwich walls with a seam texture, window band y 3500..5000 (opaque dark glass), three dock doors with levelers on the west wall, personnel and emergency leaves, green exit marks.
- Floor: yard concrete, grey epoxy, grey-green ESD epoxy over the EPA (x −23000..8000, z −14000..14000), yellow/black EPA tape, "ESD PROTECTED AREA" floor signs, 100 mm yellow walkway lines, zebra at the docks and the south entrance.
- Overhead services, `castShadow=false`: yellow 300 mm cable trays at y=3200 above each line with a drop at every slot; blue dia-63 air ring at y=4200 with drops; nitrogen only to the two reflow slots (line-local x=13000); two dia-150 exhaust stacks per oven into a dia-400 header and a riser; red sprinkler mains; two spiral HVAC ducts with rings and diffusers. Slot list accepts `opts.slots`.
- LED high-bay grid (emissive discs, InstancedMesh) plus four real PointLights, no shadow. Roof, walls and services do not cast. Columns do.
- Zones returned on `hall.zones`: warehouse, store, smt, postsmt, packing, offices, utility, entrance. `hall.lines` is LINE 1 at z=+3600 and LINE 2 at z=−3600, both from x=−15500. Machine bands z 2200..5000 and −5000..−2200 are left empty.
- Areas use `SMT_PROPS`: four loaded pallet racks and loose pallets in the warehouse, kitting (reel towers, dry cabinets, paste fridge, stencil rack, shelves, feeder carts, setup bench, MSL bake placeholder), post-SMT (rework, X-ray, selective solder, ICT/FCT, QC benches), packing benches and a rack, north offices (dark glass partitions, desks, chairs, meeting table, whiteboard), utility (compressor, dryer, receiver, N2), ESD entrance (lockers, two turnstiles). Extinguishers and first-aid at columns, exit signs.
- Two andon boards (`hall.andons`) hang under the trays. Each keeps `userData.ctx` / `userData.tex`. A slow tick paints a demo KPI (the factory page can replace it).
- Movers (`hall.movers`, not baked): 8 walking operators, 5 standing, 2 AMRs (magazine and cart), 1 forklift. Positions come from `C.T.sim`, not from the frame dt. Legs and arms swing. Forks rise and fall. The shared AMR LED pulses.

`SMT_FACTORY.building(C, opts)` returns `{size, zones, lines, slots, andons, movers, views, root}`. `areas(C, hall, opts)` fills andons and movers and bakes each zone group. The hall shell is baked once at the end of `building`.

## Camera views

Page init matches the brief, plus `floorSize:140000` because the core floor default is 40 m and this hall is 72 m: `camPos:[-52000,30000,52000]`, `camTgt:[0,0,0]`, `maxDist:140000`, `far:300000`, `shadow:9000`, `shadowFar:40000`, `esdLines:false`, `contactShadow:false`, `followShadow:true`.

| view | eye | target |
|---|---|---|
| plant | −52000, 30000, 52000 | 0, 0, 0 |
| warehouse | −28000, 5200, 14000 | −29000, 1400, 0 |
| store | −19200, 3000, 8500 | −20200, 1000, −4500 |
| lines | −14000, 7000, 16000 | −4000, 1000, 2000 |
| postsmt | 14500, 5200, 10500 | 15000, 1000, −500 |
| offices | 15000, 2400, 17800 | 24000, 1300, 18500 |
| utility | −1500, 5200, 14800 | −7500, 1000, 18800 |
| entrance | −7800, 2600, −14000 | −10500, 900, −19600 |
| walk | eye y=1650, z=1000, along X from sim time | 4.5 m ahead, toward the line |

The page draws two opaque 10 mm pads (21 × 2.5 m) with a yellow outline and a LINE label. The side panel lists the eight zones.

## Measured

No line machines are loaded on this page, so there is no cycle time and `line.out` / `rate_bph` stay 0. That is the brief: the coordinator places the machines later.

Dark `--ff 600`, plant shot last, t = 604.34 s. errors 0, warnings 0.

- zones 8, lines 2, andons 2, movers 16 (people 13, AMRs 2, forklift 1)
- `render.calls` 775 on the plant overview (last frame). triangles 228936. geometries 789, textures 152. Budget was 2500.
- canvas 1300 × 1000

Light `--ff 40 --light`, same nine views, t = 44.77 s. errors 0, warnings 0. Last frame was walk, 221 calls.

## Screenshots

Dark, t ≈ 604 s:

- <repo>/shots/building/building_plant.png
- <repo>/shots/building/building_warehouse.png
- <repo>/shots/building/building_store.png
- <repo>/shots/building/building_lines.png
- <repo>/shots/building/building_postsmt.png
- <repo>/shots/building/building_offices.png
- <repo>/shots/building/building_utility.png
- <repo>/shots/building/building_entrance.png
- <repo>/shots/building/building_walk.png

Light, t ≈ 45 s, same names under `<repo>/shots/building/light/`.

## Known issues

- Roof slopes are translucent (opacity 0.22, `depthWrite:false`, no shadow) so the plant camera can see the floor. They are skipped by bake. An opaque roof would hide the overview.
- Office and window glass is opaque dark `MeshStandardMaterial`, not a transmission material.
- The lines camera looks across the air ring and the cable trays, so those services sit in the foreground of that shot. Both pads, both andons, an AMR and operators are still in frame.
- Walk is a function of sim time. At 600 s the eye is by the line pad with an AMR ahead. At 45 s (the light pass) it is further east, beside post-SMT. A centre-aisle walker can pass near the lens when x coincides; the checked frames do not clip a body.
- Andon figures are a demo paint. `userData.ctx` and `userData.tex` are there for the factory page.
- Packing is furnished and has a zone, and it has no button of its own. It shows in plant and walk.
- The utility shot crops the compressor. Receiver, dryer and N2 generator are in frame.

## Core requests

None. `floorSize`, `followShadow`, `bake`, `onFrame`, `onSlow` and view follow callbacks already exist. The page passes `floorSize:140000` because the default floor is 40 m.
