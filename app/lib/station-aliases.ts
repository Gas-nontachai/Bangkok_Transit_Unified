const STATION_ALIASES: Record<string, string[]> = {
  "จตุจักร": ["สวนจตุจักร", "chatuchak park", "jj", "jj market"],
  "ห้าแยกลาดพร้าว": ["ลาดพร้าว bts", "union mall", "ลาดพร้าว intersection"],
  "กรุงเทพอภิวัฒน์": ["บางซื่อ กลาง", "bang sue grand", "krung thep aphiwat", "สถานีกลาง"],
  "พญาไท": ["phaya thai", "airport link พญาไท"],
  "มักกะสัน": ["makkasan", "airport link มักกะสัน"],
  "สยาม": ["siam", "siam paragon", "สยามพารากอน"],
  "อโศก": ["asok", "asoke", "terminal 21"],
  "หมอชิต": ["mo chit", "หมอชิต bts", "สถานีขนส่งหมอชิต"],
  "สำโรง": ["samrong", "สำโรง bts"],
  "เพชรบุรี": ["phetchaburi", "มักกะสัน mrt"],
};

export function getAliases(nameTh: string): string[] {
  return STATION_ALIASES[nameTh] ?? [];
}
