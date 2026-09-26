import { Dispatch, SetStateAction, ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface IAProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  showMenu: boolean;
  setShowMenu: Dispatch<SetStateAction<boolean>>;
}
const MenuButton = ({ showMenu, setShowMenu }: IAProps) => {
  return (
    <button
      className="block rounded-[25px] w-[5.2rem] h-[2.3rem] text-sm font-medium border-none overflow-hidden group relative z-[400] active:scale-95 transition-transform"
      onClick={() => setShowMenu((prev) => !prev)}
    >
      <span className="sr-only">{showMenu ? "Close menu" : "Open Menu"}</span>
      <motion.div
        animate={{ top: showMenu ? "-100%" : "0" }}
        transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
        className="w-full h-full relative group-hover:scale-x-110 duration-300"
      >
        <span className="flex items-center justify-center w-full h-full bg-accent text-accent-on">
          Menu
        </span>
        <span className="flex items-center justify-center w-full h-full absolute top-full bg-accent-on text-accent">
          Close
        </span>
      </motion.div>
    </button>
  );
};

export default MenuButton;
