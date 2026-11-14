// Count game events on GoatCounter (petripals.goatcounter.com), alongside
// the page visits its script counts on its own (the same site as PetriPals:
// Unicorn Dash's pages and events all start with unicorn-dash/, to tell them
// apart). Each event shows up on the dashboard like a page, e.g.
// "unicorn-dash/level-complete/candy". No cookies and nothing personal is
// sent, and nothing is saved on the device. If the script didn't load (an ad blocker, or
// playing offline), this quietly does nothing; GoatCounter also skips
// localhost, so playing locally isn't counted.
export function track(name, title = name) {
  try {
    window.goatcounter?.count?.({ path: name, title, event: true });
  } catch {
    // Counting is never worth breaking the game over.
  }
}
