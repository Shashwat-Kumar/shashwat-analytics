# ReadSigil: curated video integration — 14 October 2026

**Status: media files committed; ready to publish.** All four optimized MP4 videos and four corresponding JPG posters have been committed to `assets/video/`, alongside page markup and responsive CSS. Uploaded GitHub blob hashes were verified against local originals.

| Page | File required in assets/video | On-page heading | Editorial role |
| --- | --- | --- | --- |
| Homepage | readsigil-perspective.mp4 + readsigil-perspective.jpg | The model is not the decision. | Establish ReadSigil's judgment-first thesis, immediately after hero. |
| About | readsigil-in-practice.mp4 + readsigil-in-practice.jpg | Between a clever model and a useful outcome lies the hard work. | Put professional context around ideas. |
| Decision Atlas | readsigil-judgement.mp4 + readsigil-judgement.jpg | Capability is not permission. | Optional, collapsed explainer before tool. |
| Media | readsigil-field-notes.mp4 + readsigil-field-notes.jpg | Good ideas have to survive contact with reality. | Original AI-generated field note, **not** third-party press. |

All four clips are ~10 seconds, pre-encoded to MP4/H.264 + AAC at 480px with fast start (total approx. 2.1 MB). Videos use native controls, posters, `playsinline`, and `preload="none"`, **no autoplay**, to preserve page speed and reading experience. Responsive styles are in `assets/video-stories.css`.

Two near-duplicate uploaded takes are deliberately not placed: `VID_20261014_222435.mp4` (airport) and `gemini_generated_video_1e5d2791.mp4` (pink-shirt alternate).

**Editorial disclosure:** synthetic footage is explicitly labelled. It must never be described as actual documentary, interview, conference or banking footage. Adjacent text is editorial framing, not a transcript. Before publication, verify spoken audio and, where needed, add accurately transcribed captions.

## Post-publication verification
1. On `readsigil.com`, check homepage, About, Decision Atlas, and Media with the page-specific video captions and disclosures.
2. Confirm all four MP4 and four JPG asset URLs return 200 after GitHub Pages deployment.
3. Check playback with sound, keyboard accessibility, and mobile layout. If intelligible generated speech is present, add accurate closed captions in a subsequent enhancement.
4. Keep original press coverage separate from the generated field-note section.

Existing homepage `assets/video/intro.mp4` and `intro.webm` are intentionally **not** deleted to make rollback easy.
