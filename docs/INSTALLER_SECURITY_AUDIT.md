# RoninPLEX Desktop Packaging, Antivirus, and Windows SmartScreen Security Audit

**Document Version:** 1.0.0  
**Target Release:** RoninPLEX v2.1.1  
**Author:** Antigravity Engineering (Phase 3 Security Pass)  
**Date:** September 2026  
**Status:** Completed & Verified  

---

## 1. Executive Summary & Objective

The objective of this security audit is to rigorously evaluate the desktop packaging pipeline, executable binaries, digital signature status, and installer architecture of RoninPLEX. Specifically, this audit investigates the root causes of Windows Defender SmartScreen ("Windows protected your PC / Unknown Publisher") warnings and antivirus heuristic alerts, providing an evidence-grounded assessment that strictly distinguishes between **observed facts**, **empirical evidence**, **likely causes**, **hypotheses**, and **confidence levels**.

This audit does **not** bypass Windows security, disable protection mechanisms, or commit secret keys to version control. Instead, it provides concrete remediation strategies and release engineering standards to establish verified binary trust.

---

## 2. Terminology & Evidentiary Framework

To prevent premature conclusions or conflating distinct security mechanisms, all findings in this document adhere to the following definitions:

- **Observed Fact**: Directly verifiable, empirical data observed within the RoninPLEX repository, configuration files, and compiled build outputs.
- **Evidence**: Specific code lines, configuration keys, file hashes, tool outputs, or vendor documentation supporting an observation.
- **Likely Cause**: Technical inference supported by strong empirical data and alignment with standard operating system security models.
- **Hypothesis**: Plausible technical explanation that aligns with observed behavior but requires external vendor telemetry (e.g., specific antivirus laboratory analysis) for definitive proof.
- **Confidence Level**: Explicit rating (**High**, **Medium**, or **Low**) reflecting the certainty of each finding.

---

## 3. Packaging Pipeline & Binary Inventory

### 3.1 Binary Components

| Binary Name | Build Toolchain | Role | Execution Scope |
| :--- | :--- | :--- | :--- |
| `roninplex.exe` | Tauri v2 (`cargo build`) | Main application window, Webview2 host, Rust IPC, native download engine | User GUI & OS desktop interface |
| `anime-server-x86_64-pc-windows-msvc.exe` | `@vercel/ncc` + `pkg` (`node18-win-x64`) | Local sidecar microservice providing `anime-sdk` stream resolution | Background child process, bound strictly to `127.0.0.1:4173` |
| `RoninPLEX_2.1.1_x64-setup.exe` / `.msi` | NSIS / WiX Toolset | Windows distribution bundle and installer | Installation and desktop shortcut creation |

### 3.2 Packaging Configuration Inspection

- **Observed Fact**: The sidecar packaging script (`scripts/build-sidecar.cjs`) compiles `backend/server.js` using `@vercel/ncc` into `backend/dist/index.js`, and subsequently invokes `npx pkg` targeting `node18-win-x64` to output `src-tauri/bin/anime-server-x86_64-pc-windows-msvc.exe`.
- **Evidence**: `scripts/build-sidecar.cjs:38-43`:
  ```javascript
  console.log('2. Packaging with pkg...');
  const outBinary = path.resolve(__dirname, '../src-tauri/bin/anime-server-x86_64-pc-windows-msvc');
  const pkgConfig = path.join(distDir, 'package.json');
  execSync(`npx pkg "${pkgConfig}" -t node18-win-x64 -o "${outBinary}"`, {
    stdio: 'inherit'
  });
  ```
- **Observed Fact**: `src-tauri/tauri.conf.json` enables bundling for Windows (`targets: "all"`), but defines **no** Authenticode certificate thumbprint, signing tool, or timestamp server.
- **Evidence**: `src-tauri/tauri.conf.json` lines 33–55 contain no `certificateThumbprint`, `digestAlgorithm`, or `timestampUrl` configuration.

---

## 4. Digital Signatures & Authenticode Analysis

### 4.1 Authenticode Signature Verification

- **Observed Fact**: Neither `roninplex.exe`, `anime-server-x86_64-pc-windows-msvc.exe`, nor generated installer binaries possess an embedded Authenticode digital signature.
- **Evidence**: Verification via PowerShell (`Get-AuthenticodeSignature`) returns `Status: NotSigned` on all generated binary artifacts.
- **Observed Fact**: Windows SmartScreen displays "Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting. Running this app might put your PC at risk." with `Publisher: Unknown`.

### 4.2 Causality Analysis for SmartScreen Warnings

- **Category**: **Likely Cause** (Distinguished from Heuristic Antivirus Flags).
- **Explanation**: Windows Defender SmartScreen is an application reputation service operated by Microsoft. By design, any executable binary that lacks a trusted Authenticode code signing certificate and has not yet accumulated sufficient download and execution telemetry across the Windows ecosystem is classified as having "unknown reputation."
- **Confidence Level**: **High**.
- **Conclusion**: The SmartScreen prompt is an expected, deterministic outcome of distributing an unsigned PE binary on Windows. It is **not** an indication of malicious behavior or virus infection.

---

## 5. Antivirus Heuristic Analysis (`pkg` & Single-Binary Packers)

### 5.1 The Role of `pkg` in Heuristic Flags

- **Observed Fact**: `pkg` bundles a complete Node.js runtime executable, pre-compiled V8 bytecode, and a virtual filesystem containing JavaScript scripts into a single self-extracting Portable Executable (PE).
- **Evidence**: `pkg` architecture documentation and binary hex analysis show a standard Node.js base binary followed by a payload section containing virtual filesystem offsets and encrypted/compressed JS resources.
- **Hypothesis / Telemetry Correlation**:
  - Many commercial and cloud-assisted antivirus engines (e.g., Windows Defender ML, CrowdStrike Falcon, SentinelOne, Avast) use heuristic machine learning models trained on structural attributes of PE files.
  - Because malware authors frequently utilize runtime packers (such as `pkg`, `PyInstaller`, `AutoIt`, and `Enigma`) to evade signature-based detection of malicious scripts, machine learning classifiers frequently assign high entropy or packer-stub signatures a generic heuristic threat classification (e.g., `Trojan:Win32/Wacatac.B!ml`, `Heur.Suspicious`, or `Program:Win32/UnwantedApp`).
- **Confidence Level**: **Medium-High**.
- **Critical Distinction**: 
  - `pkg` is an open-source packaging tool and is not malicious.
  - The presence of `pkg` does **not** directly trigger the SmartScreen "Unknown Publisher" warning (which is governed solely by Authenticode signature presence and Microsoft cloud reputation telemetry).
  - However, `pkg` is hypothesized as a potential catalyst for false-positive detections among automated heuristic antivirus scanners due to structural similarity to packed droppers. This correlation is a hypothesis that cannot be asserted as causality without vendor-specific laboratory telemetry.

---

## 6. Binary & Process Security Assessment

An exhaustive security audit was conducted on the internal operations of the packaged components:

| Security Vector | Audit Finding | Risk Assessment |
| :--- | :--- | :--- |
| **Network Exposure** | `backend/server.js` binds exclusively to `127.0.0.1:4173`. No external interfaces (`0.0.0.0`) or remote ports are opened. | **Safe** (Local loopback only) |
| **Inter-Process Communication** | Sidecar is launched as a child process of Tauri with stdio pipes. No unauthorized IPC channels or named pipes exist. | **Safe** (Contained lifecycle) |
| **SSRF Defense** | Both frontend `DownloadResolver.ts` and native Rust worker `src-tauri/src/download.rs` independently enforce strict IP and protocol filtering. RFC1918, loopback, link-local, ULA, and non-HTTP schemes are rejected, with redirects intercepted and re-validated. | **Safe** (Enforced at both UI and native layers) |
| **Executable Renaming Defense** | Any HTTP response containing `text/html`, Cloudflare challenges, or CAPTCHAs is rejected from direct download and never masqueraded as `.mp4`. | **Safe** (Enforced) |
| **Credential Storage** | TMDB API keys are scrubbed from telemetry strings, never logged to stdout, and kept on the local host. | **Safe** (Neutralized) |

---

## 7. Evidence-Based Conclusions

| Finding | Classification | Evidence / Basis | Confidence Level |
| :--- | :--- | :--- | :--- |
| SmartScreen "Unknown Publisher" prompt | **Likely Cause** | Absence of Authenticode code signing certificate and lack of accumulated Microsoft cloud reputation. | **High** |
| Occasional heuristic AV false-positives | **Hypothesis** | High structural entropy and executable stub extraction pattern typical of `pkg` single-binary node runtime packaging. | **Medium-High** |
| Malicious payload analysis | **Observed Fact (Negative)** | Source code inspection, dependency tree auditing, and network socket analysis identified no malicious behavior during the performed inspection. | **High** |
| Process & network boundaries | **Observed Fact** | Sidecar binds strictly to loopback (`127.0.0.1`); Tauri commands enforce typed IPC; SSRF protections block private IP redirection. | **High** |

---

## 8. Remediation & Release Engineering Roadmap

To completely eliminate SmartScreen warnings and heuristic false positives in production releases, the following steps must be taken:

### 8.1 Phase A: Authenticode Code Signing (Mandatory for Production)
1. **Acquire an Authenticode Certificate**:
   - Obtain an Extended Validation (EV) or Standard Organization Validation (OV) Code Signing Certificate from a Microsoft-trusted Certificate Authority (DigiCert, Sectigo, GlobalSign).
   - *Note:* EV certificates provide immediate Microsoft SmartScreen reputation upon initial release. Standard OV certificates build reputation progressively with download volume.
2. **Configure Tauri Signer**:
   - In `tauri.conf.json`, configure the Windows bundle signing hook or use `signtool.exe` in the GitHub Actions release workflow:
     ```bash
     signtool sign /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 /sha1 <THUMBPRINT> target/release/bundle/nsis/*.exe
     ```
   - **Crucial:** Sign both the child executable (`anime-server-*.exe`) and the host executable (`roninplex.exe`) before generating the final installer package.

### 8.2 Phase B: Mitigating `pkg` Heuristic Sensitivities
If heuristic false positives persist even with signed binaries, evaluate the following architectural improvements for the sidecar:
1. **Distribute Node.js Runtime Natively**:
   - Instead of packaging via `pkg`, bundle the official, signed `node.exe` binary alongside `backend/dist/index.js` in the Tauri application resources directory.
   - Run via Tauri sidecar: `node.exe dist/index.js`.
   - *Benefit:* The official Node.js executable already possesses a clean global reputation and standard digital signature, eliminating single-binary packer heuristic flags entirely.
2. **Native Rust Sidecar Replacement (Long-Term)**:
   - Port the `anime-sdk` stream scraping logic directly into the native Rust backend (`src-tauri/src/anime.rs`).
   - *Benefit:* Completely removes Node.js and external sidecars, resulting in a single, unified, high-performance binary.

### 8.3 Phase C: Microsoft Security Intelligence Whitelisting
For open-source releases prior to acquiring an EV certificate:
1. Submit release binaries to the official [Microsoft Security Intelligence Submission Portal](https://www.microsoft.com/en-us/wdsi/filesubmission).
2. Select "Software Developer" and provide the RoninPLEX open-source repository link for automated analysis and rapid false-positive removal from Windows Defender definitions.
