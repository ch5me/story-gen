# License Notes — StoryGen

## Load-Bearing Rule

> **GPL / source-available / copyleft projects are idea, schema, and UX references
> ONLY. No code is copied into this repo from them unless an explicit
> compatible-license decision is made and documented in this file.**
> Only permissively-licensed libraries are embedded as dependencies.

### Why this matters

StoryGen is a proprietary product. GPL and AGPL carry a copyleft obligation: if
you distribute (or, for AGPL, _run_) a work that incorporates GPL/AGPL code, the
entire combined work must be released under the same license. That is incompatible
with a closed commercial product. SSPL and BSL are "source available" but
non-commercial / viral in similar ways. The safe default is: understand the
architecture of those tools, build our own canonical schema/engine, and keep the
code base free of any snippet, translation, or derivative from a non-permissive
source.

In v1 the ONLY embedded third-party narrative libraries are:

- `inkjs` (MIT) — reference runtime for Ink-compatible output validation
- `tracery-grammar` (Apache-2.0 — verify exact version; some forks carry MIT)

Everything else in the table below is **reference-only**.

---

## Tool License Table

| Tool | Best-known license | Posture | Can we copy code? | Notes |
|---|---|---|---|---|
| **inkjs** | MIT | embed-as-dep | yes | Official JS port of Inkle's Ink runtime. MIT confirmed on npm. |
| **tracery-grammar** | Apache-2.0 (verify fork) | embed-as-dep | yes (Apache-2.0 compatible) | Original `tracery` by GalaxyKate is Apache-2.0. The `tracery-grammar` npm package should be verified before upgrading. |
| **Twine** | GPL-3.0 | reference-only | no | Core editor is GPL-3.0. Twine story _formats_ (Harlowe, SugarCube, Chapbook) have their own licenses — do not embed. The `.twee` file _format_ itself is a data spec, not code. |
| **Inky** | MIT | reference-only (may embed) | yes — but audit first | Inkle's Inky editor is MIT. However we have no current need to embed it; if a future sub-package needs it, document the decision here. |
| **Yarn Classic** | MIT | reference-only | yes — but audit first | The original YarnSpinner-Unity/GDScript dialect parser. MIT per repo. No current embed need. |
| **Yarn Spinner** | MIT | reference-only | yes — but audit first | The C# runtime (YarnSpinner/YarnSpinner) is MIT; the Unity package and VS Code extension are also MIT. No current embed need; if a future compiler adapter needs the spec, document decision here. |
| **Arrow** | MIT (verify) | reference-only | verify | Arrow by DanielKlmain on GitHub. Listed as MIT — verify license file before any use. Reference its node/link data model only. |
| **Manuskript** | GPL-3.0 | reference-only | no | Python/Qt novel-writing tool. GPL-3.0. Reference only for chapter/scene/character model ideas. |
| **bibisco** | GPL-3.0 | reference-only | no | Electron novel-writing app. GPL-3.0. |
| **novelibre** | GPL-3.0 | reference-only | no | Python/Tk novel manager. GPL-3.0. |
| **novelWriter** | GPL-3.0 | reference-only | no | Python/Qt long-form writing tool. GPL-3.0. |
| **oStorybook** | GPL-3.0 (verify) | reference-only | no | Java-based storyboard tool. Historically GPL; verify current repo state. |
| **Kanka** | Proprietary SaaS / source-available (verify) | reference-only | no | World-building SaaS. Source for the self-hosted version on GitHub carries a non-commercial license. Do not copy code or schema. |
| **Fantasia Archive** | MIT (verify) | reference-only | verify | Electron world-building app. Reported MIT — verify license file in the repo before any use. Even if MIT, we have no current embed need. |
| **Chronicler** | verify | reference-only | verify | Various tools use this name. Identify the exact repo and confirm license before any use. |
| **autonovel** | verify | reference-only | verify | AI-assisted novel generation scripts. License varies by repo; treat as reference-only until confirmed permissive. |
| **StoryCraftr** | verify | reference-only | verify | AI-driven novel tool. License not widely documented; treat as reference-only until confirmed permissive. |
| **RecurrentGPT** | MIT (verify) | reference-only | verify | Research-originated tool for long-form LLM generation. Likely MIT per the paper repo but verify before any use. Even if MIT, use only as an algorithmic reference — no copy-paste of prompt pipelines without a documented decision here. |

---

## Before Adopting Any New Dependency

Before adding a new runtime or dev dependency that contains or is derived from
third-party narrative tooling, complete this checklist and record the decision
above:

1. **Identify the exact license.** Check the repo's `LICENSE` file, the npm
   `license` field, and any `NOTICE` or `COPYING` files. Do not rely on README
   claims alone.
2. **Classify the license.**
   - Permissive (MIT, Apache-2.0, BSD-2/3, ISC, 0BSD): eligible for embed.
   - Copyleft (GPL-2/3, AGPL, LGPL): reference-only unless legal review clears a
     specific use (e.g., LGPL dynamic linking may be acceptable — document the
     analysis).
   - Source-available / non-commercial (SSPL, BSL, Kanka-style): reference-only,
     no embed.
   - Unknown / "verify": treat as copyleft until confirmed.
3. **Record the posture decision** in the table above with the confirmed license,
   posture, and a note explaining the decision.
4. **Check for patent grants.** Apache-2.0 includes an explicit patent grant; MIT
   does not. For tooling that could touch patent-sensitive areas (novel story-graph
   algorithms, specific AI pipeline architectures), prefer Apache-2.0 sources.
5. **Add to `package.json` only after this file is updated** and the decision is
   committed. Do not add a dependency and "come back to document it later."

---

_Last updated: 2026-06-15. Update this file whenever a new dependency is added or
a reference tool's license status changes._
