import type { EndingData } from "../lib/gameTypes";

export const endings: Record<string, EndingData> = {
  provisional_success: {
    id: "provisional_success",
    headline: "危機は限定的収束へ",
    subheadline: "官房長官、複合危機を一定範囲内で制御",
    body: "政府は相手国との緊張を残しつつも、戦争拡大を避け、現地情勢の崩壊を防いだ。",
    defenseInstituteNote: "本終局では、政策判断・閣議調整・会見対応が破綻せず連結していた点が評価される。",
  },
  cabinet_collapse: {
    id: "cabinet_collapse",
    headline: "官邸危機管理が崩壊",
    subheadline: "首相信任を失い、政策調整能力が急速に低下",
    body: "官房長官は首相・閣内・省庁を結び直すことに失敗し、危機対応の主導権は官邸の外へ移った。",
    defenseInstituteNote: "首相信任と政治資本は、危機対応能力そのものとして機能していた。",
  },
};
