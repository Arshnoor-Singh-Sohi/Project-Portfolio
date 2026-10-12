// src/components/markdown/VideoBlock.jsx
// Renders a ```video fence: { "src", "start", "end", "caption" }.
// start/end accept "m:ss", "h:mm:ss" or seconds.
//
// The range is the part of the video that belongs to the lesson, not a
// hard limit:
//   - The video opens at `start`.
//   - Playback pauses ONCE when it runs past `end`. Play again and it
//     continues to the end of the full video.
//   - The reader can move the slider anywhere. Nothing jumps back.
//     A jump past `end` cancels the pause.
//   - "REPLAY CLIP" goes back to `start` and sets the pause again.
// No #t= end fragment is used, because some browsers stop playback at
// that end value and clamp later seeks.
import React, { useEffect, useRef, useState } from 'react';
import BlockError from './BlockError';
import { parseJsonBlock } from '../../lib/json-block';
import { parseClipTime, formatClipTime } from '../../lib/clip-time';

function readSpec(code) {
  const { spec, error } = parseJsonBlock(code);
  if (error) return { error };
  if (typeof spec.src !== 'string' || !spec.src.trim()) {
    return { error: '"src" is required, for example "/notes/media/<subject>/course/01_The_Mystery_of_a_Signal.mp4".' };
  }
  const start = parseClipTime(spec.start);
  const end = parseClipTime(spec.end);
  if (Number.isNaN(start)) return { error: `"start" must be "m:ss" or a number of seconds, not ${JSON.stringify(spec.start)}.` };
  if (Number.isNaN(end)) return { error: `"end" must be "m:ss" or a number of seconds, not ${JSON.stringify(spec.end)}.` };
  if (start !== null && end !== null && end <= start) return { error: '"end" must be later than "start".' };
  return {
    src: spec.src.trim(),
    start: start || 0,
    end,
    caption: typeof spec.caption === 'string' ? spec.caption : '',
  };
}

export default function VideoBlock({ code }) {
  const videoRef = useRef(null);
  // true while the one-time pause at `end` is still waiting to happen.
  const armedRef = useRef(true);
  // The last known playback position, to detect a crossing of `end`.
  const lastTimeRef = useRef(0);
  const [clipEnded, setClipEnded] = useState(false);

  const clip = readSpec(code);
  const { error, src } = clip;
  const start = error ? 0 : clip.start;
  const end = error ? null : clip.end;
  const hasRange = !error && (start > 0 || end !== null);

  useEffect(() => {
    const video = videoRef.current;
    if (error || !video) return undefined;
    armedRef.current = end !== null;
    lastTimeRef.current = start;

    const onLoadedMetadata = () => {
      if (start > 0 && video.currentTime < start) video.currentTime = start;
      lastTimeRef.current = video.currentTime;
    };
    const onSeeking = () => {
      lastTimeRef.current = video.currentTime;
      // A jump past the clip end means the reader wants the rest of the video.
      if (end !== null && video.currentTime >= end) armedRef.current = false;
    };
    const onTimeUpdate = () => {
      const now = video.currentTime;
      if (armedRef.current && end !== null && !video.seeking && lastTimeRef.current < end && now >= end) {
        armedRef.current = false;
        video.pause();
        setClipEnded(true);
      }
      lastTimeRef.current = now;
    };
    const onPlay = () => setClipEnded(false);

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    if (video.readyState >= 1) onLoadedMetadata();
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeking', onSeeking);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onPlay);
    };
  }, [error, src, start, end]);

  if (error) return <BlockError what="video" message={error} code={code} />;

  const replayClip = () => {
    const video = videoRef.current;
    if (!video) return;
    armedRef.current = end !== null;
    video.currentTime = start;
    lastTimeRef.current = start;
    setClipEnded(false);
    const playing = video.play();
    if (playing && typeof playing.catch === 'function') playing.catch(() => {});
  };

  const fragment = start > 0 ? `#t=${start}` : '';
  const range = !hasRange
    ? 'full video'
    : end !== null
    ? `lesson clip ${formatClipTime(start)}-${formatClipTime(end)}`
    : `lesson clip from ${formatClipTime(start)}`;

  return (
    <figure className="notes-video">
      <video ref={videoRef} src={`${src}${fragment}`} controls preload="metadata" playsInline />
      <figcaption>
        {clip.caption && <span className="notes-video-caption">{clip.caption}</span>}
        {clipEnded && (
          <span className="notes-video-caption">
            The lesson clip ends here. Press play to continue the full video.
          </span>
        )}
        <span className="notes-video-meta">
          <span className="notes-video-range">{range}</span>
          {hasRange && (
            <button type="button" className="notes-video-toggle" onClick={replayClip}>
              REPLAY CLIP
            </button>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
