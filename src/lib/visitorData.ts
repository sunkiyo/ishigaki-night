// 出典: 石垣市観光文化課「入域観光推計」各月PDF
// https://www.city.ishigaki.okinawa.jp/soshiki/kanko_bunka/survey_statistic/4166.html

export type YearData = {
  visitors: (number | null)[]
  air: (number | null)[]
  sea: (number | null)[]
  total: number | null
}

export const OFFICIAL_DATA: Record<number, YearData> = {
  2024: {
    visitors: [73009, 81679, 103073, 91658, 80100, 84579, 108233, 122567, 97777, 99297, 88618, 80500],
    air:      [null, null, null, null, null, null, null, null, null, null, null, null],
    sea:      [null, null, null, null, null, null, null, null, null, null, null, null],
    total: 1405543,
  },
  2025: {
    // 観光客数 = 空路 + 海路（R8年1月PDF掲載の前年データより確認）
    visitors: [94077, 86306, 130199, 131192, 118195, 121310, 130880, 163665, 137874, 130479, 123307, 122668],
    air:      [76931, 79631, 103727, 101415,  96219,  99624, 119532, 133612, 114140, 110585,  95366,  91204],
    sea:      [17146,  6675,  26472,  29777,  21976,  21686,  11348,  30053,  23734,  19894,  27941,  31464],
    total: 1490152,
  },
  2026: {
    // 令和8年1月PDF確認
    visitors: [118755, null, null, null, null, null, null, null, null, null, null, null],
    air:      [84341,  null, null, null, null, null, null, null, null, null, null, null],
    sea:      [34414,  null, null, null, null, null, null, null, null, null, null, null],
    total: null,
  },
}

export const MONTHS_JA = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
export const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function getLatestYear(): number {
  const years = Object.keys(OFFICIAL_DATA).map(Number).sort((a, b) => a - b)
  for (let i = years.length - 1; i >= 0; i--) {
    if (OFFICIAL_DATA[years[i]].visitors.some((v) => v != null)) return years[i]
  }
  return years[years.length - 1]
}

export function wareki(year: number): string {
  if (year >= 2019) return `令和${year - 2018}年`
  if (year >= 1989) return `平成${year - 1988}年`
  return `${year}年`
}
