# Sample SOP Format

This shows the shape an SOP document takes in this system, both as stored
in MongoDB and as you'd write one when adding a new SOP through the admin UI
(`Add SOP` button on the SOPs page) or by editing `scripts/ingestSOPs.js`
directly.

## Fields

| Field          | Type       | Required | Notes                                                                 |
|----------------|------------|----------|------------------------------------------------------------------------|
| `title`        | string     | yes      | Short, descriptive — shown in the retrieved-SOPs list on report detail |
| `disasterType` | enum       | yes      | One of: `flood`, `fire`, `earthquake`, `storm`, `medical`, `other`      |
| `content`      | string     | yes      | The full procedure text — this is what gets embedded for vector search |
| `steps`        | string[]   | no       | Optional discrete checklist steps, shown separately from `content`     |
| `embedding`    | number[384]| generated| Never write this yourself — it's computed automatically on save        |

## Example (as you'd write it before ingestion)

```json
{
  "title": "Flash Flood Emergency Response",
  "disasterType": "flood",
  "content": "When a flash flood report is received, first confirm the affected area is not already under an active evacuation order. Dispatch responders to identify stranded individuals, prioritizing locations near schools, hospitals, and elder care facilities. Do not allow vehicles to attempt crossing flooded roads regardless of apparent depth...",
  "steps": [
    "Confirm no active evacuation order conflicts with response plan",
    "Dispatch responders to high-priority locations (schools, hospitals, elder care)",
    "Block vehicle access to flooded roads",
    "Request swift-water rescue teams if water is moving"
  ]
}
```

## Writing good SOP content for retrieval quality

Since `content` is what gets embedded and semantically matched against
incoming report descriptions, a few things noticeably improve retrieval
quality:

- **Be specific, not just categorical.** "Respond to flooding" embeds poorly
  because it's generic. "Water rising near a school, stranded vehicles, swift
  water rescue needed" embeds much closer to how real reports are phrased.
- **Put `disasterType` correctly.** The retriever can filter by exact
  `disasterType` match as a hard filter, so a flood SOP mistakly tagged
  `other` won't surface for flood reports even if the content matches well.
- **Keep `content` focused on one procedure.** Six SOPs covering distinct
  scenarios retrieve better than one giant SOP covering everything, because
  a single long document's embedding becomes a blurry average of all its
  topics.
- **`steps` should be actionable, not descriptive.** "Water levels may rise"
  is a fact; "Block vehicle access to flooded roads" is a step. The plan
  generator quotes from `steps` more directly than from `content`.

Six starter SOPs (one per disaster type) are already included in
`scripts/ingestSOPs.js` — read through those for more format examples before
writing your own.
