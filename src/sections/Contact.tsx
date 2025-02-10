"use client";
import Input from "@/components/general/Input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { BsGithub } from "react-icons/bs";
import { HiDownload } from "react-icons/hi";
import { useForm, ValidationError } from "@formspree/react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { staggerContainer } from "@/components/animations/portfolio-page";
import {
  slideLeftVariant,
  slideRightVariant,
  slideUpVariant,
} from "@/components/animations/general";

const ID = process.env.NEXT_PUBLIC_FORM_ID!;
const Contact = () => {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const msgRef = useRef<HTMLTextAreaElement | null>(null);

  const [state, handleSubmit] = useForm(ID);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (nameRef.current) nameRef.current.value = "";
      if (emailRef.current) emailRef.current.value = "";
      if (msgRef.current) msgRef.current.value = "";
    }, 2000);

    return () => clearInterval(timer);
  }, [state.succeeded, state.submitting]);

  useEffect(() => {
    if (state.succeeded) {
      toast.success("Message sent successfully");
    }
  }, [state.succeeded]);

  return (
    <motion.section
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      id="contact"
      className="portfolio flex flex-col relative"
    >
      <motion.h2
        variants={slideUpVariant}
        className="heading-style after:content-['Get_in_touch'] font-nunito after:font-montserrat md:self-center md:mb-20 mb-12"
      >
        contact
      </motion.h2>

      <motion.div
        variants={staggerContainer}
        className="grid lg:grid-cols-2  gap-y-10 "
      >
        <motion.div variants={slideLeftVariant} className="">
          <p className="text-xl mb-12 font-semibold">Hire me</p>
          <div className="flex flex-col gap-4 items-start">
            <a
              href="chimezie-resume.pdf"
              className={cn(buttonVariants(), "py-6")}
              download="chimezie-resume"
              target="_blank"
            >
              <span>Download resume</span>
              <HiDownload />
            </a>

            <a
              href="https://github.com/carniel-carl"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "py-6 duration-500 ease-in-out"
              )}
              target="_blank"
            >
              <span>Github</span>
              <BsGithub />
            </a>
          </div>
        </motion.div>

        <motion.div variants={slideRightVariant} className="mb-10">
          <p className="text-xl mb-12 font-semibold">Connect with me</p>

          <form
            method="post"
            className="flex flex-col gap-8"
            onSubmit={handleSubmit}
          >
            <Input
              ref={nameRef}
              variant="primary"
              type="text"
              name="name"
              id="name"
              label="Name"
              required
            />

            <Input
              variant="primary"
              ref={emailRef}
              label="Email"
              type="email"
              name="email"
              required
              id="email"
            />

            <div className="input-area textarea">
              <textarea
                name="message"
                id="message"
                required
                className="input"
                ref={msgRef}
              />
              <label className="label">Message</label>
            </div>

            <ValidationError
              prefix="Message"
              field="message"
              errors={state.errors}
            />

            <Button
              variant="outline"
              className="py-5 px-6 rounded-full w-fit"
              disabled={state.submitting}
            >
              {state.submitting ? <Loader2 className="animate-spin" /> : "Send"}
            </Button>
          </form>
        </motion.div>
      </motion.div>

      {/* SUB: Background Image */}
      <div className="absolute md:w-[30vw] w-[60vw] aspect-[1] top-[30%] opacity-5 -z-[4]">
        <Image
          src="/images/react-icon.svg"
          alt="react icon"
          fill
          role="presentation"
        />
      </div>
    </motion.section>
  );
};

export default Contact;
