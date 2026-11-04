// Settings: the theme (system, light, dark) and how often cutaways play (all, kaiju, off).
// Remembered in this browser when storage allows; a private window still plays, it just forgets.

export const THEMES = ["system", "light", "dark"];
export const CUTAWAYS = ["all", "kaiju", "off"];
export const CUTAWAY_NAMES = { all: "All attacks", kaiju: "Kaiju against kaiju only", off: "Off" };

function read(key, allowed, fallback) {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch (e) {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    /* no storage: the choice lasts the page */
  }
}

export const settings = {
  theme: read("kaiju-theme", THEMES, "system"),
  cutaway: read("kaiju-cutaway", CUTAWAYS, "all"),
};

const listeners = new Set();
export function onChange(fn) {
  listeners.add(fn);
}

function changed() {
  for (const fn of listeners) fn(settings);
}

export function applyTheme() {
  const root = document.documentElement;
  if (settings.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", settings.theme);
}

export function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  settings.theme = theme;
  write("kaiju-theme", theme);
  applyTheme();
  changed();
}

export function cycleTheme() {
  setTheme(THEMES[(THEMES.indexOf(settings.theme) + 1) % THEMES.length]);
}

export function setCutaway(mode) {
  if (!CUTAWAYS.includes(mode)) return;
  settings.cutaway = mode;
  write("kaiju-cutaway", mode);
  changed();
}

export function darkNow() {
  if (settings.theme !== "system") return settings.theme === "dark";
  return matchMedia("(prefers-color-scheme: dark)").matches;
}

export function reducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}
