import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// HDR: SLEEP/DELAY
export const delay = async (time: number): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`Promise resolved after ${time} milliseconds`);
    }, time * 1000);
  });
};
