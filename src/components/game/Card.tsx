"use client";

import { CHAR_IMAGES } from "@/lib/game/data";
import type { Card as CardModel, CardType } from "@/lib/game/types";
import { cn } from "@/lib/utils";

export type CardSize = "default" | "large" | "mini";

interface CardProps {
  card: CardModel | CardType;
  size?: CardSize;
  playable?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  faded?: boolean;
}

export function Card({ card, size = "default", playable, disabled, onClick, faded }: CardProps) {
  const isLlama = card.value === "LLAMA";
  const valueDisplay = isLlama ? "L" : card.value;

  return (
    <div
      className={cn(
        "game-card",
        size === "large" && "large",
        size === "mini" && "mini",
        isLlama && "llama",
        playable && "playable",
        disabled && "disabled",
        faded && "opacity-30"
      )}
      onClick={playable ? onClick : undefined}
    >
      <div className="card-value-top">{valueDisplay}</div>
      <div className="card-art">
        {isLlama ? (
          <div className="card-art-llama">🦙</div>
        ) : card.char ? (
          <img src={CHAR_IMAGES[card.char]} alt={card.name} />
        ) : null}
      </div>
      <div className="card-name">{card.name}</div>
      <div className="card-value-bottom">{valueDisplay}</div>
    </div>
  );
}

export function CardBack({ size = "mini" }: { size?: CardSize }) {
  return (
    <div className={cn("game-card back", size === "large" && "large", size === "mini" && "mini")} />
  );
}
