import { useEffect } from "react";

const usePreventPageScroll = (shouldPreventScroll: boolean) => {
  useEffect(() => {
    const className = "no-scroll";
    if (shouldPreventScroll) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
  }, [shouldPreventScroll]);

  return null;
};

export default usePreventPageScroll;
