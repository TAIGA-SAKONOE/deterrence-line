"use client";

import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { createInitialState } from "../data/initialState";
import type { GameState, PreviewDelta } from "../lib/gameTypes";
import { emptyPreviewDelta } from "../lib/utils";

export default function Page() {
  const [game, setGame] = useState<GameState>(() => createInitialState("normal"));
  const [previewDelta, setPreviewDelta] = useState<PreviewDelta>(() => emptyPreviewDelta());

  return <AppShell game={game} setGame={setGame} previewDelta={previewDelta} setPreviewDelta={setPreviewDelta} />;
}
