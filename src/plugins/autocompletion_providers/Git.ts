import Utils from "../../Utils";
import Job from "../../Job";
import * as _ from "lodash";
import * as e from "../../Enums";
import * as Path from "path";
import PluginManager from "../../PluginManager";
import {linedOutputOf} from "../../PTY";
import {Suggestion, Subcommand} from "./Suggestions";

class File extends Suggestion {
    constructor(protected _line: string) {
        super();
    }

    get value(): string {
        return this._line.substring(3).trim();
    }

    get type(): string {
        return "file";
    }

    get iconColor(): e.Color {
        return this.colorsMap[this.workingTreeStatusCode];
    }

    get isAbleToAdd(): boolean {
        return this.workingTreeStatusCode !== " ";
    }

    get workingTreeStatusCode(): string {
        return this._line[1];
    }

    private get colorsMap(): Dictionary<e.Color> {
        return {
            "?": e.Color.Green,
            "M": e.Color.Blue,
            "D": e.Color.Red,
        };
    };
}

class Branch extends Suggestion {
    constructor(protected _line: string) {
        super();
    }

    get value(): string {
        return this._line.trim();
    }

    get type(): string {
        return "branch";
    }

    get isCurrent(): boolean {
        return this._line[0] === "*";
    }
}

async function gitSuggestions(job: Job): Promise<Suggestion[]> {
    const prompt = job.prompt;

    const gitDirectoryPath = Path.join(job.directory, ".git");
    if (!(await Utils.exists(gitDirectoryPath))) {
        return [];
    }

    const subcommand = prompt.arguments[0];
    const args = _.drop(prompt.arguments, 1);

    if (subcommand === "add" && args.length > 0) {
        let changes = await linedOutputOf("git", ["status", "--porcelain"], job.directory);
        return changes.map(line => new File(line)).filter(file => file.isAbleToAdd);
    }

    if (subcommand === "checkout" && args.length === 1) {
        let output = await linedOutputOf("git", ["branch", "--no-color"], job.directory);
        return output.map(branch => new Branch(branch)).filter(branch => !branch.isCurrent);
    }

    return [];
}

["add", "checkout"].forEach(subcommand =>
    PluginManager.registerAutocompletionProvider({
        forCommand: `git ${subcommand}`,
        getSuggestions: gitSuggestions,
    })
);

const porcelainCommands = [
    new Subcommand("add", "Add file contents to the index."),
    new Subcommand("am", "Apply a series of patches from a mailbox."),
    new Subcommand("archive", "Create an archive of files from a named tree."),
    new Subcommand("bisect", "Find by binary search the change that introduced a bug."),
    new Subcommand("branch", "List, create, or delete branches."),
    new Subcommand("bundle", "Move objects and refs by archive."),
    new Subcommand("checkout", "Switch branches or restore working tree files."),
    new Subcommand("cherry-pick", "Apply the changes introduced by some existing commits."),
    new Subcommand("citool", "Graphical alternative to git-commit."),
    new Subcommand("clean", "Remove untracked files from the working tree."),
    new Subcommand("clone", "Clone a repository into a new directory."),
    new Subcommand("commit", "Record changes to the repository."),
    new Subcommand("describe", "Describe a commit using the most recent tag reachable from it."),
    new Subcommand("diff", "Show changes between commits, commit and working tree, etc."),
    new Subcommand("fetch", "Download objects and refs from another repository."),
    new Subcommand("format-patch", "Prepare patches for e-mail submission."),
    new Subcommand("gc", "Cleanup unnecessary files and optimize the local repository."),
    new Subcommand("grep", "Print lines matching a pattern."),
    new Subcommand("gui", "A portable graphical interface to Git."),
    new Subcommand("init", "Create an empty Git repository or reinitialize an existing one."),
    new Subcommand("log", "Show commit logs."),
    new Subcommand("merge", "Join two or more development histories together."),
    new Subcommand("mv", "Move or rename a file, a directory, or a symlink."),
    new Subcommand("notes", "Add or inspect object notes."),
    new Subcommand("pull", "Fetch from and integrate with another repository or a local branch."),
    new Subcommand("push", "Update remote refs along with associated objects."),
    new Subcommand("rebase", "Forward-port local commits to the updated upstream head."),
    new Subcommand("reset", "Reset current HEAD to the specified state."),
    new Subcommand("revert", "Revert some existing commits."),
    new Subcommand("rm", "Remove files from the working tree and from the index."),
    new Subcommand("shortlog", "Summarize git log output."),
    new Subcommand("show", "Show various types of objects."),
    new Subcommand("stash", "Stash the changes in a dirty working directory away."),
    new Subcommand("status", "Show the working tree status."),
    new Subcommand("submodule", "Initialize, update or inspect submodules."),
    new Subcommand("tag", "Create, list, delete or verify a tag object signed with GPG."),
    new Subcommand("worktree", "Manage multiple worktrees."),

];

PluginManager.registerAutocompletionProvider({
    forCommand: `git`,
    getSuggestions: async function(job: Job) {
        if (job.prompt.expanded.length !== 2) {
            return [];
        }

        return porcelainCommands;
    },
});