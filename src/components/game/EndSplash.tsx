"use client";

import { motion } from "framer-motion";
import { describeEndReason, type EndReason } from "@/lib/game/rules";

interface Props {
  reason: EndReason;
}

export function EndSplash({ reason }: Props) {
  const { emoji, line } = describeEndReason(reason);
  return (
    <div className="end-splash-backdrop">
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="end-splash-card"
      >
        <span className="end-splash-emoji" aria-hidden>
          {emoji}
        </span>
        <span className="end-splash-text">{line}</span>
      </motion.div>
    </div>
  );
}
