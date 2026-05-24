const HEADER_OFFSET = 72;
const DURATION_MS = 720;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** Scroll suave con easing — offset para navbar sticky */
export function scrollToSection(sectionId: string, offset = HEADER_OFFSET): void {
  const id = sectionId.replace(/^#/, "");
  const el = document.getElementById(id);
  if (!el) return;

  const target = el.getBoundingClientRect().top + window.scrollY - offset;
  const start = window.scrollY;
  const distance = target - start;

  if (Math.abs(distance) < 2) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, target);
    return;
  }

  let startTime: number | null = null;

  function step(timestamp: number) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / DURATION_MS, 1);
    window.scrollTo(0, start + distance * easeOutCubic(progress));
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

export function handleLandingNavClick(
  e: MouseEvent,
  href: string,
  options?: { onBeforeScroll?: () => void; delayMs?: number },
) {
  if (!href.startsWith("#") || href.length < 2) return;

  e.preventDefault();
  const sectionId = href.slice(1);

  options?.onBeforeScroll?.();

  const run = () => scrollToSection(sectionId);

  if (options?.delayMs && options.delayMs > 0) {
    window.setTimeout(run, options.delayMs);
  } else {
    run();
  }
}
