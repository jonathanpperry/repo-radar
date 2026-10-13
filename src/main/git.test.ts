import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getGitStatus, parseGitStatus } from "./git";

describe("Git status", () => {
  it("reads divergence and counts renames, conflicts, and newline filenames once", () => {
    const status = [
      "# branch.head main",
      "# branch.upstream origin/main",
      "# branch.ab +2 -3",
      "1 M. metadata file",
      "2 R. metadata renamed",
      "? original-name",
      "u UU metadata conflict",
      "? new\nfile"
    ].join("\0");
    expect(parseGitStatus(status)).toEqual({
      branch: "main",
      isDirty: true,
      changedFiles: 4,
      upstream: "origin/main",
      ahead: 2,
      behind: 3
    });
  });

  it("handles detached HEAD without inventing an upstream comparison", () => {
    expect(parseGitStatus("# branch.head (detached)\0")).toEqual({
      branch: "Detached HEAD",
      isDirty: false,
      changedFiles: 0,
      upstream: null,
      ahead: null,
      behind: null
    });
  });

  it("reads an actual unborn repository and untracked files", async () => {
    const directory = await mkdtemp(join(tmpdir(), "radar-git-"));
    try {
      execFileSync("git", ["init", "--initial-branch=main", directory]);
      await writeFile(join(directory, "new.txt"), "hello");
      expect(await getGitStatus(directory)).toEqual({
        available: true,
        branch: "main",
        isDirty: true,
        changedFiles: 1,
        upstream: null,
        ahead: null,
        behind: null,
        lastCommitDate: null
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
