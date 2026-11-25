# LEED 26 crew passes

Every LEED 26 crew pass in one place. The home page lists all passes: search by name, filter by committee, and switch between AJK Student and AJK Staff. Each person has their own page, `/pass/<id>`, showing their pass in 3D (an interactive preview of the AJK LEED 26 committee pass (9.5 × 14 cm PVC card) hanging on its lanyard,
with real gravity). Built with Next.js 15, React 19 and three.js. Developed by SELADEVS.

Two views, switched at the bottom:

- **On lanyard**: drag the card to swing it, flick it to spin it, let go and gravity pulls it back.
- **Hold still** freezes the card where it is; **Let it swing** starts it moving again.
- **Flip** spins it to show both sides, **Drop** lifts it and lets it fall, **Reset** puts it back.
- **Gravity**: Gentle (half of Earth, the default), Earth, Moon, Mars or Jupiter.
- **360° view**: the card alone, without the lanyard. Drag to turn it to any angle, scroll or pinch to zoom in on the print, double-tap to reset. It turns slowly on its own when left alone.

## Add a crew member

1. Export the front of their card from Canva at 1020 × 1503 px and save it as `public/cards/<id>.jpg`
   (`<id>` is their name in lowercase with dashes, for example `aina-sofea`).
2. Add a line to `lib/crew.ts` with their name, role, committee and `kind` (`student` or `staff`).
3. Send them their link: `https://<your-site>/pass/<id>`.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy

Push to GitHub and import the repository in Vercel. No environment variables are needed.

## Files

| Path | What it is |
| --- | --- |
| `app/page.tsx` | The page |
| `components/PassScene.tsx` | The three.js scene: card, straps, clip, lights, shadows, dragging |
| `lib/physics.ts` | Verlet physics: two straps and the card as a rigid body under gravity |
| `public/card/front.jpg` | Front of the pass (the Canva design) |
| `public/card/back.jpg` | Back of the pass |

To use another design, replace `public/card/front.jpg` and `public/card/back.jpg` with images at the same
9.5 : 14 ratio (for example 1020 × 1503 px).
