export function track(name, title = name) {
  try {
    window.goatcounter?.count?.({ path: name, title, event: true });
  } catch {
    // Counting is never worth breaking the game over.
  }
}
