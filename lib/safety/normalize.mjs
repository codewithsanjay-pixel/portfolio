// One text normalizer for the runtime chat guard and the eval grader, so evals
// measure exactly what production enforces.
// Lowercase; strip accents and invisible characters; turn every run of
// non-letters/digits into one space. "Réservation​-Crew_Scheduling"
// becomes "reservation crew scheduling".

/** @param {string} text */
export function normalize(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[​-‏⁠﻿­]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
