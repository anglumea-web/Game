// =============================================================
//  LEVELS — tambah level baru cukup di file ini.
//  '#' dinding  ' ' lantai  '.' goal  '$' kotak  '*' kotak di goal
//  '@' pemain   '+' pemain di goal    par = jumlah langkah optimal
// =============================================================
var WORLDS = [
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
      { name: "Classic", par: 24, map: ["  #####  ", "  #   #  ", "  # $ #  ", "### $##  ", "#  $ .#  ", "# . .##  ", "##@###   "] }
    ]
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
      { name: "Master", par: 54, map: ["     #####", "######   #", "#    #   #", "#  $##$  #", "## .... ##", " # $## $# ", " #  ##$ # ", " #  @.  # ", " ######## "] }
    ]
  },
  {
    id: 3,
    name: "WORLD 03",
    subtitle: "THE FACTORY",
    levels: [
      { name: "Assembly", par: 32, map: ["##########", "#        #", "# $$$$   #", "# ...... #", "#   $$   #", "#   @    #", "##########"] },
      { name: "Conveyor", par: 49, map: ["###########", "#   #     #", "# $ # . . #", "#   #     #", "## ##  ####", "#    @    #", "#  $   $  #", "#  .      #", "###########"] },
      { name: "Gearbox", par: 11, map: ["#########", "#  ...  #", "#  $$$  #", "#       #", "# # @ # #", "#   $   #", "#   .   #", "#########"] }
    ]
  }
];

var LEVELS = [];
for (var w = 0; w < WORLDS.length; w++) {
  for (var i = 0; i < WORLDS[w].levels.length; i++) {
    var l = WORLDS[w].levels[i];
    LEVELS.push({
      name: l.name,
      par: l.par,
      map: l.map,
      index: LEVELS.length,
      worldId: WORLDS[w].id,
      worldName: WORLDS[w].name,
      worldSubtitle: WORLDS[w].subtitle
    });
  }
}
var TOTAL_LEVELS = LEVELS.length;
