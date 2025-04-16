import { Variants } from "framer-motion";

// Common animation variants
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  }
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

export const cardHover = {
  rest: { y: 0, boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)" },
  hover: { 
    y: -4, 
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.2 }
  }
};

export const staggerChildren = (delayFactor: number = 0.05): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: delayFactor
    }
  }
});

export const itemVariants = (index: number): Variants => ({
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      delay: index * 0.05,
      duration: 0.3
    }
  }
});

export const modalAnimation: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.9,
    y: 20
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

export const overlayAnimation: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
};
