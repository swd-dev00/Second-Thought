# Windows pressure patch transfer

This folder supplies a direct-download alternative for the pressure matching patch. It does not change the application on this branch. The package is intended for the user's authoritative `D:\AI\Second-Thought` checkout, base HEAD `816f6659dc343f050cf6ab1f038e0c1d811d2910`.

The installer checks uploaded-source hashes, backs up replaced scripts, runs 25 offline tests, and can launch the requested six-case live matrix with `-RunMatrix`. No original receipt, key, frozen case suite, or original research protocol is included in the package. Those files remain untouched on Windows. The PowerShell installer was not executed in cloud; the JavaScript payload and simulated source installation passed their checks.

Archive SHA-256: `d8ced787f0da82ceb3492e8ea1699d443c4863a60f4f26f0082c040cd0a6613a`.

Do not merge or pull this branch into the authoritative checkout to apply it. Download the archive from an immutable commit, verify its digest, extract into a separate temporary folder, and invoke its installer. The installer does not pull, switch branches, stage, or commit.
