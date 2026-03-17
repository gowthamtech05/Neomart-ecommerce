import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SplashScreen = ({ onDone }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 1800;
    let raf;

    const tick = (now) => {
      const elapsed = now - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (elapsed < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const fadeTimer = setTimeout(() => setFadeOut(true), 1900);
    const doneTimer = setTimeout(onDone, 2500);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          key="splash"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: "easeIn" }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[white]"
        >
          {/* Cart + spinning leaf */}
          <div className="relative mb-5">
            <motion.div
              animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-[#6FAF8E]"
            >
              {/* Shopping cart SVG */}
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </motion.div>

            {/* Spinning leaf */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2.5 -right-2.5 text-[#6FAF8E]"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </motion.div>
          </div>

          {/* Brand name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-black text-5xl font-black tracking-tight mb-6"
            style={{ fontFamily: "sans-serif", letterSpacing: "-1px" }}
          >
            NEO<span className="text-[#6FAF8E]">MART</span>
          </motion.div>

          {/* Glowing progress bar */}
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#6FAF8E] rounded-full"
              style={{
                width: `${progress}%`,
                boxShadow: "0 0 12px #22c55e, 0 0 24px #22c55e55",
                transition: "none",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
