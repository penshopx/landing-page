---
name: Carousel video loop resilience
description: Browser behavior to account for when an autoplay video is one stage in a timed carousel.
---

For a video embedded in an automatically advancing carousel, do not rely only on the `autoplay` attribute or the media `ended` event. Use muted inline playback, retry `play()` when media becomes ready, and complete the video stage through a near-end time threshold with `ended` and a bounded timer as fallbacks.

**Why:** In the Replit browser preview, a newly active muted video could remain paused until a readiness retry, and a playing video did not consistently emit a usable `ended` transition after seeking near its duration.

**How to apply:** Use this pattern for landing-page or product carousels that must advance without visitor input. Pause and reset the video when leaving its slide so the next loop starts cleanly.