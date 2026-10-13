import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { GitStatus } from "../shared/projects";

const execFileAsync = promisify(execFile);

async function runGit(directory: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", ["--no-optional-locks", "-C", directory, ...args], {
    encoding: "utf8",
    windowsHide: true,
    timeout: 5000,
    maxBuffer: 4 * 1024 * 1024
  });

  return stdout.trim();
}

async function getLastCommitDate(directory: string): Promise<string | null> {
  try {
    const date = await runGit(directory, ["log", "-1", "--format=%cI"]);
    return date || null;
  } catch (error) {
    console.error("Could not read last commit:", directory, error);
    return null;
  }
}

export async function getGitStatus(directory: string): Promise<GitStatus> {
  try {
    const [status, lastCommitDate] = await Promise.all([
      runGit(directory, [
        "status",
        "--porcelain=v2",
        "--branch",
        "-z",
        "--untracked-files=all",
        "--ignore-submodules=none"
      ]),
      getLastCommitDate(directory)
    ]);

    return { available: true, ...parseGitStatus(status), lastCommitDate };
  } catch (error) {
    console.error("Could not read Git status:", directory, error);

    const code = (error as NodeJS.ErrnoException).code;

    return {
      available: false,
      message:
        code === "ENOENT"
          ? "Git was not found. Install Git and restart Repo Radar."
          : "Could not read Git status. Check the terminal for details."
    };
  }
}

// NUL delimiters keep filenames containing newlines from corrupting the count.
export function parseGitStatus(status: string): {
  branch: string;
  isDirty: boolean;
  changedFiles: number;
  upstream: string | null;
  ahead: number | null;
  behind: number | null;
} {
  const records = status.split("\0");
  let branch = "Detached HEAD";
  let upstream: string | null = null;
  let ahead: number | null = null;
  let behind: number | null = null;
  let changedFiles = 0;

  for (let index = 0; index < records.length; index++) {
    const record = records[index];
    if (record.startsWith("# branch.head ")) {
      const head = record.slice("# branch.head ".length);
      branch = head === "(detached)" ? "Detached HEAD" : head;
    } else if (record.startsWith("# branch.upstream ")) {
      upstream = record.slice("# branch.upstream ".length);
    } else if (record.startsWith("# branch.ab ")) {
      const match = /^# branch.ab \+(\d+) -(\d+)$/.exec(record);
      if (match) {
        ahead = Number(match[1]);
        behind = Number(match[2]);
      }
    } else if (/^[12u?] /.test(record)) {
      changedFiles++;
      // Rename records include a second NUL-delimited original pathname.
      if (record.startsWith("2 ")) index++;
    }
  }

  return { branch, isDirty: changedFiles > 0, changedFiles, upstream, ahead, behind };
}
