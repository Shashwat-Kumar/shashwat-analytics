# ReadSigil: curated video integration — 14 October 2026

**Status: staging / not ready to merge.** The corresponding optimized videos and posters have been prepared in a downloadable ReadSigil integration ZIP in the ChatGPT conversation. This branch contains page markup and responsive CSS only; add the eight video/poster binaries before merging.

| Page | File required in assets/video | On-page heading | Editorial role |
| --- | --- | --- | --- |
| Homepage | readsigil-perspective.mp4 + readsigil-perspective.jpg | The model is not the decision. | Establish ReadSigil's judgment-first thesis, immediately after hero. |
| About | readsigil-in-practice.mp4 + readsigil-in-practice.jpg | Between a clever model and a useful outcome lies the hard work. | Put professional context around ideas. |
| Decision Atlas | readsigil-judgement.mp4 + readsigil-judgement.jpg | Capability is not permission. | Optional, collapsed explainer before tool. |
| Media | readsigil-field-notes.mp4 + readsigil-field-notes.jpg | Good ideas have to survive contact with reality. | Original AI-generated field note, **not** third-party press. |

All four clips are ~10 seconds, pre-encoded to MP4/H.264 + AAC at 480px with fast start (total approx. 2.1 MB). Videos use native controls, posters, `playsinline`, and `preload="none"`, **no autoplay**, to preserve page speed and reading experience. Responsive styles are in `assets/video-stories.css`.

Two near-duplicate uploaded takes are deliberately not placed: `VID_20261014_222435.mp4` (airport) and `gemini_generated_video_1e5d2791.mp4` (pink-shirt alternate).

**Editorial disclosure:** synthetic footage is explicitly labelled. It must never be described as actual documentary, interview, conference or banking footage. Adjacent text is editorial framing, not a transcript. Before publication, verify spoken audio and, where needed, add accurately transcribed captions.

## Before merge
1. Extract the supplied ChatGPT integration ZIP; copy `assets/video/*.mp4` and `*.jpg` into this repository's `assets/video/`.
2. Verify exact case-sensitive paths above.
3. Run a local static server; test homepage, About, Decision Atlas and Media on mobile and desktop. Confirm poster loads and all video links return 200.
4. Confirm audio quality, generated likeness/provenance disclosure, text-to-clip relevance, and accessible captions when finalized.
5. Commit the binary assets to this branch, then mark the PR ready for review and merge. Confirm live deployment after GitHub Pages build.

Existing homepage `assets/video/intro.mp4` and `intro.webm` are intentionally **not** deleted to make rollback easy.
