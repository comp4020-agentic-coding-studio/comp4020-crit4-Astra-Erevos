import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// This week's published spec ("An instrument") turned into the lines that are
// mechanically checkable. The rest — is it expressive, does a stranger reach
// the first sound uninstructed, does a gesture feel good rather than just
// working, is there really no fail state — is for the crit pod to judge in
// person, not something a test can see. See the spec at
// https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/crits/04-instrument/

const DIST = resolve("dist");

function files(dir: string = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

const shipped = files();
const scriptText = shipped
  .filter((path) => path.endsWith(".js"))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

const indexPath = resolve("dist/index.html");
const doc = existsSync(indexPath)
  ? new JSDOM(readFileSync(indexPath, "utf8")).window.document
  : undefined;

describe("crit 4: an instrument", () => {
  it("makes sound live with the Web Audio API, not by playing back a file", () => {
    expect(
      doc?.querySelector("audio, video, source"),
      "an <audio>/<video>/<source> element plays a file back rather than synthesising live",
    ).toBeFalsy();
    expect(
      scriptText,
      "no shipped script constructs an AudioContext — nothing on the page can make sound yet",
    ).toMatch(/AudioContext/);
  });

  it("gives a stranger at least one real, focusable control to try", () => {
    // A native button (or an explicit role="button" with a tabindex) is
    // reachable by mouse, keyboard, and touch alike; a div with only a click
    // handler is mouse-only and invisible to a keyboard player.
    const control = doc?.querySelector(
      'main button, main [role="button"][tabindex], main input, main [tabindex]',
    );
    expect(
      control,
      "no focusable control in <main> — nothing for a stranger to find and press",
    ).toBeTruthy();
  });

  it("doesn't gate the first sound behind an instructions dialog", () => {
    expect(
      doc?.querySelector('dialog, [role="dialog"], [role="alertdialog"]'),
      "a dialog blocking the page means a stranger has to read before they can play",
    ).toBeFalsy();
  });
});
