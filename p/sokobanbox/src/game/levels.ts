// =============================================================
//  LEVELS — tambah level baru cukup di file ini.
//  Map ASCII:
//    '#' dinding   ' ' lantai   '.' goal
//    '$' kotak     '*' kotak di goal
//    '@' pemain    '+' pemain di goal
//  par = jumlah moves optimal (dasar rating bintang)
// =============================================================

export type LevelDef = {
  name: string;
  par: number;
  map: string[];
};

export type World = {
  id: number;
  name: string;
  subtitle: string;
  levels: LevelDef[];
};

export const WORLDS: World[] = [
  {
    id: 1,
    name: "WORLD 01",
    subtitle: "THE WAREHOUSE",
    levels: [
      { name: "First Push", par: 6, map: ["#######", "#     #", "#  $  #", "#  .  #", "#  @  #", "#     #", "#######"] },
      { name: "Two Steps", par: 5, map: ["#######", "#     #", "# @$. #", "#     #", "# .$  #", "#     #", "#######"] },
      { name: "Double Tap", par: 14, map: ["#######", "#.    #", "# $   #", "#   $ #", "#    .#", "#  @  #", "#######"] },
      { name: "Corner Push", par: 23, map: ["#########", "#   #   #", "# $ .   #", "#   #   #", "# . # $ #", "#   #   #", "#   @   #", "#########"] },
      { name: "Corridor", par: 3, map: ["#########", "#       #", "# ##### #", "# @ $ . #", "# ##### #", "#       #", "#########"] },
      { name: "Maze Box", par: 31, map: ["##########", "#        #", "#  ## $$ #", "# #  #   #", "# .  .   #", "#  ##    #", "#    @   #", "##########"] },
      { name: "Warehouse", par: 39, map: ["##########", "#....    #", "#     #  #", "# $$$$   #", "#  #   @ #", "#        #", "##########"] },
      { name: "Sidestep", par: 6, map: ["########", "#      #", "# .$ @ #", "#  #   #", "# .$   #", "#      #", "########"] },
      { name: "Zigzag", par: 25, map: ["###########", "#@        #", "# $ # # $ #", "#   # # # #", "# .   .   #", "#         #", "###########"] },
      { name: "Classic", par: 24, map: ["  #####  ", "  #   #  ", "  # $ #  ", "### $##  ", "#  $ .#  ", "# . .##  ", "##@###   "] },
    ],
  },
  {
    id: 2,
    name: "WORLD 02",
    subtitle: "THE BASEMENT",
    levels: [
      { name: "Cross Roads", par: 85, map: ["##########", "#  #     #", "# $   .$ #", "#. #     #", "#######.###", "  # $@ $ #", "  #    . #", "  ########"] },
      { name: "Pillars", par: 45, map: ["#########", "#       #", "# # # # #", "# $ $ @ #", "# # # # #", "# .   . #", "#########"] },
      { name: "Tight Fit", par: 32, map: ["########", "#  .   #", "# $##$ #", "#   @  #", "# $##  #", "#  .   #", "#  .   #", "########"] },
      { name: "The Hook", par: 23, map: ["#########", "#   #   #", "# $ $   #", "#  ###  #", "# . . @ #", "#       #", "#########"] },
      { name: "Master", par: 54, map: ["     #####", "######   #", "#    #   #", "#  $##$  #", "## .... ##", " # $## $# ", " #  ##$ # ", " #  @.  # ", " ######## "] },
    ],
  },
  {
    id: 3,
    name: "WORLD 03",
    subtitle: "THE FACTORY",
    levels: [
      { name: "Assembly", par: 32, map: ["##########", "#        #", "# $$$$   #", "# ...... #", "#   $$   #", "#   @    #", "##########"] },
      { name: "Conveyor", par: 49, map: ["###########", "#   #     #", "# $ # . . #", "#   #     #", "## ##  ####", "#    @    #", "#  $   $  #", "#  .      #", "###########"] },
      { name: "Gearbox", par: 11, map: ["#########", "#  ...  #", "#  $$$  #", "#       #", "# # @ # #", "#   $   #", "#   .   #", "#########"] },
    ],
  },
];

export type LevelRef = LevelDef & { index: number; worldId: number; worldName: string; worldSubtitle: string };

export const LEVELS: LevelRef[] = WORLDS.flatMap((w) =>
  w.levels.map((l) => ({ ...l, index: 0, worldId: w.id, worldName: w.name, worldSubtitle: w.subtitle })),
).map((l, i) => ({ ...l, index: i }));

export const TOTAL_LEVELS = LEVELS.length;
