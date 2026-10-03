"use client";
import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
const MAX_RATE = 3;
export default function StoryVideo() {
  const section = useRef<HTMLElement>(null), video = useRef<HTMLVideoElement>(null);
  const [watching, setWatching] = useState(false), watchingRef = useRef(false);
  watchingRef.current = watching;

  useEffect(() => {
    const el = video.current, wrap = section.current;
    if (!el || !wrap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visible = false, rate = 1, lastY = window.scrollY, lastT = performance.now(), frame = 0;
    // Scrolling speeds the clip up; it eases back to normal speed once scrolling stops.
    const tick = (now: number) => {
      const speed = Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1);
      lastY = window.scrollY; lastT = now;
      const target = Math.min(MAX_RATE, 1 + speed * 2);
      rate += (target - rate) * (target > rate ? 0.25 : 0.05);
      if (!watchingRef.current) el.playbackRate = Math.max(1, rate);
      frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !watchingRef.current) { el.muted = true; void el.play().catch(() => {}); cancelAnimationFrame(frame); lastY = window.scrollY; lastT = performance.now(); frame = requestAnimationFrame(tick); }
      else if (!visible) { cancelAnimationFrame(frame); el.pause(); }
    }, { threshold: 0.25 });
    observer.observe(wrap);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  const watch = () => {
    const el = video.current; if (!el) return;
    setWatching(true); el.muted = false; el.playbackRate = 1; el.currentTime = 0; void el.play().catch(() => setWatching(false));
  };
  const leaveWatching = () => { setWatching(false); if (video.current) video.current.muted = true; };
  return <section ref={section} className={`story ${watching ? "story-playing" : ""}`} id="story" aria-labelledby="story-title">
    <video ref={video} className="story-video" src="/landing/career-story-video.mp4" poster="/landing/testimonial-workspace.jpg" preload="metadata" muted loop={!watching} playsInline controls={watching} onPause={() => watchingRef.current && leaveWatching()} onEnded={leaveWatching} />
    <div className="story-shade" aria-hidden="true" />
    <div className="landing-container story-content"><p className="section-label">01 — The shift</p><h2 id="story-title">Your next chapter is already in motion.</h2><p>Watch how one honest review can change the way you show up.</p>
      <button type="button" className="story-play" onClick={watch} aria-label="Watch the career story video with sound"><Play size={20} fill="currentColor" aria-hidden="true" /></button></div>
  </section>;
}
