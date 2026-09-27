"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// Phone-framed app preview. Videos download nothing until the card is near
// the viewport (preload="none" + IntersectionObserver) and pause off-screen;
// screenshots crossfade when there is no video.
export default function PhoneShowcase({
  name,
  videoUrl,
  posterUrl,
  screenshots = [],
  fallbackImage,
  className,
}: {
  name: string;
  videoUrl?: string;
  posterUrl?: string;
  screenshots?: string[];
  fallbackImage: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  // Becomes true on first approach and stays: load once, then pause/resume
  const [activated, setActivated] = useState(false);
  const [shot, setShot] = useState(0);

  const poster = posterUrl || screenshots[0] || fallbackImage;
  const playVideo = Boolean(videoUrl) && !reduce;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setActivated(true);
    }, {
      rootMargin: "200px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !playVideo) return;
    if (inView) v.play().catch(() => {});
    else v.pause();
  }, [inView, playVideo]);

  // Screenshot slideshow only while visible
  useEffect(() => {
    if (videoUrl || reduce || screenshots.length < 2 || !inView) return;
    const t = setInterval(() => setShot((s) => (s + 1) % screenshots.length), 2800);
    return () => clearInterval(t);
  }, [videoUrl, reduce, screenshots.length, inView]);

  const screens = screenshots.length ? screenshots : [fallbackImage];
  const back = screenshots.length > 1 ? screenshots[(shot + 1) % screenshots.length] : null;

  return (
    <div ref={wrap} className={cn("relative flex items-center justify-center", className)}>
      {/* Second phone peeking behind for depth */}
      {back && !videoUrl && (
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-1/2 aspect-[9/19.5] h-[82%] -translate-x-[15%] -translate-y-1/2 rotate-[8deg] overflow-hidden rounded-[2rem] border-[5px] border-neutral-900 bg-neutral-900 opacity-60 shadow-xl"
        >
          <Image src={back} alt="" fill sizes="200px" className="object-cover object-top" />
        </div>
      )}

      {/* Main phone */}
      <div className="relative aspect-[9/19.5] h-full overflow-hidden rounded-[2.4rem] border-[6px] border-neutral-900 bg-neutral-900 shadow-[0_30px_60px_-20px_rgb(0_0_0/0.55)] ring-1 ring-white/10">
        <span
          aria-hidden="true"
          className="absolute left-1/2 top-2 z-10 h-[1.35rem] w-[34%] -translate-x-1/2 rounded-full bg-black"
        />
        {playVideo ? (
          <video
            ref={videoRef}
            src={activated ? videoUrl : undefined}
            poster={poster}
            muted
            loop
            playsInline
            preload="none"
            aria-label={`${name} app preview`}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={screens[shot] ?? poster}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <Image
                src={videoUrl ? poster : screens[shot] ?? poster}
                alt={`${name} screenshot`}
                fill
                sizes="(max-width: 768px) 60vw, 280px"
                className="object-cover object-top"
              />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
