# Focus Resume Card — visual thesis

## Direction: topographic cartography

An interruption feels like losing the trail, not failing a productivity test. The interface borrows the useful parts of a field map: one marked waypoint, measured contours, compact coordinates, and a clear bearing. It avoids dashboards, streaks, progress rings, and productivity-app gradients. The checkpoint itself is the terrain; chrome stays quiet around it.

## Palette

The default “Field” treatment is a paper map in low evening light. A dark “Night survey” treatment is included through `prefers-color-scheme`; paid cosmetic alternatives never affect readability.

| Token | Field | Night survey | Purpose |
| --- | --- | --- | --- |
| paper / background | `#F3EEDC` | `#17201D` | warm map stock / forest-black |
| surface | `#FFFDF4` | `#202B27` | the current card |
| ink / text | `#17312B` | `#F5F0DE` | headings and body, ≥ 10:1 |
| muted ink | `#53645E` | `#B9C5BE` | metadata, ≥ 4.5:1 |
| trail / accent | `#B84A32` | `#FF9278` | the one primary bearing |
| accent contrast | `#FFFFFF` | `#17201D` | button text |
| contour | `#C7BFA5` | `#50625A` | decorative terrain lines |
| success | `#246B4A` | `#78D5A4` | saved / restored |
| warning | `#925B16` | `#F3C274` | offline / verification |
| danger | `#9A2F2C` | `#FF9B92` | destructive/error copy |

Color is never the only signal: every status also carries a word, icon, or sentence.

## Type and spacing

- Display: Georgia, Cambria, `Times New Roman`, serif — map-title gravity without a downloaded font.
- Interface: Inter-compatible system stack (`ui-sans-serif`, system UI, Segoe UI, sans-serif) — fast, familiar field notes.
- Scale: 12 / 14 / 16 / 20 / 28 / 44 px. Body is 16 px minimum; metadata is never required to understand the action.
- Spacing follows a 4 px base: 4, 8, 12, 16, 24, 32, 48, 72. Content measures stay below 68 characters.
- Corners are restrained (8–18 px); the saved card is a physical sheet with a small waypoint notch, not a grid of generic cards.

## Interaction grammar

- One vermilion route marker identifies the next physical action.
- Dashed lines mean “context carried from elsewhere”; solid lines mean actions here.
- Saving folds the capture form into the single resume card. Resuming follows the saved URL and records the event locally. Clearing requires a named confirmation and offers a short undo window.
- The popup opens directly on the waiting card. Creating another card replaces it only after explicit confirmation.
- At 390 px, secondary explanations and the landing-page extension mockup’s peripheral annotations drop away; the action and waypoint remain.

## Motion

State transitions last 180–240 ms and use opacity plus a small translate, as if placing or lifting a paper marker. No looping motion. With `prefers-reduced-motion: reduce`, all translation and smooth scrolling stop; state changes are instant or cross-fade only.

## Original asset plan and provenance

The landing hero uses one generated editorial terrain plate: a top-down paper landscape with a single red waypoint and a clean central route. It clarifies the product metaphor without pretending to show product functionality. Interface icons and contour overlays are hand-authored SVG/CSS, licensed with the repository.

### Prompt sheet

- Subject: an abstract interrupted route restored by one waypoint.
- World: hand-cut topographic paper layers, survey-map precision, quiet desk-scale landscape.
- Materials: uncoated cream paper, graphite contour lines, one vermilion enamel marker, subtle natural fibers.
- Light/lens: soft raking morning light, top-down 50 mm editorial still life, shallow but readable relief.
- Palette words: parchment, pine ink, lichen, graphite, vermilion.
- Negative list: people, hands, devices, UI screens, readable text, logos, brands, gradients, neon, glossy 3D, clutter, watermarks.

Final prompt: “Use case: stylized-concept. Asset type: wide landing-page hero illustration. A quiet top-down editorial still life of a hand-cut topographic landscape made from layered cream map paper; precise pine-green and graphite contour lines; one broken route reconnecting at a small vermilion enamel waypoint; generous calm negative space; subtle paper fibers and gentle raking morning shadows; sophisticated tactile cartography, restrained and useful, not fantasy. Palette: parchment, pine ink, lichen, graphite, vermilion. No people, no hands, no devices, no interface, no readable text, no logos, no brands, no gradient, no neon, no glossy 3D, no clutter, no watermark.”

- Generator: Azure OpenAI image deployment `factory-image`, via `/opt/fleet/lib/gen-image.sh`.
- Generated: 2026-08-27.
- License/provenance: original AI-generated asset commissioned for this product; no reference images, people, brands, or copyrighted characters.
