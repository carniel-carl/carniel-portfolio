"use client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { BsGithub } from "react-icons/bs";
import { HiDownload } from "react-icons/hi";

const Contact = () => {
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const msgRef = useRef<HTMLTextAreaElement | null>(null);

  return (
    <section id="contact" className="portfolio flex flex-col">
      <h2 className="heading-style after:content-['Reach_out_to_me'] font-nunito after:font-montserrat md:self-center md:mb-20 mb-12">
        contact
      </h2>

      <div className="grid md:grid-cols-2  min-h-[25rem]">
        <div className="hire-container">
          <p className="text-xl mb-12 font-bold">Hire me</p>
          <div className="flex flex-col gap-4 items-start">
            <a
              href="CHIMEZIE RESUME"
              className={cn(buttonVariants(), "py-6")}
              download="CHIMEZIE RESUME.pdf"
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
        </div>

        <div className="email-container">
          <p>Connect with me</p>
          <div className="project-form">
            <form method="post">
              <div className="input-area">
                <input
                  type="text"
                  name="name"
                  required
                  className="input"
                  ref={nameRef}
                />
                <span className="label">Name</span>
              </div>

              <div className="input-area">
                <input
                  type="email"
                  name="email"
                  required
                  className="input"
                  id="email"
                  ref={emailRef}
                />
                <span className="label">Email</span>
              </div>
              {/* 
            <ValidationError
              prefix="Message"
              field="message"
              errors={state.errors}
            /> */}
              <div className="input-area textarea">
                <textarea
                  name="message"
                  id="message"
                  required
                  className="input"
                  ref={msgRef}
                />
                <span className="label">Project</span>
              </div>

              {/* <button className="submit" disabled={state.submitting}>
              {state.submitting ? <LoadingSpinner /> : <span>Send</span>}
            </button> */}
            </form>
          </div>
        </div>
      </div>

      {/* <div className="react-cont">
      <img src={icon} alt="react icon" />
    </div> */}
    </section>
  );
};

export default Contact;
