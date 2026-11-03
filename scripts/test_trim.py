import subprocess, sys, pypdf

# Let's inspect how the trimmed version compiles
test_tex = r"""\documentclass[runningheads]{llncs}

\usepackage[T1]{fontenc}
\usepackage{graphicx}
\usepackage{amsmath,amssymb}
\usepackage{booktabs}
\usepackage{xcolor}
\usepackage{url}
\usepackage{microtype}
\renewcommand\UrlFont{\color{black}\rmfamily}

\setlength{\textfloatsep}{6pt plus 2pt minus 2pt}
\setlength{\floatsep}{4pt plus 1pt minus 1pt}
\setlength{\intextsep}{4pt plus 1pt minus 1pt}
\setlength{\abovedisplayskip}{3pt plus 1pt minus 1pt}
\setlength{\belowdisplayskip}{3pt plus 1pt minus 1pt}

% Helper: include figure file if present, else show placeholder
\newcommand{\figorbox}[3]{%
  \IfFileExists{#1}{\includegraphics[width=#2\textwidth]{#1}}{\fbox{\parbox{#2\textwidth}{\centering\scriptsize\vspace{#3}[Figure: #1]\vspace{#3}}}}}

\begin{document}

\title{A Resource-Efficient Hybrid Cascade Pipeline for Client-Side Schema Matching of Heterogeneous Web Forms with On-Device Sentence-BERT}
\titlerunning{Hybrid Cascade Pipeline for Client-Side Form Schema Matching}

\author{Andharu Raffi\inst{1} \and Fajrian Aprilio\inst{1} \and
Amma Liesvarastranta Haz\inst{1}\orcidID{0000-0002-5612-6062} \and
Evianita Dewi Fajrianti\inst{1}\orcidID{0000-0002-9019-9775} \and
Sritrusta Sukaridhoto\inst{1}\orcidID{0000-0002-8157-5863}}
\authorrunning{A. Raffi et al.}
\institute{Department of Informatics and Computer Engineering, Politeknik Elektronika Negeri Surabaya, Surabaya, Indonesia\\
\email{liesvarastranta@pens.ac.id}}

\maketitle

\begin{abstract}
Filling personal attributes into heterogeneous web forms is an instance of schema matching, where the source schema is a fixed user profile and the target schema is an unseen and often obfuscated set of form controls. Rule-only matchers fail on non-cognate and opaque identifiers, while cloud LLM matchers add network latency, recurring per-token cost, and data residency exposure. This paper proposes the \textbf{Hybrid Cascade Pipeline}, a resource-efficient client-side matching algorithm that escalates each control through seven tiers: W3C autocomplete lookup, prefix stripping with legacy abbreviation expansion, option-profiled date heuristics, tokenization with scoped cross-domain vetoes, query-normalized BM25 ranking, clamped hybrid lexical scoring with a runner-up margin guard, and on-device Sentence-BERT inference over quantized ONNX WebAssembly. The algorithm is implemented in \emph{GovConnect}, a proof-of-concept Chromium Manifest V3 extension testbed. On 5 English benchmark websites (177 controls inspected, 64 annotated), the pipeline resolves 62 of 64 target controls (96.9\% recall; 95\% Wilson CI [89.3\%, 99.1\%]), compared with 59.4\% for native Chromium autofill, 75.0\% for a TF-IDF logistic regression baseline, and 56.3\% for rule-only matching. Over 95\% of target controls resolve on a fast lexical path below 5~ms. A supplementary evaluation on 5 Indonesian public portals ($N=136$ live controls) and a white-box readiness audit delineate operational boundary conditions.
\keywords{Schema Matching \and Hybrid Cascade Pipeline \and Form Resolution \and Client-Side Edge AI \and Sentence-BERT \and Privacy by Design.}
\end{abstract}

\section{Introduction}
Public administrations and enterprises operate thousands of web portals, from tax and civil registration services to academic platforms. Backend interoperability programs intended to harmonize cross-agency data exchange are widely reported as slow, costly, and hampered by multi-vendor coordination, as in the Indonesian electronic-based government system (SPBE) [1,2]. Where backend exchange is unavailable, users must repeatedly retype identical identity, contact, and demographic attributes into fragmented forms.

Automatic form resolution is an applied instance of schema matching: each form control must be mapped to one canonical profile key. The task is harder than standardized e-commerce checkout forms covered by HTML \texttt{autocomplete} [3], because real-world portals span four structural heterogeneity classes: (1) standards-compliant HTML5 controls; (2) legacy ASP, JSP, and ERP modules with truncated 8-character identifiers and numeric row prefixes (\texttt{02frstname}, \texttt{23cellphon}); (3) single-page applications and table layouts with opaque identifiers (\texttt{input-7a9f}, \texttt{textfield23}); and (4) verbose narrative labels without technical attribute clues. Rigid regular expressions miss non-cognate synonyms such as \texttt{05\_company} for \texttt{organization} or \texttt{14adrstate} for \texttt{province}. Transmitting page structures and personal data to hosted Cloud LLMs avoids brittleness, but introduces network round-trips (1,500--4,000~ms), per-token operational costs, and cross-border data residency exposure under regulations such as Indonesia's PDP Law (UU No.~27/2022) [4] and the EU GDPR [5].

This paper treats form resolution as an algorithmic problem and investigates a complementary client-side layer. We formulate three research questions:
\textbf{RQ1 (Recall \& Disjoint Lexical Resolution):} How effectively can a hierarchical lexical-to-neural cascade resolve non-cognate variants and obfuscated controls without cloud LLM inference?
\textbf{RQ2 (Interactive Latency Budget):} Can the cascade meet interactive response budgets ($<5$~ms lexical, sub-300~ms neural fallback) within a resource-constrained browser sandbox?
\textbf{RQ3 (Boundary Conditions \& Threat Model):} What privacy boundaries can be enforced during inference, and what operational gaps emerge under a readiness analysis?

The contributions are: (1) the Hybrid Cascade Pipeline, a seven-tier matching algorithm combining deterministic lookup, scoped cross-domain vetoes, query-normalized BM25, clamped hybrid scoring, and offline quantized Sentence-BERT; (2) an evaluation on 5 English benchmark websites (177 controls inspected, 64 annotated target controls) against three measured baselines and a per-tier ablation, supplemented by a live evaluation across 5 Indonesian portals ($N=136$ live controls); and (3) a technology readiness and threat audit of the GovConnect reference testbed.

\section{Related Work}
Form filling is an applied formulation of schema matching, where element-level lexical similarity is combined with structural context [6]. String comparators from record linkage reward prefix agreement and tolerate typographical transpositions, suiting short technical attribute names [7,8]. For multi-word descriptive labels, the Okapi BM25 term-weighting model limits term-frequency saturation and accounts for document length [9]. Browser autofill relies on static regex dictionaries and autocomplete tokens [10], whereas learned classifiers model form semantics from token n-grams and layout structures [11]. When surface overlap vanishes, dense neural representations become necessary: Sentence-BERT reduces pair comparison to cosine similarity over fixed-size embeddings [12], and distilled MiniLM encoders compress transformer representations into a 384-dimensional space suitable for edge execution [13]. Existing solutions generally apply one family in isolation. We combine them in an ordered cascade so that computationally cheap deterministic evidence is evaluated first and the neural encoder runs only on residual ambiguous cases, entirely on the client device.

\section{Hybrid Cascade Pipeline}
\subsection{Reference Architecture and Privacy Boundary}
The pipeline is evaluated inside GovConnect, a three-tier Chromium Manifest V3 extension (Fig.~\ref{fig:arch}). A \emph{DOM Extraction Module} runs as a content script, scans inputs, selects, textareas, component-library widgets, and Shadow DOM trees, and synthesizes a label for each control through six strategies: \texttt{label[for]}, ancestor label, \texttt{aria-labelledby}, container boundary (\texttt{.form-group}), preceding sibling, and grid sibling. A \emph{Volatile Session Controller} runs as a background service worker and communicates with an encrypted profile repository storing attributes with field-level AES-256 encryption. Decrypted attributes reside strictly in volatile service-worker memory; when Manifest V3 terminates an idle worker (~30~s), session state is reconstructed on demand via token-authenticated re-validation. A \emph{Neural Inference Sandbox} in an offscreen document executes the neural encoder under a strict Content Security Policy. The canonical schema unifies 40 core identity keys with $\sim$300 bilingual lexical aliases and 14 extended document attributes (54 total keys). The zero-egress property applies strictly to the inference phase: no form DOM structure or personal data is transmitted to third-party inference APIs, while user profiles remain synchronized with the authenticated backend.

\begin{figure}[t]
\centering
\figorbox{fig_architecture.jpg}{0.88}{0.8cm}
\caption{GovConnect reference architecture and zero-egress neural inference boundary.}
\label{fig:arch}
\end{figure}

\subsection{Cascade Overview}
Let $\mathcal{E}$ be the candidate controls on a page and $\mathcal{K}$ the 54 canonical keys, where each key $k$ has an alias set $\mathcal{A}_k$. For each control $e \in \mathcal{E}$, the pipeline returns a key $\hat{k}\in\mathcal{K}$ or marks the control unrecognized, evaluating seven tiers in strict order and exiting at the first accepted decision (Fig.~\ref{fig:pipeline}). $D$ denotes the set of unique tokens extracted from $e$, and $Q$ the token set of a reference alias.

\begin{figure}[t]
\centering
\figorbox{fig_pipeline.jpg}{0.95}{1.2cm}
\caption{Decision flow across the seven tiers of the Hybrid Cascade Pipeline.}
\label{fig:pipeline}
\end{figure}

\paragraph{Pass 0, Pass 1, and Pass 1.5: Deterministic Resolution.}
Pass 0 splits compound \texttt{autocomplete} values by whitespace so tokens such as \texttt{shipping given-name} map in $\mathcal{O}(1)$ time ($<0.1$~ms) to canonical keys, while rejecting non-identity guards (\texttt{off}, \texttt{new-password}, \texttt{one-time-code}). Pass 1 strips numeric row prefixes with \texttt{/\^{}[0-9]+[\_-]*/} when at least two alphabetic characters remain (\texttt{02frstname} becomes \texttt{frstname}), removes vendor prefixes (\texttt{inp\_}, \texttt{reginput\_}), and expands 29 legacy abbreviations (mapping \texttt{pers\_ssn} to \texttt{nik}, \texttt{14adrstate} to \texttt{province}, \texttt{16addr\_zip} to \texttt{postal\_code}, \texttt{23cellphon} to \texttt{phone}, and \texttt{workphon} to \texttt{work\_telephone}). Pass 1.5 handles split date \texttt{<select>} controls while excluding payment card expiry fields (\texttt{ccexp}). When attribute names are opaque, it profiles option values in strict order: Year (numeric options $\ge 1900$), Month (textual names or integers $1 \le x \le 12$ with $\le 13$ options), and Day (maximum value $28 \le x \le 31$ with 28--32 options). Month is evaluated before Day because $[1,12]\subset[1,31]$.

\paragraph{Pass 2: Tokenization, Shortcuts, and Scoped Vetoes.}
Pass 2 builds the feature corpus $\text{name}+\text{id}+\text{aria-label}+\text{placeholder}+2\times\text{label\_text}$, where doubling visible label weight preserves strong signal on controls with generic names. CamelCase is split and whole words are stored in $D$. Whole-word matching eliminates substring false positives: \texttt{ibukota} (capital city) never triggers maternal rules, and \texttt{pekerjaan} (occupation) never triggers office contact rules. Seventeen deterministic shortcuts resolve high-frequency keys (email, phone, \texttt{nik}, postal code). If none fires, scoped cross-domain vetoes suppress candidates strictly inside their semantic domain: \texttt{"mother"}/\texttt{"ibu"} (\texttt{hasIbu}) and \texttt{"father"}/\texttt{"ayah"} (\texttt{hasAyah}) veto personal \texttt{full\_name} in favor of parental keys (+0.25 Pass 3 bonus); \texttt{"emergency"}/\texttt{"darurat"} (\texttt{hasDarurat}) vetoes personal name/phone for emergency contacts (+0.30); \texttt{"office"}/\texttt{"kantor"} (\texttt{hasKantor}) vetoes domicile address for work address (+0.25); \texttt{"home"}/\texttt{"rumah"} (\texttt{hasHome}) vetoes mobile/work phone for home phone (+0.35, preserving domicile address); and \texttt{"fax"} (\texttt{hasFax}) redirects voice phone keys to fax (+0.40).

\paragraph{Pass 2.5: Query-Normalized BM25.}
For verbose descriptive labels with $|D|>4$, character-level distances degrade through token dilution. Pass 2.5 scores aliases with Okapi BM25 using $k_1=1.2$, $b=0.30$, $\text{avgdl}=6.0$, and client baseline $\text{IDF}(q)=1.0$, normalized by query length $|Q|$:
\begin{equation}
\text{Score}_{\text{BM25}}=\min\!\left(\frac{1}{|Q|}\sum_{q\in Q\cap D}\text{IDF}(q)\cdot\frac{\text{TF}(q,D)\,(k_1+1)}{\text{TF}(q,D)+k_1\left(1-b+b\,\frac{|D|}{\text{avgdl}}\right)},\,1.0\right).
\label{eq:bm25}
\end{equation}
Because $D$ is a unique token set, $\text{TF}=1$. For $5\le|D|\le 8$, the per-token quotient evaluates to $0.95\text{--}1.03$, so the exit threshold $\tau=0.75$ corresponds to matching roughly three-quarters of the alias tokens. An early prototype ($b=0.75, \text{avgdl}=3.0$, divisor $1.5|Q|$, threshold 0.80) capped scores at $\le 0.524$ for $|D|\ge 5$ and was mathematically dead code; the parameters above represent the recalibrated specification used across all reported benchmarks.

\paragraph{Pass 3: Clamped Hybrid Scoring.}
Residual candidates are evaluated via a linear combination of token cosine (50\%), Jaro-Winkler similarity between control string $s_e$ and alias string $s_a$ (35\%) [7,8], token overlap (15\%), and additive context bonuses $B(k,D)\in[0,0.40]$:
\begin{equation}
\text{Score}_{\text{final}}(a,e)=\min\!\left(0.50\cos(D,Q)+0.35\,\text{JW}(s_e,s_a)+0.15\,\frac{|Q\cap D|}{|Q|}+B(k,D),\,1.0\right).
\label{eq:hybrid}
\end{equation}
High Confidence ($\ge 0.85$) and Medium Confidence ($[0.60,0.85)$) return argmax $\hat{k}$ directly in 3--5~ms. Low Confidence ($[0.55,0.60)$) accepts $\hat{k}$ only if the runner-up margin satisfies $S_{(1)}-S_{(2)}\ge 0.10$. A score $<0.55$, or a Low-zone margin $<0.10$, escalates the control to Pass 4.

\paragraph{Pass 4: On-Device Sentence-BERT via ONNX WebAssembly.}
For implicit narrative labels (e.g., \textit{``Orang yang melahirkan pemohon''}), the control is dispatched to the offscreen sandbox running a quantized \texttt{int8} \texttt{all-MiniLM-L6-v2} encoder on ONNX Runtime WebAssembly. Weights and binaries are bundled locally, executing under strict CSP without network access. The 384-dimensional embedding is compared via cosine similarity against 54 precomputed anchor embeddings; if $\cos\ge 0.50$, the best anchor is assigned and injected via framework-compatible prototype event dispatchers; otherwise, it is marked unrecognized. The 0.50 threshold is uncalibrated and Pass 4 operates without a runner-up margin guard.

\section{Experimental Evaluation}
\subsection{Setup and Methodology}
Evaluation was conducted on 5 live English benchmark sites (177 controls inspected): RoboForm All-Fields ($N=41$, legacy abbreviations), University of Michigan W3C Suite ($N=54$, unlabelled W3C taxonomy), SelectorsHub ($N=41$, dynamic inputs and payment traps), GetAutoClicker ($N=22$, heterogeneous controls), and PasswordManager UK ($N=19$, table layout with obfuscated \texttt{textfield*} names). We annotated 64 target sub-controls spanning 10 non-name attribute categories chosen for their non-cognate root terminology. Latency was measured on an Intel Core i5 Gen 11 (8~GB RAM, Chromium 128+). Confidence intervals are reported as 95\% Wilson score intervals.

\subsection{Comparison with Measured Baselines}
Table~\ref{tab:baseline} compares the full cascade against native Chromium autofill, a character/word n-gram TF-IDF logistic regression classifier, and the internal rule-only configuration (Passes 0--1.5). Native autofill resolves standard W3C controls (18/19 on UMich) but fails completely on table layouts without explicit labels (0/12 on PasswordManager UK). The statistical classifier degrades on unlabelled W3C inputs (11/19) and split date selects. The full cascade achieves 96.9\% recall with 100\% precision on the annotated target set (98.4\% F1), and 95.3\% of target controls resolve on the lexical path with p50 of 1.2~ms and p95 of 4.1~ms. Pass 4 neural fallback incurs 120--280~ms per field after an 800--1,200~ms WASM warm-up with 80--120~MB offscreen RAM footprint. A 10-field form requiring 100\% neural fallback would require 1.2--2.8~s, an extreme condition that did not manifest in benchmark testing (only 1 of 64 target controls invoked Pass 4).

\begin{table}[t]
\caption{Measured performance comparison across 64 annotated target controls.}
\label{tab:baseline}
\centering
\scriptsize
\begin{tabular}{p{3.3cm}cccp{1.7cm}p{2.3cm}}
\toprule
\textbf{Architecture / Baseline} & \textbf{Resolved} & \textbf{Recall [95\% CI]} & \textbf{Prec.} & \textbf{Mean Latency} & \textbf{Inference Egress} \\
\midrule
Native Chromium Autofill [10] & 38/64 & 59.4\% [47.1, 70.5] & 100.0\% & 0.011 ms & None (local) \\
TF-IDF + Logistic Regression [11] & 48/64 & 75.0\% [63.2, 84.0] & 98.0\% & 0.664 ms & None (local) \\
Rule-Only Baseline (Pass 0--1.5) & 36/64 & 56.3\% [44.1, 67.7] & 100.0\% & $<0.001$ ms & None (local) \\
\textbf{GovConnect Full Cascade} & \textbf{62/64} & \textbf{96.9\% [89.3, 99.1]} & \textbf{100.0\%} & \textbf{$<5$ ms (95.3\%)}$^{*}$ & \textbf{Zero (on-device WASM)} \\
\bottomrule
\end{tabular}
\\[2pt]
{\tiny $^{*}$Controls resolved on the lexical fast-path ($<5$ ms); Pass 4 neural fallback adds 120--280 ms/field.}
\end{table}

\subsection{Per-Category Results and Ablation}
Table~\ref{tab:cat} details resolution across categories and sites. The pipeline resolved 62 of 64 target controls (96.9\%), and 57 of 58 (98.3\%; CI [90.9, 99.7]) when excluding the heterogeneous \texttt{website/misc} row. Cumulative ablation confirms the marginal gain of each tier: Pass 0 resolves 28.1\% (18/64); Passes 1 and 1.5 increase coverage to 56.3\% (36/64); Pass 2 shortcuts and vetoes add +31.2\% to reach 87.5\% (56/64); Pass 3 adds +7.8\% to reach 95.3\% (61/64); and Pass 4 resolves the remaining narrative control to reach 96.9\% (62/64). Auxillary checks confirmed 100\% email resolution (5/5 sites) and 94.7\% (18/19; CI [75.4, 99.1]) on obfuscated \texttt{textfield*} inputs. The two misses were \texttt{honorific-prefix} on UMich (unmapped in Pass 0) and generic \texttt{the\_date} on SelectorsHub, which was correctly rejected due to lack of birth context.

\begin{table}[t]
\caption{Resolution of 10 non-name attribute categories across 5 benchmark sites ($N=177$ controls inspected, $n=64$ target controls).}
\label{tab:cat}
\centering
\scriptsize
\begin{tabular}{p{1.7cm}p{3.5cm}ccccc c}
\toprule
\textbf{Canonical Key} & \textbf{Observed Lexical Variants} & \textbf{Robo} & \textbf{UMich} & \textbf{SelHub} & \textbf{Clicker} & \textbf{PassMgr} & \textbf{Total} \\
\midrule
\texttt{organization} & \texttt{05\_company}, \texttt{organization}, \texttt{textfield*} & 1/1 & 1/1 & 4/4 & -- & 1/1 & 7/7 (100\%) \\
\texttt{occupation} & \texttt{06position}, \texttt{organization-title} & 1/1 & 1/1 & -- & -- & 1/1 & 3/3 (100\%) \\
\texttt{phone} & \texttt{23cellphon}, \texttt{20homephon}, \texttt{tel-national} & 3/3 & 2/2 & 4/4 & -- & 2/2 & 11/11 (100\%) \\
\texttt{birth\_date} & \texttt{66mm}/\texttt{67dd}/\texttt{68yy}, \texttt{bday-*}, \texttt{the\_date} & 3/3 & 4/4 & 1/2 & -- & 1/1 & 9/10 (90.0\%) \\
\texttt{gender} & \texttt{60pers\_sex}, \texttt{sex}, radio group & 1/1 & 1/1 & -- & 3/3 & --$^{\dagger}$ & 5/5 (100\%) \\
\texttt{province} & \texttt{14adrstate}, \texttt{address-level1} & 1/1 & 1/1 & -- & -- & 1/1 & 3/3 (100\%) \\
\texttt{city} & \texttt{13adr\_city}, \texttt{address-level2} & 1/1 & 1/1 & -- & -- & 1/1 & 3/3 (100\%) \\
\texttt{postal\_code} & \texttt{16addr\_zip}, \texttt{postal-code} & 1/1 & 1/1 & -- & -- & 1/1 & 3/3 (100\%) \\
\texttt{address} & \texttt{10address1/2}, \texttt{15\_country} & 3/3 & 5/5 & 1/1 & 1/1 & 3/3 & 13/13 (100\%) \\
\texttt{website/misc}$^{\ddagger}$ & \texttt{25web\_site}, \texttt{68\_\_income}, \texttt{01\_\_\_title} & 3/3 & 1/2 & -- & -- & 1/1 & 5/6 (83.3\%) \\
\midrule
\textbf{Total / Recall} & \textbf{35+ Distinct Surface Patterns} & \textbf{18/18} & \textbf{18/19} & \textbf{10/11} & \textbf{4/4} & \textbf{12/12}$^{\dagger}$ & \textbf{62/64 (96.9\%)} \\
\bottomrule
\end{tabular}
\\[2pt]
{\tiny $^{\dagger}$PassMgr UK has no gender field (denominator = 12). $^{\ddagger}$Groups \texttt{website}, \texttt{income}, and \texttt{title} controls; UMich denominator = 19 includes \texttt{honorific-prefix}.}
\end{table}

\subsection{Accounting of All 177 Controls and Live Public Portals}
Accounting for the remaining 113 DOM controls across the 5 reference sites reveals: (1)~\textbf{26 auxiliary identity/contact controls} (\texttt{email}, names), where 25/26 (96.2\%) resolved accurately; (2)~\textbf{63 security, payment, and non-profile controls} (\texttt{password}, \texttt{ccnumber}, \texttt{cvv}, \texttt{search}), where \textbf{100\% (63/63) were correctly rejected as True Negatives (0.0\% FPR)}; and (3)~\textbf{24 generic UI widgets} (unlabelled checkboxes, vehicle dropdowns, \texttt{42ccexp}), which produced 24 unintended fallback fills. Across all $64+26=90$ profile controls and 87 non-profile controls, full-page macro metrics are \textbf{96.7\% Recall}, \textbf{78.4\% Precision}, and \textbf{86.6\% F1} (reaching \textbf{96.6\% Precision} and \textbf{96.7\% F1} on text/select identity inputs when blind checkbox fallback is disabled).

To assess generalization, we evaluated the frozen pipeline on 5 live Indonesian portals ($N=136$ live controls): Coretax DJP (tax, 47), SSCASN BKN (civil service, 28), OSS BKPM (licensing, 9), SMK Semen Gresik SPMB (admission, 31), and a localized registration simulation on JotForm (21). Across all 10 evaluated websites ($177+136=313$ total inspected controls), all 38 available identity groups were resolved (100\%), and 98 of 99 core sub-inputs were correctly populated (99.0\%; CI [94.5, 99.8]). Crucially, scoped vetoes \texttt{hasIbu} and \texttt{hasAyah} prevented personal names from contaminating parental fields on Coretax and SMK, while Pass 2.5 and Pass 4 resolved dynamic React IDs (\texttt{input-145}, \texttt{input-253}) on OSS BKPM.

\subsection{Threats to Validity}
\emph{In-sample bias.} The abbreviation map reflects legacy 8-character conventions seen on RoboForm; classifying RoboForm (18 targets) as a development set, the frozen pipeline achieved 95.7\% recall (44/46; CI [85.5, 98.8]) on the 4 held-out English sites. \emph{Language coverage.} The Pass 4 encoder was pre-trained on English sentence pairs; its Indonesian performance relies on cross-lingual lexical anchors, warranting formal evaluation with multilingual models. \emph{Annotation scope.} Target annotations were established by the authors; while ground truth on standard fields is unambiguous, multi-annotator Cohen's $\kappa$ is planned for future benchmarks.

\section{Discussion: Privacy, Governance, and Readiness}
Client-side matching eliminates per-token cloud AI expenses and third-party inference egress, but does not render the architecture cost-free or automatically compliant. Container hosting for the encrypted profile backend, automated backups, and lexical maintenance remain recurring operational commitments. Crucially, zero egress holds exclusively for the on-device inference phase, as citizen attributes still transit from the profile store to the extension. A compliance-oriented deployment therefore mandates formal legal bases, explicit consent, and Data Protection Impact Assessments (DPIAs) under EU GDPR and Indonesia's PDP Law [4,5]. GovConnect is not a substitute for national interoperability frameworks (SPBE, Satu Data); it provides an immediate client-side bridge for citizens pending backend integration.

Principal threat vectors include phishing sites soliciting autofill, hidden-field harvesting, third-party page script exfiltration, and compromised extension assets. Planned mitigations encompass domain allowlisting, visible-field-only injection, minimal Manifest V3 permissions, and cryptographic integrity verification of bundled WASM binaries. Table~\ref{tab:audit} summarizes operational boundary conditions identified during white-box readiness auditing.

\begin{table}[t]
\caption{Boundary conditions and readiness status of the reference implementation.}
\label{tab:audit}
\centering
\scriptsize
\begin{tabular}{p{2.6cm}p{2.9cm}p{1.9cm}p{4.1cm}}
\toprule
\textbf{Component Tier} & \textbf{Boundary Condition} & \textbf{Status} & \textbf{Architectural Resolution / Roadmap} \\
\midrule
Pass 3 Scoring & Unbounded score ($\sim$1.40) & Resolved & Clamped with $\min(\cdot)$; margin guard on $[0.55,0.60)$ \\
Pass 2.5 BM25 & Cap of 0.52 made tier dead code & Recalibrated & $b{=}0.30$, $\text{avgdl}{=}6.0$, $\tau{=}0.75$; corpus IDF planned \\
DOM Injection & Silent overwrite \& desync & Identified Risk & Post-fill verification (\texttt{el.value===target}) and overwrite guard \\
Generic Fallbacks & 24 unintended fills on widgets & Identified Risk & Restrict heuristic fallbacks on unlabelled controls \\
Card Expiry & Prefix stripping precedes guard & Identified Risk & Enforce card-expiry guard prior to prefix stripper \\
Pass 4 Neural & Monolingual, uncalibrated 0.50 & Open Roadmap & Multilingual SBERT, ROC calibration, margin guard \\
Composite Fields & Joint controls (\texttt{ttl} place+date) & Open Roadmap & Bipartite assignment, proximity header parsing \\
\bottomrule
\end{tabular}
\end{table}

\section{Conclusion and Future Work}
The Hybrid Cascade Pipeline provides preliminary evidence that an ordered combination of W3C lookup, deterministic normalization, scoped vetoes, query-normalized BM25, clamped hybrid scoring, and on-device Sentence-BERT resolves heterogeneous web form controls accurately and rapidly without cloud inference. On 5 English reference benchmarks it resolved 62 of 64 annotated controls (96.9\% recall), outperforming native Chromium autofill (59.4\%) and statistical classifiers (75.0\%), while supplementary testing across 5 live Indonesian portals demonstrated full identity-group resolution. Priority future work includes: (1) post-fill DOM state verification and non-empty overwrite guards; (2) ROC calibration of Pass 4 with multilingual encoders (\texttt{paraphrase-multilingual-MiniLM-L12-v2}); (3) asynchronous handlers for cascading regional dropdowns; and (4) transitioning profile storage toward W3C Verifiable Credentials [14].

\paragraph{Ethics and Reproducibility.}
All tests utilized synthetic profiles on public web forms without submitting payloads to production government databases. Benchmark logs, DOM snapshots, and annotation protocols are preserved at \url{https://github.com/govconnect/evaluation-data}.

\subsubsection*{Acknowledgments and Disclosure.}
The authors thank the maintainers of FastAPI, ONNX Runtime Web, and Transformers.js, and the GovConnect development team. The authors declare no competing interests.

\begin{thebibliography}{14}
\scriptsize
\setlength{\itemsep}{-1.5pt}
\bibitem{spbe} Hermanto, B., et al.: Electronic-Based Government System (SPBE) in Indonesia. J. Theor. Appl. Inf. Technol. 100(12), 4380--4392 (2022)
\bibitem{perpres} Republic of Indonesia: Peraturan Presiden No.~95/2018 tentang Sistem Pemerintahan Berbasis Elektronik (SPBE). LNRI No.~182, Jakarta (2018)
\bibitem{whatwg} WHATWG: HTML Living Standard, \S4.10.18: Form Controls (2026), \url{https://html.spec.whatwg.org/}
\bibitem{uupdp} Republic of Indonesia: UU No. 27/2022 tentang Pelindungan Data Pribadi. LNRI No. 196 (2022)
\bibitem{gdpr} European Union: Regulation (EU) 2016/679 (GDPR). OJ L 119, pp. 1--88 (2016)
\bibitem{rahm} Rahm, E., Bernstein, P.A.: A survey of schema matching. VLDB J. 10(4), 334--350 (2001)
\bibitem{jaro} Jaro, M.A.: Record-linkage methodology for census matching. J. Am. Stat. Assoc. 84(406), 414--420 (1989)
\bibitem{winkler} Winkler, W.E.: String comparator metrics in record linkage. In: Proc. ASA, pp. 354--359 (1990)
\bibitem{bm25} Robertson, S., Zaragoza, H.: BM25 and beyond. Found. Trends Inf. Retr. 3(4), 333--389 (2009)
\bibitem{chromium} Chromium Project: Autofill heuristics and form parsing infrastructure. Google (2024), \url{https://source.chromium.org/chromium/chromium/src/+/main:components/autofill/}
\bibitem{he} He, B., Chang, K.C.-C.: Automatic complex schema matching across web query interfaces. ACM Trans. Database Syst. 31(2), 346--395 (2006)
\bibitem{sbert} Reimers, N., Gurevych, I.: Sentence-BERT: sentence embeddings using Siamese BERT-networks. In: Proc. EMNLP-IJCNLP, pp. 3982--3992 (2019)
\bibitem{minilm} Wang, W., et al.: MiniLM: deep self-attention distillation for task-agnostic compression of pre-trained transformers. In: NeurIPS 33, pp. 5776--5788 (2020)
\bibitem{vc} W3C: Verifiable Credentials Data Model v2.0. W3C Recommendation (2026), \url{https://www.w3.org/TR/vc-data-model-2.0/}
\end{thebibliography}

\end{document}
"""

with open('docs/iclamp/latex/test_trimmed.tex', 'w', encoding='utf-8') as f:
    f.write(test_tex)

print("Written test_trimmed.tex")

