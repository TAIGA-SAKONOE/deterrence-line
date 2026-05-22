"use client";
import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Radio, Newspaper, Landmark, Ship, Globe2, ScrollText, RotateCcw } from "lucide-react";

// 抑止線：Crisis Cabinet MVP
// プレイヤー：島嶼国家A 内閣官房長官
// 操作対象：戦略方針のみ
// 作戦・戦術・認知戦・国内政治・敵側反応は内部処理され、報告として返る

type Phase = "crisis" | "limitedWar" | "war" | "ended";
type Doctrine = "deterrence" | "restraint" | "alliance" | "domestic" | "cognitive" | "offensive" | "defensive" | "peace";
type ResultType = "ongoing" | "deterrence_success" | "limited_victory" | "bitter_ceasefire" | "political_collapse" | "fiscal_breakdown" | "uncontrolled_war" | "strategic_defeat";

type Stats = {
  cabinetTrust: number; // 首相信任
  governmentControl: number; // 政府統制
  militarySituation: number; // 戦況
  commandControl: number; // 指揮統制
  logistics: number; // 兵站
  allianceCooperation: number; // 同盟協力度
  publicSupport: number; // 政権支持
  publicFervor: number; // 世論過熱
  materialFinance: number; // 物資・財政
  internationalSupport: number; // 国際支持
  cognitiveAdvantage: number; // 認知優勢
  disinfoPollution: number; // 偽情報汚染
  escalationRisk: number; // 戦争拡大リスク
  peaceWindow: number; // 講和余地
  enemyPressure: number; // 敵圧力
  enemyDomesticPressure: number; // 敵国内圧力
};

type GameState = {
  turn: number;
  phase: Phase;
  stats: Stats;
  log: TurnReport[];
  result: ResultType;
  resultTitle?: string;
  resultText?: string;
};

type Effect = Partial<Record<keyof Stats, number>>;

type StrategyCard = {
  id: string;
  title: string;
  phase: Phase[];
  doctrine: Doctrine;
  intent: string;
  expected: string[];
  risks: string[];
  complexity: number;
  effects: Effect;
};

type FrictionEvent = {
  id: string;
  title: string;
  category: "military" | "logistics" | "political" | "cognitive" | "enemy" | "environment" | "diplomatic";
  trigger: (s: Stats, card: StrategyCard, phase: Phase) => number; // probability 0-1
  effects: Effect;
  report: string;
};

type TurnReport = {
  turn: number;
  phase: Phase;
  strategyTitle: string;
  strategyIntent: string;
  operationSummary: string;
  tacticalReports: string[];
  politicalReports: string[];
  outcomeSummary: string;
  effectsSummary: string[];
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

const statLabels: Record<keyof Stats, string> = {
  cabinetTrust: "首相信任",
  governmentControl: "政府統制",
  militarySituation: "戦況",
  commandControl: "指揮統制",
  logistics: "兵站",
  allianceCooperation: "同盟協力度",
  publicSupport: "政権支持",
  publicFervor: "世論過熱",
  materialFinance: "物資・財政",
  internationalSupport: "国際支持",
  cognitiveAdvantage: "認知優勢",
  disinfoPollution: "偽情報汚染",
  escalationRisk: "戦争拡大リスク",
  peaceWindow: "講和余地",
  enemyPressure: "敵圧力",
  enemyDomesticPressure: "敵国内圧力",
};

const initialStats: Stats = {
  cabinetTrust: 72,
  governmentControl: 68,
  militarySituation: 50,
  commandControl: 58,
  logistics: 56,
  allianceCooperation: 60,
  publicSupport: 62,
  publicFervor: 38,
  materialFinance: 65,
  internationalSupport: 58,
  cognitiveAdvantage: 48,
  disinfoPollution: 32,
  escalationRisk: 28,
  peaceWindow: 62,
  enemyPressure: 46,
  enemyDomesticPressure: 38,
};

const strategyCards: StrategyCard[] = [
  {
    id: "deterrence_signal",
    title: "抑止を強める",
    phase: ["crisis", "limitedWar"],
    doctrine: "deterrence",
    intent: "敵国Bに対し、封鎖行動の継続には高い代償が伴うことを示す。",
    expected: ["抑止の信頼性上昇", "敵圧力の抑制", "国内の安心感"],
    risks: ["偶発衝突", "敵国内強硬化", "戦争拡大リスク上昇"],
    complexity: 42,
    effects: { militarySituation: 4, enemyPressure: -5, publicSupport: 3, escalationRisk: 7, peaceWindow: -3, materialFinance: -3 },
  },
  {
    id: "alliance_front",
    title: "同盟を前面に出す",
    phase: ["crisis", "limitedWar", "war"],
    doctrine: "alliance",
    intent: "同盟国Dとの共同声明・情報共有・後方支援を軸に、多国間で敵国Bを抑える。",
    expected: ["同盟協力度上昇", "国際支持上昇", "敵の単独行動抑制"],
    risks: ["同盟国議会の遅延", "敵の同盟分断工作", "主導権低下"],
    complexity: 55,
    effects: { allianceCooperation: 8, internationalSupport: 5, enemyPressure: -3, escalationRisk: 2, governmentControl: -2 },
  },
  {
    id: "domestic_control",
    title: "国内統治を優先する",
    phase: ["crisis", "limitedWar", "war"],
    doctrine: "domestic",
    intent: "国民保護・会見・与党調整を優先し、世論過熱と政府不信を抑える。",
    expected: ["世論過熱低下", "政府統制回復", "偽情報への耐性向上"],
    risks: ["弱腰批判", "敵の既成事実化", "軍事的主導権低下"],
    complexity: 35,
    effects: { governmentControl: 6, publicFervor: -9, disinfoPollution: -4, publicSupport: 3, militarySituation: -2, enemyPressure: 3 },
  },
  {
    id: "cognitive_counter",
    title: "認知戦で主導権を取る",
    phase: ["crisis", "limitedWar", "war"],
    doctrine: "cognitive",
    intent: "証拠映像の公開、偽情報反駁、国際説明を通じて、軍事行動の政治的意味を制する。",
    expected: ["認知優勢上昇", "国際支持回復", "敵偽情報の効果低下"],
    risks: ["情報源露呈", "反駁遅延", "敵の対抗宣伝"],
    complexity: 48,
    effects: { cognitiveAdvantage: 10, disinfoPollution: -7, internationalSupport: 5, governmentControl: -2, enemyDomesticPressure: 3 },
  },
  {
    id: "limited_counterattack",
    title: "限定反撃を許容する",
    phase: ["limitedWar", "war"],
    doctrine: "offensive",
    intent: "敵の封鎖・前方展開を軍事的に押し返す。ただし交戦範囲は限定する。",
    expected: ["戦況改善", "敵圧力低下", "交渉上の主導権回復"],
    risks: ["偵察遅延", "兵站摩擦", "民間被害認知戦", "戦争拡大"],
    complexity: 72,
    effects: { militarySituation: 10, enemyPressure: -8, escalationRisk: 12, logistics: -7, materialFinance: -6, internationalSupport: -4, peaceWindow: -3 },
  },
  {
    id: "defensive_delay",
    title: "防勢持久を選ぶ",
    phase: ["limitedWar", "war"],
    doctrine: "defensive",
    intent: "損耗を抑え、同盟増援・国際仲裁・敵の疲弊を待つ。",
    expected: ["兵站維持", "戦争拡大抑制", "講和余地維持"],
    risks: ["既成事実化", "弱腰批判", "敵圧力増大"],
    complexity: 44,
    effects: { logistics: 5, materialFinance: 3, escalationRisk: -6, peaceWindow: 5, militarySituation: -4, publicFervor: 5, enemyPressure: 5 },
  },
  {
    id: "seek_ceasefire",
    title: "停戦工作を進める",
    phase: ["limitedWar", "war"],
    doctrine: "peace",
    intent: "中立国・同盟国を通じて、敵の退路を残しながら停戦条件を探る。",
    expected: ["講和余地上昇", "国際支持上昇", "戦争拡大抑制"],
    risks: ["国内強硬派反発", "敵の要求吊り上げ", "同盟国不信"],
    complexity: 50,
    effects: { peaceWindow: 12, internationalSupport: 4, escalationRisk: -8, publicFervor: 7, publicSupport: -3, enemyDomesticPressure: -2 },
  },
];

const frictionEvents: FrictionEvent[] = [
  {
    id: "recon_delay",
    title: "偵察報告の遅延",
    category: "military",
    trigger: (s, card) => card.doctrine === "offensive" ? 0.18 + (60 - s.commandControl) / 220 + (55 - s.logistics) / 250 + (55 - s.cognitiveAdvantage) / 350 : 0.04 + (50 - s.commandControl) / 400,
    effects: { militarySituation: -8, commandControl: -4, escalationRisk: 3 },
    report: "悪天候と敵の欺瞞通信が重なり、敵主力の位置特定が遅延。統合司令部は主攻撃機会を逸したと報告している。",
  },
  {
    id: "logistics_bottleneck",
    title: "補給・整備の輻輳",
    category: "logistics",
    trigger: (s, card) => 0.07 + card.complexity / 400 + (60 - s.logistics) / 180,
    effects: { logistics: -9, militarySituation: -5, materialFinance: -5 },
    report: "弾薬・燃料の追送と整備計画が輻輳し、前線投入可能な部隊数が予定を下回った。作戦規模は一部縮小された。",
  },
  {
    id: "ally_delay",
    title: "同盟国承認の遅れ",
    category: "diplomatic",
    trigger: (s, card) => card.doctrine === "alliance" || card.complexity > 50 ? 0.12 + (62 - s.allianceCooperation) / 180 + s.escalationRisk / 500 : 0.03,
    effects: { allianceCooperation: -6, commandControl: -3, militarySituation: -3 },
    report: "同盟国Dでは議会・世論への説明が難航し、共同作戦承認が遅れている。情報共有は継続するが、実働支援は限定的となった。",
  },
  {
    id: "enemy_fake_video",
    title: "敵国による偽映像拡散",
    category: "cognitive",
    trigger: (s) => 0.10 + s.disinfoPollution / 250 + (55 - s.cognitiveAdvantage) / 220,
    effects: { disinfoPollution: 11, cognitiveAdvantage: -6, internationalSupport: -5, publicFervor: 5 },
    report: "敵国系アカウントが旧映像を民間被害として拡散。政府は否定したが、情報空間は混乱し、海外メディアの一部も引用している。",
  },
  {
    id: "press_fever",
    title: "報道過熱と与党内反発",
    category: "political",
    trigger: (s) => 0.08 + s.publicFervor / 220 + s.disinfoPollution / 320 - s.governmentControl / 500,
    effects: { publicFervor: 9, publicSupport: -6, governmentControl: -5, cabinetTrust: -3 },
    report: "被害映像と未確認情報を受け、報道各社の論調が急速に強硬化。与党内からも『政府の説明が遅い』との不満が出ている。",
  },
  {
    id: "enemy_overreach",
    title: "敵前線部隊の独走",
    category: "enemy",
    trigger: (s) => 0.07 + s.enemyDomesticPressure / 260 + s.enemyPressure / 300,
    effects: { enemyPressure: 7, escalationRisk: 8, peaceWindow: -5, militarySituation: -4 },
    report: "敵前線部隊が中央の意図を超えて警戒線を拡大。偶発的衝突の危険が高まり、外交ルートでは敵政府の説明も揺れている。",
  },
  {
    id: "enemy_logistics_strain",
    title: "敵補給線の逼迫",
    category: "enemy",
    trigger: (s, card) => card.doctrine === "defensive" || card.doctrine === "deterrence" ? 0.12 + (100 - s.enemyPressure) / 600 + s.enemyDomesticPressure / 400 : 0.06,
    effects: { enemyPressure: -9, militarySituation: 5, peaceWindow: 4 },
    report: "長期展開により敵補給線に逼迫の兆候。敵艦艇の一部が後方へ下がり、封鎖圧力は一時的に低下した。",
  },
  {
    id: "cabinet_leak",
    title: "停戦接触のリーク",
    category: "political",
    trigger: (s, card) => card.doctrine === "peace" ? 0.17 + s.disinfoPollution / 300 + (60 - s.governmentControl) / 230 : 0.025,
    effects: { publicFervor: 10, cabinetTrust: -5, peaceWindow: -5, cognitiveAdvantage: -3 },
    report: "中立国経由の停戦接触が一部報道に漏れた。国内強硬派は『弱腰外交』と批判し、敵国も条件を吊り上げる構えを見せている。",
  },
  {
    id: "successful_disclosure",
    title: "証拠公開が奏功",
    category: "cognitive",
    trigger: (s, card) => card.doctrine === "cognitive" ? 0.24 + s.cognitiveAdvantage / 500 + s.governmentControl / 500 : 0.04,
    effects: { cognitiveAdvantage: 8, internationalSupport: 7, disinfoPollution: -6, allianceCooperation: 3 },
    report: "政府が公開した証拠映像と時系列資料により、敵国の主張には重大な矛盾があることが確認された。同盟国・主要メディアは政府説明を概ね支持している。",
  },
  {
    id: "public_order_success",
    title: "国民保護広報が浸透",
    category: "political",
    trigger: (s, card) => card.doctrine === "domestic" ? 0.22 + s.governmentControl / 500 - s.disinfoPollution / 600 : 0.04,
    effects: { publicFervor: -8, publicSupport: 5, governmentControl: 4, disinfoPollution: -3 },
    report: "官房長官会見と国民保護情報の発信が浸透し、流言の拡大は一部抑制された。大都市で予定されていた抗議集会も規模を縮小している。",
  },
];

function applyEffects(stats: Stats, effects: Effect): Stats {
  const next = { ...stats };
  for (const [key, value] of Object.entries(effects) as [keyof Stats, number][]) {
    next[key] = clamp(next[key] + value);
  }
  return next;
}

function mergeEffects(...effectsList: Effect[]): Effect {
  const merged: Effect = {};
  for (const effects of effectsList) {
    for (const [key, value] of Object.entries(effects) as [keyof Stats, number][]) {
      merged[key] = (merged[key] ?? 0) + value;
    }
  }
  return merged;
}

function statusWord(key: keyof Stats, value: number) {
  if (key === "publicFervor" || key === "disinfoPollution" || key === "escalationRisk" || key === "enemyPressure" || key === "enemyDomesticPressure") {
    if (value >= 80) return "危険水準";
    if (value >= 60) return "高い";
    if (value >= 40) return "警戒";
    return "低い";
  }
  if (value >= 80) return "優勢";
  if (value >= 60) return "安定";
  if (value >= 40) return "不安定";
  if (value >= 20) return "逼迫";
  return "崩壊寸前";
}

function operationNarrative(card: StrategyCard, phase: Phase) {
  const phaseText = phase === "crisis" ? "危機管理局面" : phase === "limitedWar" ? "限定衝突局面" : "戦争指導局面";
  if (card.doctrine === "offensive") return `${phaseText}において、国家安全保障会議は限定反撃を許容。統合司令部は敵前方部隊への打撃、海上交通路の回復、同盟国との衝突回避調整を組み合わせた作戦を立案した。`;
  if (card.doctrine === "defensive") return `${phaseText}において、政府は防勢持久を選択。統合司令部は重要港湾・航路の防護、損耗部隊の再編、同盟増援までの遅滞行動を中心に計画した。`;
  if (card.doctrine === "alliance") return `${phaseText}において、官邸は同盟国Dとの共同対応を前面化。外務・防衛両ルートで共同声明、情報共有、後方支援の調整が開始された。`;
  if (card.doctrine === "domestic") return `${phaseText}において、官房長官は国内統治を優先。記者会見、国民保護情報、与党幹部説明、偽情報監視を一体で実施した。`;
  if (card.doctrine === "cognitive") return `${phaseText}において、政府は認知戦上の主導権確保を企図。証拠公開、敵偽情報への反駁、国際メディアへの背景説明を進めた。`;
  if (card.doctrine === "peace") return `${phaseText}において、官邸は停戦工作を開始。中立国・同盟国を通じて敵国Bの退路を残す条件を探りつつ、国内向け説明の準備を進めた。`;
  return `${phaseText}において、政府は抑止シグナルを強化。防衛当局は前方展開と監視強化を進め、外務当局は敵国Bに警告を伝達した。`;
}

function baseOutcome(card: StrategyCard, before: Stats, after: Stats, phase: Phase) {
  if (phase === "crisis" && after.enemyPressure < 28 && after.escalationRisk < 55 && after.internationalSupport > 55) {
    return "敵国Bは封鎖に近い行動を一部縮小した。危機はなお継続するが、政府は抑止と外交の両面で一定の主導権を得た。";
  }
  if (card.doctrine === "offensive" && after.militarySituation > before.militarySituation) {
    return "限定反撃は一定の軍事的成果を上げた。ただし、戦果の政治的意味は認知戦と国際世論に左右され続けている。";
  }
  if (card.doctrine === "peace") return "停戦の糸口は生まれたが、国内強硬派と敵国側の威信問題により、出口はなお細い。";
  if (card.doctrine === "domestic") return "国内の混乱は一部抑えられた。もっとも、敵国Bはこの間に現場での圧力を維持している。";
  if (card.doctrine === "cognitive") return "情報空間での主導権は改善した。軍事的成果を政治的成果へ変換する余地が広がっている。";
  if (card.doctrine === "alliance") return "同盟国Dとの連携は前進した。ただし、同盟国側の国内手続きが作戦速度を制約している。";
  if (card.doctrine === "defensive") return "損耗は抑えられたが、敵の圧力は残る。時間を味方につけられるかは、同盟増援と講和環境にかかっている。";
  return "抑止シグナルは敵国Bに伝わったが、危機はなお流動的である。";
}

function evaluateEnd(state: GameState): Pick<GameState, "phase" | "result" | "resultTitle" | "resultText"> | null {
  const s = state.stats;
  if (s.escalationRisk >= 100) {
    return { phase: "ended", result: "uncontrolled_war", resultTitle: "戦争の制御不能化", resultText: "限定的な危機として管理されるはずだった衝突は、報復と再報復の連鎖により制御不能な全面戦争へ拡大した。官邸は危機を限定範囲に収める選択肢を失った。" };
  }
  if (s.materialFinance <= 0) {
    return { phase: "ended", result: "fiscal_breakdown", resultTitle: "戦時財政の破綻", resultText: "燃料・弾薬・食料の調達が限界に達し、軍需生産と民生維持の両立が不可能となった。政府は作戦継続能力の喪失を認め、停戦交渉では大幅な譲歩を迫られている。" };
  }
  if (s.cabinetTrust <= 0 || s.governmentControl <= 0 || s.publicSupport <= 0) {
    return { phase: "ended", result: "political_collapse", resultTitle: "官邸危機管理の崩壊", resultText: "省庁・与党・政府発信の統一が失われ、首相は官房長官による危機調整能力に疑問を呈した。危機対応の中枢は再編され、あなたは事実上更迭された。" };
  }
  if (s.militarySituation <= 0 || s.logistics <= 0) {
    return { phase: "ended", result: "strategic_defeat", resultTitle: "前線戦力の崩壊", resultText: "損耗と補給不足により、主力部隊の稼働率は危険水準を下回った。統合司令部は攻勢作戦の継続不能を報告し、敵国Bは係争海域での既成事実化を進めた。" };
  }
  if (state.turn >= 24) {
    if (s.enemyPressure < 35 && s.peaceWindow > 55 && s.internationalSupport > 50) {
      return { phase: "ended", result: "limited_victory", resultTitle: "限定勝利", resultText: "政府は敵国Bの封鎖行動を押し返し、同盟と国際支持を維持したまま停戦条件を確保した。損害は残るが、相手の戦略目的は挫かれた。" };
    }
    if (s.peaceWindow > 40 && s.escalationRisk < 80) {
      return { phase: "ended", result: "bitter_ceasefire", resultTitle: "苦い停戦", resultText: "封鎖危機は停戦に至ったが、国内には被害と不信が残り、経済損失も大きい。政府は戦争拡大を防いだ一方、危機後の秩序再建という重い課題を背負った。" };
    }
    return { phase: "ended", result: "strategic_defeat", resultTitle: "外交的・戦略的敗北", resultText: "全面戦争は避けられたが、敵国Bは係争海域での影響力を拡大し、封鎖に近い既成事実を残した。官邸の危機対応は後世、初動の曖昧さを批判されることになる。" };
  }
  return null;
}

function nextPhase(turn: number, stats: Stats, current: Phase): Phase {
  if (current === "ended") return "ended";
  if (current === "crisis" && (stats.escalationRisk >= 52 || stats.enemyPressure >= 68 || turn >= 8)) return "limitedWar";
  if (current === "limitedWar" && (stats.escalationRisk >= 78 || turn >= 16)) return "war";
  return current;
}

function resolveTurn(state: GameState, card: StrategyCard): GameState {
  const before = state.stats;
  let totalEffects = mergeEffects(card.effects);
  const tacticalReports: string[] = [];
  const politicalReports: string[] = [];
  const effectsSummary: string[] = [];

  // 敵の基礎圧力。ターンが進むほどじわじわ増える。
  const enemyDrift: Effect = state.phase === "crisis"
    ? { enemyPressure: 3, materialFinance: -1, peaceWindow: -1 }
    : state.phase === "limitedWar"
      ? { enemyPressure: 4, materialFinance: -3, logistics: -2, escalationRisk: 3, peaceWindow: -2 }
      : { enemyPressure: 3, materialFinance: -5, logistics: -3, escalationRisk: 4, peaceWindow: -3, publicFervor: 2 };
  totalEffects = mergeEffects(totalEffects, enemyDrift);

  const triggered: FrictionEvent[] = [];
  for (const ev of frictionEvents) {
    const p = Math.max(0, Math.min(0.75, ev.trigger(before, card, state.phase)));
    if (Math.random() < p) triggered.push(ev);
  }

  for (const ev of triggered.slice(0, 3)) {
    totalEffects = mergeEffects(totalEffects, ev.effects);
    const line = `【${ev.title}】${ev.report}`;
    if (["military", "logistics", "environment", "enemy"].includes(ev.category)) tacticalReports.push(line);
    else politicalReports.push(line);
  }

  let after = applyEffects(before, totalEffects);
  const phase = nextPhase(state.turn + 1, after, state.phase);

  // フェーズ移行報告
  if (state.phase === "crisis" && phase === "limitedWar") {
    tacticalReports.push("【限定衝突への移行】敵国Bの封鎖行動と前線部隊の接近により、危機は限定衝突局面へ移行した。戦争はゲームオーバーではなく、より困難な戦争指導フェーズへの入口である。");
  }
  if (state.phase === "limitedWar" && phase === "war") {
    tacticalReports.push("【戦争指導局面への移行】報復と再報復が継続し、政府は限定衝突を超えた戦争指導を迫られている。作戦・戦術の摩擦は、国内政治と講和条件に直接波及する。 ");
  }

  Object.entries(totalEffects).forEach(([k, v]) => {
    if (v) effectsSummary.push(`${statLabels[k as keyof Stats]} ${v > 0 ? "+" : ""}${v}`);
  });

  const report: TurnReport = {
    turn: state.turn + 1,
    phase: state.phase,
    strategyTitle: card.title,
    strategyIntent: card.intent,
    operationSummary: operationNarrative(card, state.phase),
    tacticalReports: tacticalReports.length ? tacticalReports : ["作戦・戦術段階で重大な摩擦は確認されなかった。ただし、敵国Bの圧力と情報空間の混乱は継続している。"],
    politicalReports: politicalReports.length ? politicalReports : ["官房長官会見は大きな失点なく終了。与党・報道・同盟国への説明は概ね維持された。"],
    outcomeSummary: baseOutcome(card, before, after, state.phase),
    effectsSummary,
  };

  const next: GameState = { ...state, turn: state.turn + 1, phase, stats: after, log: [report, ...state.log].slice(0, 12), result: "ongoing" };
  const end = evaluateEnd(next);
  if (end) return { ...next, ...end };
  return next;
}

function startState(): GameState {
  return { turn: 0, phase: "crisis", stats: initialStats, log: [], result: "ongoing" };
}

const phaseLabel: Record<Phase, string> = {
  crisis: "危機管理局面",
  limitedWar: "限定衝突局面",
  war: "戦争指導局面",
  ended: "終局",
};

const phaseIcon: Record<Phase, React.ReactNode> = {
  crisis: <Radio className="h-4 w-4" />,
  limitedWar: <Ship className="h-4 w-4" />,
  war: <Shield className="h-4 w-4" />,
  ended: <ScrollText className="h-4 w-4" />,
};

function StatBar({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">{value} / {danger ? (value >= 80 ? "危険" : value >= 60 ? "高" : "低") : statusWord(Object.keys(statLabels).find(k => statLabels[k as keyof Stats] === label) as keyof Stats, value)}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full bg-slate-800" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function DeterrenceLineMVP() {
  const [game, setGame] = useState<GameState>(() => startState());
  const availableCards = useMemo(() => strategyCards.filter(c => c.phase.includes(game.phase) && game.phase !== "ended"), [game.phase]);

  const briefing = useMemo(() => {
    if (game.phase === "crisis") return "大陸国家Bは島嶼地域C周辺で大規模演習を継続。一部艦艇が商船航路に接近し、事実上の封鎖へ移行する兆候がある。";
    if (game.phase === "limitedWar") return "偶発的衝突後、敵国Bは前方展開を継続。政府は軍事的反応、同盟調整、国内説明、講和窓口の維持を同時に迫られている。";
    if (game.phase === "war") return "限定衝突は戦争指導局面へ移行。官邸は作戦目的、損耗、兵站、認知戦、国内統治、停戦条件を総合して次の戦略を決めなければならない。";
    return game.resultTitle ?? "終局";
  }, [game.phase, game.resultTitle]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Landmark className="h-4 w-4" />
              島嶼国家A 内閣官房長官シミュレーター
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">抑止線：Crisis Cabinet</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="gap-1 rounded-full px-3 py-1 bg-slate-900 text-white">{phaseIcon[game.phase]} {phaseLabel[game.phase]}</Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">Turn {game.turn} / 24</Badge>
            <Button variant="outline" size="sm" onClick={() => setGame(startState())} className="gap-1 rounded-full"><RotateCcw className="h-4 w-4" />再開</Button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_1.35fr_0.9fr]">
          <section className="space-y-4">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Globe2 className="h-4 w-4" />官邸危機管理センター 報告</div>
                <p className="text-sm leading-7">{briefing}</p>
                {game.phase !== "ended" && (
                  <div className="rounded-xl bg-slate-50 p-4 text-sm leading-7 border">
                    <div className="font-semibold mb-1">首相の問い</div>
                    <p>「政府として、どこまで踏み込むべきか。戦略方針を整理してほしい。」</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Newspaper className="h-4 w-4" />各機関の助言</div>
                <div className="space-y-3 text-sm leading-6">
                  <p><b>防衛省：</b>{game.stats.commandControl < 45 ? "指揮統制に不安があります。複雑な作戦は避けるべきです。" : "現時点では限定的な作戦遂行は可能です。"}</p>
                  <p><b>外務省：</b>{game.stats.allianceCooperation < 45 ? "同盟国Dの国内手続きが遅れています。共同対応には時間を要します。" : "同盟国Dは共同声明に前向きです。"}</p>
                  <p><b>財務省：</b>{game.stats.materialFinance < 40 ? "市場と物流が逼迫しています。長期戦は財政面で危険です。" : "現時点では戦時支出に一定の余力があります。"}</p>
                  <p><b>情報機関：</b>{game.stats.disinfoPollution > 60 ? "敵国系の偽情報が急増しています。政府発表への信頼維持が急務です。" : "敵意図は断定できませんが、封鎖固定化の兆候があります。"}</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <main className="space-y-4">
            {game.phase !== "ended" ? (
              <Card className="rounded-2xl shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Shield className="h-4 w-4" />あなたの上申：戦略方針を選ぶ</div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {availableCards.map((card) => (
                      <motion.div key={card.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                        <button onClick={() => setGame(g => resolveTurn(g, card))} className="h-full w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-lg">{card.title}</h3>
                            <Badge variant="outline" className="shrink-0">複雑度 {card.complexity}</Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{card.intent}</p>
                          <div className="mt-3 space-y-2">
                            <div className="text-xs font-semibold text-slate-500">想定効果</div>
                            <div className="flex flex-wrap gap-1">{card.expected.map(e => <Badge key={e} className="bg-slate-800 text-white rounded-full">{e}</Badge>)}</div>
                            <div className="text-xs font-semibold text-slate-500 pt-1">主な摩擦要因</div>
                            <div className="flex flex-wrap gap-1">{card.risks.map(r => <Badge key={r} variant="outline" className="rounded-full">{r}</Badge>)}</div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl shadow-sm border-slate-300">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><ScrollText className="h-4 w-4" />最終報告</div>
                  <h2 className="text-3xl font-semibold">{game.resultTitle}</h2>
                  <p className="leading-8 text-slate-700">{game.resultText}</p>
                  <div className="rounded-xl bg-slate-50 p-4 border text-sm leading-7">
                    <div className="font-semibold mb-1">後世の評価</div>
                    <p>この危機における官邸の判断は、戦略方針そのものだけでなく、作戦・戦術段階の摩擦、認知戦、同盟調整、国内政治をどこまで織り込めたかによって評価される。</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><ScrollText className="h-4 w-4" />最新報告ログ</div>
                {game.log.length === 0 ? (
                  <p className="text-sm text-slate-500 leading-7">まだ戦略上申は行われていません。プレイヤーは作戦・戦術を直接操作せず、戦略方針だけを決定します。</p>
                ) : (
                  <div className="space-y-4">
                    {game.log.map((r) => (
                      <div key={`${r.turn}-${r.strategyTitle}`} className="rounded-2xl border bg-white p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold">Turn {r.turn}：{r.strategyTitle}</div>
                          <Badge variant="outline">{phaseLabel[r.phase]}</Badge>
                        </div>
                        <p className="text-sm leading-7"><b>戦略意図：</b>{r.strategyIntent}</p>
                        <p className="text-sm leading-7"><b>作戦変換：</b>{r.operationSummary}</p>
                        <div className="space-y-2">
                          {r.tacticalReports.map((t, i) => <p key={i} className="text-sm leading-7"><b>作戦・戦術報告：</b>{t}</p>)}
                          {r.politicalReports.map((p, i) => <p key={i} className="text-sm leading-7"><b>政治・認知領域：</b>{p}</p>)}
                        </div>
                        <p className="text-sm leading-7"><b>総合評価：</b>{r.outcomeSummary}</p>
                        <div className="flex flex-wrap gap-1">{r.effectsSummary.slice(0, 10).map(e => <Badge key={e} variant="secondary" className="rounded-full">{e}</Badge>)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>

          <aside className="space-y-4">
            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><AlertTriangle className="h-4 w-4" />国家状態</div>
                <div className="space-y-3">
                  <StatBar label="首相信任" value={game.stats.cabinetTrust} />
                  <StatBar label="政府統制" value={game.stats.governmentControl} />
                  <StatBar label="戦況" value={game.stats.militarySituation} />
                  <StatBar label="指揮統制" value={game.stats.commandControl} />
                  <StatBar label="兵站" value={game.stats.logistics} />
                  <StatBar label="物資・財政" value={game.stats.materialFinance} />
                  <StatBar label="同盟協力度" value={game.stats.allianceCooperation} />
                  <StatBar label="国際支持" value={game.stats.internationalSupport} />
                  <StatBar label="認知優勢" value={game.stats.cognitiveAdvantage} />
                  <StatBar label="講和余地" value={game.stats.peaceWindow} />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600"><AlertTriangle className="h-4 w-4" />危険指標</div>
                <div className="space-y-3">
                  <StatBar label="世論過熱" value={game.stats.publicFervor} danger />
                  <StatBar label="偽情報汚染" value={game.stats.disinfoPollution} danger />
                  <StatBar label="戦争拡大リスク" value={game.stats.escalationRisk} danger />
                  <StatBar label="敵圧力" value={game.stats.enemyPressure} danger />
                  <StatBar label="敵国内圧力" value={game.stats.enemyDomesticPressure} danger />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-sm bg-slate-900 text-white">
              <CardContent className="p-5 space-y-3">
                <div className="text-sm font-semibold text-slate-300">設計原則</div>
                <p className="text-sm leading-7 text-slate-200">プレイヤーが決めるのは戦略だけ。作戦・戦術は内部で処理され、偵察遅延、兵站摩擦、同盟調整、認知戦、国内政治として報告される。</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
