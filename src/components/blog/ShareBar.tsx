"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { FaLinkedinIn, FaXTwitter, FaWhatsapp } from "react-icons/fa6";
import { trackEvent } from "@/lib/mixpanel";

// Share row at the end of a post
export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;

  const targets = [
    {
      name: "X",
      icon: FaXTwitter,
      href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`,
    },
    {
      name: "LinkedIn",
      icon: FaLinkedinIn,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
    },
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      href: `https://wa.me/?text=${enc(`${title} ${url}`)}`,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent("Blog Post Shared", { platform: "copy_link", url });
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const btn =
    "grid size-11 place-items-center rounded-full border border-foreground/15 text-foreground/75 transition-[transform,color,border-color,background-color] duration-300 hover:border-foreground/40 hover:text-foreground active:scale-95";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="mr-1 text-sm font-medium text-foreground/70">Share this post</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
        className={`${btn} ${copied ? "border-transparent bg-accent text-accent-on hover:text-accent-on" : ""}`}
      >
        {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      </button>
      {targets.map(({ name, icon: Icon, href }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${name}`}
          title={`Share on ${name}`}
          className={btn}
          onClick={() => trackEvent("Blog Post Shared", { platform: name.toLowerCase(), url })}
        >
          <Icon className="size-4" />
        </a>
      ))}
      <span role="status" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}
