import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Assemble the three tab recordings using the actual rehearsal checkpoints.
// Only preflight and inactive-tab footage are omitted; playback is never sped up.
const output = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  "artifacts",
  "judge-rehearsal",
);
const timing = JSON.parse(readFileSync(join(output, "timing.json"), "utf8"));
assert.ok(timing.elapsedSeconds < 180);
assert.deepEqual(timing.errors, []);
assert.deepEqual(timing.reloads, []);
const checkpoint = (name) => {
  const point = timing.checkpoints.find((p) => p.stage === name);
  assert.ok(point, `Missing checkpoint ${name}`);
  return point.seconds;
};
const cuts = [
  0,
  checkpoint("lab-qualified-metrics"),
  checkpoint("connection-checks"),
  checkpoint("closing-judgment"),
  timing.elapsedSeconds,
];
const names = ["bench", "lab", "connections", "bench"];
const args = ["-y", "-hide_banner", "-loglevel", "error"];
const filters = [];
for (const [i, name] of names.entries()) {
  const video = timing.videos.find((v) => v.name === name);
  assert.ok(video);
  args.push(
    "-ss",
    String(video.preRollSeconds + cuts[i]),
    "-t",
    String(cuts[i + 1] - cuts[i]),
    "-i",
    video.path,
  );
  filters.push(`[${i}:v]setpts=PTS-STARTPTS,fps=25,setsar=1[v${i}]`);
}
filters.push("[v0][v1][v2][v3]concat=n=4:v=1:a=0[out]");
const videoPath = join(output, "judge-rehearsal.mp4");
args.push(
  "-filter_complex_threads",
  "2",
  "-filter_complex",
  filters.join(";"),
  "-map",
  "[out]",
  "-an",
  "-c:v",
  "libx264",
  "-threads",
  "2",
  "-preset",
  "fast",
  "-crf",
  "22",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  videoPath,
);
execFileSync("ffmpeg", args, { stdio: "inherit" });
const probe = JSON.parse(
  execFileSync(
    "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=width,height",
      "-of",
      "json",
      videoPath,
    ],
    { encoding: "utf8" },
  ),
);
const duration = Number(probe.format.duration);
assert.ok(
  duration < 180 && Math.abs(duration - timing.elapsedSeconds) < 1,
  "Assembled duration must match wall-clock rehearsal.",
);
// Analysis goes to stderr; a negative result does not diagnose Windows.
const analysis = spawnSync(
  "ffmpeg",
  [
    "-hide_banner",
    "-nostats",
    "-i",
    videoPath,
    "-vf",
    "blackdetect=d=0.08:pix_th=0.04:pic_th=0.99",
    "-an",
    "-f",
    "null",
    "-",
  ],
  { encoding: "utf8" },
);
assert.equal(analysis.status, 0);
const intervals = (analysis.stderr ?? "")
  .split("\n")
  .filter((line) => line.includes("black_start:"));
writeFileSync(
  join(output, "video-check.json"),
  `${JSON.stringify(
    {
      boundary:
        "Silent browser rehearsal assembled at tab switches. No original Windows video was edited. Negative blackdetect does not clear that flash.",
      duration,
      cuts,
      videoPath,
      blackFrameFilter: "blackdetect=d=0.08:pix_th=0.04:pic_th=0.99",
      intervals,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `Video duration ${duration.toFixed(3)}s; sustained-black intervals: ${intervals.length}. ${videoPath}`,
);
