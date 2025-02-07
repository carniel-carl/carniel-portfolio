"use client";
import { navLinksData } from "@/data/navlinks";
import React, { useEffect, useCallback } from "react";

const FloatNav = () => {
  // const [showFloatNav, setShowFloatNav] = useState(false);

  //   HDR: On Page load, Add active to the first li
  useEffect(() => {
    const navlink = document.querySelector(".float-nav li");
    if (navlink) {
      navlink.classList.add("active");
    }
  }, []);

  // TIMER FOR SHOWING FLOATING NAVIGATION
  // useEffect(() => {
  //   let timeoutid;

  //   const handleScroll = () => {
  //     clearTimeout(timeoutid);
  //     setShowFloatNav(false);

  //     timeoutid = setTimeout(() => {
  //       setShowFloatNav(true);
  //     }, 800);
  //   };

  //   window.addEventListener("scroll", handleScroll);

  //   return () => {
  //     clearTimeout(timeoutid);
  //     window.removeEventListener("scroll", handleScroll);
  //   };
  // }, []);

  //HDR: SETTING THE ACTIVE NAV LINK BASED ON SCROLLED POSITION
  useEffect(() => {
    const home = navLinksData.id;
    const navlinks = document.querySelectorAll(".float-nav li");
    const sections = document.querySelectorAll(home);

    const inview = () => {
      const currentPosition = window.scrollY;
      sections?.forEach((section, index) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;

        if (
          currentPosition >= sectionTop - sectionHeight / 2 &&
          currentPosition < sectionTop + sectionHeight / 2
        ) {
          navlinks.forEach((link) => {
            link.classList.remove("active");
          });
          navlinks[index]?.classList.add("active");
        }
      });
    };
    window.addEventListener("scroll", inview);

    return () => {
      window.removeEventListener("scroll", inview);
    };
  }, []);

  //   HDR: Scroll to section on click
  const scrollToSection = useCallback((elementRef: string) => {
    if (elementRef === "#") {
      window.scrollTo({
        top: 0,
      });
      return;
    }
    const sectionEL = document.querySelector(elementRef);
    window.scrollTo({
      top: sectionEL?.offsetTop,
    });
  }, []);

  return (
    <nav className="float-nav">
      <div className="navigation">
        <ul className="icons">
          {navLinksData.links.map((data) => (
            <li key={data.title}>
              <div
                className="navigate"
                onClick={() => scrollToSection(data.to)}
              >
                <span className="icon">
                  <data.icon />
                </span>

                <span className="tooltip">{data.title}</span>
              </div>
            </li>
          ))}

          <div className="indicator" />
        </ul>
      </div>
    </nav>
  );
};

export default React.memo(FloatNav);
