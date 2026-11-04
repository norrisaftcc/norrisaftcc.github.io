# Kaiju Dashboard: changes

The version is in `src/version.js`. It shows on the setup page as the edition and at the foot of every copied review, so a playtest names the build it was played on. A PR that changes what a player sees or how the game plays bumps it and adds a line here. `tests/version.test.mjs` checks the two agree.

- **0.1.x** for the spike and fixes, **0.2.x** after Hex and the City, and so on: the middle number moves with each feature PR, the last with each fix.

## 0.3.0: variants, other looks for the same rules (#20)

- Four looks over the four monsters: Meow'thprrtep (the first, cat-headed Squamous drawing), Mekkasaurus Prime (Radiosaur in steel, on a battery), the Alien Colossus and Gekido-Oh (with a preset build).
- Setup shows a row of looks under the cards. The board, cutaway, log, paper and review use the look.
- The copied review's setup line names the look as the bot does: `squamous:meowthprrtep`.
- The bot takes `kaiju:variant`.

## 0.2.0: the 1981 mode and the review (#17, merged 10/21)

- The fourth mission, **Hex and the City** (id `rampage`; first called Rampage): no goal and no clock, waves that grow, five objectives, the Three Deaths.
- The working title, **Kaiju Dashboard**, on the tab and the masthead (#23).
- Every game ends with a review from *Cassette & Disk Monthly*, with **Copy as text**.
- The version on the setup page and at the foot of the copied review (#26, so later playtests name their build).
- The copied review's setup line says whether the Coast's rival was chosen (`coast:squamous`) or left to chance, since the two are different games. The bot takes `coast:<rival>` too, and `tools/damage.mjs` shows one game's damage by turn (#26).
- The review counts only units as kills; a building walked through or eaten is not one (#26, from playtest 002).

## 0.1.0: the spike (#8 to #12, merged 10/21)

- Four kaiju, three missions, the hex map, the army, the cutaway and the newspaper.
