"use client";

import { useEffect, useRef } from "react";
import { useForm, ValidationError } from "@formspree/react";
import { toast } from "sonner";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Download, Github, Loader2 } from "lucide-react";
import { trackEvent } from "@/lib/mixpanel";
import SplitText from "@/components/motion/SplitText";
import PillLink, {
  PillIcon,
  RollingLabel,
  pillClasses,
} from "@/components/motion/PillLink";
import { cn } from "@/lib/utils";
import type { PortfolioData } from "@/lib/actions/utils";
import { RESUME_FILENAME, RESUME_PATH } from "@/lib/site";

const ID = process.env.NEXT_PUBLIC_FORM_ID!;

const fieldClass =
  "w-full rounded-none border-0 border-b border-foreground/25 bg-transparent px-0 py-3 text-lg text-foreground outline-none transition-colors duration-300 focus:border-accent-ink focus-visible:ring-0 md:text-xl";

type ContactProps = PortfolioData;

const Contact = ({ githubUrl }: ContactProps) => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const reduce = useReducedMotion();
  const [state, handleSubmit] = useForm(ID);

  useEffect(() => {
    if (state.succeeded) {
      formRef.current?.reset();
      toast.success("Message sent successfully");
    }
  }, [state.succeeded]);

  const hasErrors = (state.errors?.getFormErrors().length ?? 0) > 0;

  return (
    <section
      id="contact"
      className="portfolio grid grid-cols-1 gap-14 pb-24 md:grid-cols-12 md:gap-8 md:pb-32"
    >
      <div className="flex flex-col gap-8 md:col-span-6 md:pr-10">
        <SplitText
          as="h2"
          text="Let's work together"
          className="max-w-[10ch] font-display text-[clamp(3.25rem,9vw,8rem)] font-semibold leading-[0.9] tracking-[-0.045em] [font-stretch:75%]"
        />
        <p className="max-w-[40ch] text-lg leading-relaxed text-foreground/70">
          Have a project, a role or a question? Send a message and I&apos;ll
          get back to you.
        </p>

        <div className="flex flex-wrap gap-3">
          <PillLink
            href={RESUME_PATH}
            variant="ghost"
            icon={<Download />}
            download={RESUME_FILENAME}
            onClick={() =>
              trackEvent("Resume Downloaded", {
                source_page: "contact",
              })
            }
          >
            Download resume
          </PillLink>
          {githubUrl && (
            <PillLink
              href={githubUrl}
              variant="ghost"
              icon={<Github />}
              onClick={() =>
                trackEvent("Social Link Clicked", {
                  platform: "github",
                  url: githubUrl,
                  source_page: "contact",
                })
              }
            >
              Github
            </PillLink>
          )}
        </div>
      </div>

      <motion.form
        ref={formRef}
        method="post"
        onSubmit={handleSubmit}
        initial={reduce ? false : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-10 md:col-span-6 md:pt-4"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground/80">
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            autoComplete="name"
            required
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground/80">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            autoComplete="email"
            required
            className={fieldClass}
          />
          <ValidationError
            prefix="Email"
            field="email"
            errors={state.errors}
            className="text-sm text-destructive dark:text-red-400"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="message" className="text-sm font-medium text-foreground/80">
            Message
          </label>
          <textarea
            name="message"
            id="message"
            required
            rows={5}
            className={cn(fieldClass, "resize-none")}
          />
          <ValidationError
            prefix="Message"
            field="message"
            errors={state.errors}
            className="text-sm text-destructive dark:text-red-400"
          />
        </div>

        {hasErrors && (
          <p role="alert" className="text-sm text-destructive dark:text-red-400">
            Something went wrong sending your message. Please try again.
          </p>
        )}

        <div className="flex items-center gap-5">
          <button
            type="submit"
            disabled={state.submitting}
            className={pillClasses("solid")}
          >
            <RollingLabel>{state.submitting ? "Sending" : "Send message"}</RollingLabel>
            <PillIcon>
              {state.submitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <ArrowUpRight />
              )}
            </PillIcon>
          </button>
          {state.succeeded && (
            <p role="status" className="text-sm text-foreground/75">
              Thanks, your message is on its way.
            </p>
          )}
        </div>
      </motion.form>
    </section>
  );
};

export default Contact;
