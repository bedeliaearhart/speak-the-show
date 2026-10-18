# Downbeat

Say a show out loud and get real rentable gear, a real budget and production checks, placed in a real room, then walk it at true scale in phone AR.

Built solo by Amelia Warren at MOLTEN (a16z LA Tech Week, xTribe, Inglewood), Saturday October 17, 2026.

Live: https://molten-stage.vercel.app

## What it does

1. You describe a show by voice (ElevenLabs voice agent or browser speech) or by typing.
2. Claude picks quantities from a hand-built catalog of real gear and writes a short walkthrough.
3. The page computes the layout, checks, cable schedule and budget from the catalog, never from the model.
4. You see it four ways: a true-scale 3D model, phone AR, a 2.5D plan view, and an ArcGIS 3D scene at the venue on floor 2.
5. A Specs toggle shows size, weight and power on each piece.

Checks: projector throw against room depth, image brightness against room light, ceiling clearance, power circuits, standing capacity, and height above ground (floor elevation plus item height).

## What is real and what is not

- AR is aligned by hand to a taped spike mark, unanchored to GPS. GPS anchoring needs a native app (ArcGIS WorldScaleSceneView or Niantic VPS).
- The catalog is typed in by hand from manufacturer sheets and public rental listings.
- Prices come from public listings and campus rate sheets. Show-grade gear and HOLOGAUZE are quote only.
- The scrim price is a generic white scrim listing standing in for holo gauze.
- Brightness is lumens over image area against the room light you enter, before screen gain.
- Power uses the 80 percent rule on 20 A circuits. An electrician confirms the real circuits.
- Capacity uses the IBC standing factor (5 sq ft per person). The fire marshal sets the real number.
- Floor load on an upper floor is not checked. A structural engineer signs off.
- 3D shapes are simplified stand-ins at true size.
- The map position of the room is approximate.

## Stack and credits

- Hosting and functions: Vercel
- Language model: Claude API (Anthropic), Haiku-class model
- Voice agent: ElevenLabs Conversational AI
- Map: ArcGIS Maps SDK for JavaScript (Esri), with a MapLibre GL JS and OpenFreeMap fallback
- 3D and AR: three.js and Google model-viewer
- Gear data: L-Acoustics, QSC, Epson, Global Truss, Genie, Chauvet, Da-Lite spec sheets; rental listings from rentforevent.com, rentals.magicsnow.com, musson.com; rate sheets from the University of Washington HUB and Colorado College
- Code written during the event with help from Claude Code (Anthropic).

## Run the tests

```bash
node --test checks.test.mjs
```
