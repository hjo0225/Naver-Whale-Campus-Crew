"use client";

import { motion } from "framer-motion";
import { describeEndReason, type EndReason } from "@/lib/game/rules";

interface Props {
  reason: EndReason;
}

// 단계적 등장 — 모달이 먼저, 그 다음 안의 이모지·메시지가 차례로.
const T_BACKDROP = 0; // 백드롭 페이드 시작
const T_CARD = 0.25; // 카드(모달) 등장
const T_EMOJI = 0.7; // 이모지 등장
const T_TEXT = 1.0; // 메시지 등장

export function EndSplash({ reason }: Props) {
  const { emoji, line } = describeEndReason(reason);
  return (
    <motion.div
      className="end-splash-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: T_BACKDROP }}
    >
      <motion.div
        className="end-splash-card"
        initial={{ scale: 0.55, opacity: 0, y: 22 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 220,
          damping: 22,
          delay: T_CARD,
        }}
      >
        <motion.span
          className="end-splash-emoji"
          aria-hidden
          initial={{ scale: 0.3, opacity: 0, y: -24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 16,
            delay: T_EMOJI,
          }}
        >
          {emoji}
        </motion.span>
        <motion.span
          className="end-splash-text"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1],
            delay: T_TEXT,
          }}
        >
          {line}
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
