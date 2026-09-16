import confetti from 'canvas-confetti';

export function triggerConfetti(): void {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#2563eb', '#f97316', '#10b981', '#fbbf24', '#8b5cf6'],
    });
  } catch (e) {
    console.warn('Confetti error', e);
  }
}

export function triggerBigWinConfetti(): void {
  try {
    const end = Date.now() + 1500;
    const colors = ['#2563eb', '#f97316', '#10b981', '#fbbf24'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch (e) {
    console.warn('Big win confetti error', e);
  }
}
