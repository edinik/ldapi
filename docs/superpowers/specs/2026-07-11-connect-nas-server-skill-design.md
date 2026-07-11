# Connect NAS Server Skill Design

## Context

The user manages a standard Linux NAS reachable over the local network at `192.168.3.23`. SSH uses port `22`, user `edinik`, and the existing private key at `C:\Users\imzmj\.ssh\nas_server`.

The desired outcome is a reusable personal Codex skill that can connect to the NAS across sessions and perform routine administration. The skill must not copy, embed, print, or otherwise expose the private key.

## Goals

- Add the SSH alias `nas-server` to the user's SSH configuration.
- Create a personal Codex skill named `connect-nas-server`.
- Support read-only inspection, file transfer, configuration editing, service management, and container management.
- Make routine operations convenient while requiring explicit approval for destructive or availability-affecting actions.
- Verify the SSH host identity before trusting the first connection.
- Keep authentication secrets outside the skill.

## Non-Goals

- Do not store a `sudo` password or private-key passphrase.
- Do not enable passwordless `sudo` or modify NAS authorization policy automatically.
- Do not expose the NAS to the public internet or change router settings.
- Do not install management software on the NAS merely to support the skill.
- Do not assume Docker, Podman, systemd, or a particular package manager exists before detection.

## SSH Configuration

Add or update one managed host block in `C:\Users\imzmj\.ssh\config`:

```sshconfig
Host nas-server
    HostName 192.168.3.23
    User edinik
    Port 22
    IdentityFile C:/Users/imzmj/.ssh/nas_server
    IdentitiesOnly yes
```

Use a forward-slash path for `IdentityFile` because OpenSSH accepts it consistently on Windows. Preserve all unrelated SSH configuration exactly. If a `Host nas-server` block already exists, inspect it and update only after identifying conflicts.

Before accepting a new host key, obtain the NAS fingerprint through a trusted user-visible channel and compare it with the fingerprint presented locally. Do not use `StrictHostKeyChecking=no`.

## Skill Location And Triggering

Install the personal skill as `connect-nas-server` under the active Codex home skills directory. Its description should trigger when the user asks to connect to the NAS, use the `nas-server` SSH alias, inspect the NAS, transfer files, or perform routine Linux administration on that host.

The skill references `ssh nas-server` rather than repeating connection parameters. File transfers use `scp` or `sftp` with the same SSH alias.

## Operating Workflow

For each task, the skill follows this sequence:

1. Restate the requested target and classify the operation as inspection, routine mutation, or high risk.
2. Prefer a read-only preflight that establishes current state, relevant paths, permissions, service names, and available tooling.
3. For routine mutations, explain the intended change, preserve unrelated state, and create a timestamped backup when editing important configuration files.
4. Execute the smallest scoped command that achieves the request.
5. Verify the resulting state with an independent read-only command.
6. Report what changed, verification evidence, backup location if any, and known limitations.

Commands should be non-interactive where practical. If `sudo` requires a password, do not embed or persist it; explain that the user must provide it through a secure interactive mechanism.

## Permission Model

### Allowed As Routine Management

- Inspect system, filesystem, storage, network, processes, logs, services, and containers.
- Upload or download files at user-specified locations.
- Create directories and files within clearly scoped paths.
- Edit application and service configuration after reading the current file and making a backup when appropriate.
- Start, stop, or restart an explicitly named application service or container when the user's request clearly authorizes that service-level action.
- Run package-manager inspection commands and install or update explicitly requested packages after showing the planned package action.

### Require Explicit Confirmation Immediately Before Execution

- Recursive deletion, bulk moves, overwriting important data, or commands with broad path expansion.
- Host reboot, shutdown, suspend, or operations likely to disconnect the NAS.
- Disk partitioning, filesystem creation, RAID/LVM changes, mount-table changes, or destructive storage repair.
- Firewall, routing, DNS, SSH daemon, SSH keys, users, groups, `sudoers`, or authentication changes.
- System-wide package upgrades or removal of packages with dependencies.
- Pruning containers, images, volumes, snapshots, backups, or other recoverability data.
- Any command whose resolved scope cannot be verified safely in advance.

Approval for one high-risk command does not imply approval for later high-risk commands.

## Error Handling And Safety

- Connection failure: distinguish name/config errors, network timeout, host-key mismatch, authentication failure, and remote permission failure.
- Host-key mismatch: stop and report both the expected and received context; never replace the known-host entry automatically.
- Missing tools: detect capabilities and propose a compatible command rather than assuming a Linux distribution.
- Partial mutation: stop further mutations, inspect current state, and use the backup or service status to propose recovery.
- Ambiguous paths or service names: inspect first; do not guess when a wrong target could cause damage.
- Sensitive output: avoid printing private keys, tokens, passwords, full environment dumps, or unrelated configuration secrets.

## Validation

Validation occurs in increasing-risk order:

1. Validate the skill directory structure and YAML frontmatter with the skill-creator validation tool.
2. Expand the SSH configuration with `ssh -G nas-server` and confirm hostname, user, port, identity file, and `IdentitiesOnly` values.
3. Confirm the configured private-key file exists without reading or displaying its contents.
4. Obtain and compare the NAS host-key fingerprint before the first trusted connection.
5. Run a non-interactive read-only connection test such as `hostname`, `id`, and `uname -a` with a bounded connection timeout.
6. Test representative skill scenarios: system inspection, safe file transfer planning, routine service management planning, and rejection or confirmation-gating of destructive operations.

Actual mutation of NAS state is not required to validate the skill. A read-only SSH connection plus scenario testing establishes the initial deployment.

## Rollback

- Remove only the managed `Host nas-server` block from the SSH config, leaving unrelated entries untouched.
- Remove the `connect-nas-server` personal skill directory.
- Do not delete the existing private key or known-host records automatically.

## Constraints And Limits

- The NAS must be reachable from the machine running Codex; `192.168.3.23` is a private LAN address.
- The private key may require a passphrase or an SSH agent, which cannot be inferred in advance.
- Routine management is limited by the privileges of user `edinik` and any configured `sudo` policy.
- Service and container commands depend on software detected on the NAS.
- Host fingerprint verification requires trusted information from the user or direct NAS console; network discovery alone is not sufficient proof of identity.
