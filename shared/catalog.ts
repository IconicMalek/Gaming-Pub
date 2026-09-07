export const CATALOG_GAME_TITLES = [
  "Half-Life 2", "Prototype", "Prototype 2", "Stranglehold", "Assassin's Creed", "Assassin's Creed II", "Assassin's Creed Brotherhood", "Assassin's Creed Revelations", "Assassin's Creed III", "Tomb Raider (2013)", "Far Cry 2", "Far Cry 3", "Prince of Persia: The Forgotten Sands", "Just Cause 2", "Hitman: Absolution", "DmC: Devil May Cry", "Kane & Lynch 2: Dog Days", "Sleeping Dogs", "Blur", "Need for Speed: Most Wanted", "Need for Speed: Hot Pursuit", "Deadpool", "Batman: Arkham Asylum", "Dark Souls III", "The Witcher 3: Wild Hunt", "BioShock Infinite", "Battlefield 6", "Red Dead Redemption", "Red Dead Redemption 2", "Grand Theft Auto V Legacy", "Resident Evil 4 Remake", "Resident Evil 7", "Resident Evil Village", "EA Sports FC 26", "Assassin's Creed Shadows", "PES 2026", "Marvel's Spider-Man Remastered", "Marvel's Spider-Man: Miles Morales", "Marvel's Spider-Man 2", "Marvel Rivals", "Uncharted 4: A Thief's End", "God of War", "God of War Ragnarök", "Need for Speed Unbound", "Need for Speed Heat", "Mortal Kombat 11", "007 First Light", "Pragmata", "Mafia: Definitive Edition", "Mafia II: Definitive Edition", "Mad Max", "Watch Dogs", "Watch Dogs 2", "Watch Dogs: Legion", "Metal Gear Solid V: The Phantom Pain", "Tom Clancy's Ghost Recon Wildlands", "Tom Clancy's Ghost Recon Breakpoint", "Days Gone", "Horizon Zero Dawn Complete Edition", "Horizon Forbidden West", "Cyberpunk 2077", "Dying Light", "Dying Light 2 Stay Human", "Titanfall 2", "DOOM", "DOOM Eternal", "Metro 2033 Redux", "Metro: Last Light Redux", "Metro Exodus", "Crysis Remastered", "Crysis 2 Remastered", "Crysis 3 Remastered", "Sniper Elite 4", "Sniper Elite 5", "Wolfenstein: The New Order", "Wolfenstein II: The New Colossus", "Forza Horizon 4", "Forza Horizon 5", "Need for Speed Payback", "The Crew 2", "DiRT Rally 2.0", "Wreckfest", "Resident Evil 2 Remake", "Resident Evil 3 Remake", "Alien: Isolation", "The Evil Within", "The Evil Within 2", "Outlast", "Outlast 2", "Elden Ring", "Sekiro: Shadows Die Twice", "Dragon's Dogma 2", "Hogwarts Legacy", "Fallout 4", "The Elder Scrolls V: Skyrim Special Edition", "It Takes Two", "A Way Out", "Left 4 Dead 2", "Lethal Company", "Phasmophobia", "Max Payne 3", "Tom Clancy's Splinter Cell: Blacklist", "Spec Ops: The Line", "Mirror's Edge", "Bully: Scholarship Edition",
] as const;

export const CATEGORY_LABELS = {
  GAME: "Games",
  MOVIE: "Movies",
  TV_SHOW: "Series",
  HARDWARE: "Hardware",
  OTHER: "Other",
} as const;

export const ORDER_STATUS_LABELS = {
  PENDING_ACCEPTANCE: "Pending acceptance",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready for handoff",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
} as const;

export const REQUEST_STATUS_LABELS = {
  PENDING: "Pending",
  REVIEWING: "Reviewing",
  AVAILABLE: "Available",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function formatMoney(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "Price not configured";
  return `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`;
}
