import { expect, test } from '@playwright/test';

test('sustained drag avoids listener churn and update-depth errors', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.addInitScript(() => {
    const counts = {
      add: {} as Record<string, number>,
      remove: {} as Record<string, number>,
    };

    const increment = (bucket: Record<string, number>, key: string) => {
      bucket[key] = (bucket[key] ?? 0) + 1;
    };

    const originalAdd = window.addEventListener.bind(window);
    const originalRemove = window.removeEventListener.bind(window);

    window.addEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions | boolean,
    ) => {
      increment(counts.add, type);
      originalAdd(type, listener, options);
    }) as typeof window.addEventListener;

    window.removeEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: EventListenerOptions | boolean,
    ) => {
      increment(counts.remove, type);
      originalRemove(type, listener, options);
    }) as typeof window.removeEventListener;

    (window as Window & { __listenerProbe?: typeof counts }).__listenerProbe =
      counts;
  });

  await page.goto('/');
  await page.waitForSelector('[data-testid="element-3"]');
  await page.waitForTimeout(300);

  const moved = page.locator('[data-testid="element-3"] .element-body');
  const stationary = page.locator('[data-testid="element-2"] .element-body');

  const beforeProbe = await page.evaluate(() => {
    return (
      window as unknown as Window & {
        __listenerProbe: {
          add: Record<string, number>;
          remove: Record<string, number>;
        };
      }
    ).__listenerProbe;
  });

  const beforeMovedBox = await moved.boundingBox();
  const beforeStationaryBox = await stationary.boundingBox();
  expect(beforeMovedBox).not.toBeNull();
  expect(beforeStationaryBox).not.toBeNull();

  const startX = beforeMovedBox!.x + beforeMovedBox!.width / 2;
  const startY = beforeMovedBox!.y + beforeMovedBox!.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(startX + step * 18, startY + step * 10);
  }

  await page.mouse.up();
  await page.waitForTimeout(150);

  const afterProbe = await page.evaluate(() => {
    return (
      window as unknown as Window & {
        __listenerProbe: {
          add: Record<string, number>;
          remove: Record<string, number>;
        };
      }
    ).__listenerProbe;
  });

  const afterStationaryBox = await stationary.boundingBox();
  expect(afterStationaryBox).not.toBeNull();
  expect(afterStationaryBox!.x).toBeCloseTo(beforeStationaryBox!.x, 0);
  expect(afterStationaryBox!.y).toBeCloseTo(beforeStationaryBox!.y, 0);

  expect(
    (afterProbe.add.mousemove ?? 0) - (beforeProbe.add.mousemove ?? 0),
  ).toBeLessThanOrEqual(1);
  expect(
    (afterProbe.remove.mousemove ?? 0) - (beforeProbe.remove.mousemove ?? 0),
  ).toBeLessThanOrEqual(1);
  expect(
    (afterProbe.add.mouseup ?? 0) - (beforeProbe.add.mouseup ?? 0),
  ).toBeLessThanOrEqual(1);
  expect(
    (afterProbe.remove.mouseup ?? 0) - (beforeProbe.remove.mouseup ?? 0),
  ).toBeLessThanOrEqual(1);
  expect((afterProbe.add.paste ?? 0) - (beforeProbe.add.paste ?? 0)).toBe(0);
  expect((afterProbe.add.keydown ?? 0) - (beforeProbe.add.keydown ?? 0)).toBe(
    0,
  );

  const errorOutput = [...consoleErrors, ...pageErrors].join('\n');
  expect(errorOutput).not.toContain('Maximum update depth exceeded');
});
