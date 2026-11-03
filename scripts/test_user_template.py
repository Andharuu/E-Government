import subprocess, sys

user_tex = r"""\documentclass[runningheads]{llncs}

\usepackage[T1]{fontenc}
\usepackage{graphicx}
\usepackage{amsmath,amssymb}
\usepackage{booktabs}
\usepackage{url}
\renewcommand\UrlFont{\color{black}\rmfamily}

% Helper: include a figure file if present, otherwise show a labelled placeholder box.
\newcommand{\figorbox}[3]{%
  \IfFileExists{#1}{\includegraphics[width=#2\textwidth]{#1}}{\fbox{\parbox{#2\textwidth}{\centering\scriptsize\vspace{#3}[Placeholder: #1]\vspace{#3}}}}}

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
Filling the same personal attributes into many heterogeneous web forms is an instance of schema matching, where the source schema is a fixed user profile and the target schema is an unseen and often obfuscated set of form controls. Rule-only matchers fail on non-cognate and opaque identifiers, while cloud LLM matchers add network latency, recurring cost, and data residency exposure. This paper proposes the Hybrid Cascade Pipeline, a resource-efficient client-side matching algorithm that escalates each control through seven tiers: W3C autocomplete lookup, prefix stripping with legacy abbreviation expansion, option-profiled date heuristics, tokenization with scoped cross-domain vetoes, query-normalized BM25 ranking, clamped hybrid lexical scoring with a runner-up margin guard, and on-device Sentence-BERT inference over quantized ONNX WebAssembly. The algorithm is implemented in GovConnect, a proof-of-concept Chromium Manifest V3 extension that serves as a reference testbed. On 5 English benchmark websites (177 controls inspected, 64 annotated), the pipeline resolves 62 of 64 target controls (96.9\% recall; 95\% Wilson CI [89.3\%, 99.1\%]), compared with 59.4\% for native Chromium autofill and 75.0\% for a TF-IDF logistic regression baseline, and 95.3\% of the target controls resolve on a lexical path below 5 ms. A supplementary test on 5 Indonesian portals and a readiness analysis delineate the remaining limitations.
\keywords{Schema Matching \and Hybrid Cascade Pipeline \and Form Resolution \and Client-Side Edge AI \and Sentence-BERT \and Privacy by Design.}
\end{abstract}

\section{Introduction}
Public administrations and enterprises operate thousands of web portals, from tax and civil registration services to academic and licensing platforms. Backend interoperability programs that would let these systems exchange data are widely reported as slow, costly, and dependent on multi-vendor coordination, as in the Indonesian electronic-based government system (SPBE) [1]. Where such exchange is unavailable, users must repeatedly retype identical identity, contact, and demographic attributes into fragmented forms.

Automatic form resolution is a practical case of schema matching: each form control must be mapped to one key of a canonical profile schema. The task is harder than the standardized checkout forms covered by the HTML \texttt{autocomplete} specification [2], because real forms fall into four heterogeneity classes: (1) standards-compliant HTML5 controls; (2) legacy ASP, JSP, and ERP modules with truncated column identifiers and numeric row prefixes (\texttt{02frstname}, \texttt{23cellphon}); (3) single-page applications and table layouts with opaque identifiers (\texttt{input-7a9f}, \texttt{textfield23}); and (4) verbose narrative labels without technical clues. Rigid regular expressions miss non-cognate variants such as \texttt{05\_company} for \texttt{organization} or \texttt{14adrstate} for \texttt{province}. Sending page structure and personal data to a hosted LLM avoids this brittleness, but it adds a network round trip, a per-token cost, and cross-border data residency exposure under regimes such as Indonesia's Personal Data Protection Law and the EU GDPR [3,4].

This paper treats form resolution as an algorithmic problem and studies a complementary client-side layer rather than a replacement for backend interoperability. We ask three research questions.
\textbf{RQ1:} How well can a hierarchical lexical-to-neural cascade resolve non-cognate and obfuscated controls without cloud LLM inference?
\textbf{RQ2:} Does the cascade meet interactive latency budgets inside a browser?
\textbf{RQ3:} Which privacy boundary can be enforced during inference, and which boundary conditions remain open under a readiness analysis?

The contributions are: (1) the Hybrid Cascade Pipeline, a seven-tier matching algorithm that combines deterministic lookup, scoped cross-domain vetoes, query-normalized BM25, clamped hybrid scoring, and offline quantized Sentence-BERT; (2) an evaluation on 5 English benchmark websites (177 controls inspected, 64 annotated target controls) against three measured baselines and a per-tier ablation, supplemented by a test on 5 Indonesian portals; and (3) a readiness and threat analysis of the GovConnect reference implementation. GovConnect is a testbed for the algorithm and is not claimed to be production ready.

\section{Related Work}
Form filling is an applied formulation of schema matching, where element-level lexical similarity is combined with structural context [5]. String comparators from record linkage reward prefix agreement and tolerate transpositions, which suits short technical attribute names [6,7]. For multi-word descriptive labels, the Okapi BM25 term-weighting model limits term-frequency saturation and accounts for document length [8]. Browser autofill relies on static regular expression dictionaries and autocomplete tokens [9], whereas learned classifiers model form semantics from token n-grams and layout [10]. When surface overlap vanishes, dense representations are needed: Sentence-BERT reduces pair comparison to cosine similarity over fixed-size embeddings [11], and distilled MiniLM encoders compress transformers into a 384-dimensional space small enough for edge execution [12]. Existing work generally uses one of these families in isolation. We combine them in an ordered cascade so that cheap deterministic evidence is tried first and the neural encoder runs only on residual cases, entirely on the device.

\section{Hybrid Cascade Pipeline}
\subsection{Reference Architecture and Privacy Boundary}
The pipeline is evaluated inside GovConnect, a three-tier Chromium Manifest V3 extension (Fig.~\ref{fig:arch}). A \emph{DOM Extraction Module} runs as a content script, scans inputs, selects, textareas, component-library widgets, and Shadow DOM trees, and synthesizes a label for each control through six strategies: \texttt{label[for]}, ancestor label, \texttt{aria-labelledby}, container boundary, preceding sibling, and grid sibling. A \emph{Volatile Session Controller} runs as the background service worker and talks to a FastAPI profile repository that stores each attribute with field-level AES-256 encryption. Decrypted attributes stay only in volatile service-worker memory; when Manifest V3 terminates an idle worker (about 30 s), state is rebuilt on demand through token-authenticated re-validation. A \emph{Neural Inference Sandbox} in an offscreen document runs the encoder under a strict content security policy. The target schema has 54 keys: 40 core identity keys with about 300 bilingual lexical variants and 14 extended document attributes. The zero-egress property applies strictly to the inference phase: no form structure or attribute value is sent to a third-party inference service, while the profile itself is still synchronized with the authenticated backend.

\begin{figure}[t]
\centering
\figorbox{fig_architecture.png}{0.92}{1.2cm}
\caption{GovConnect reference architecture with its three isolated tiers and the boundary of the zero-egress inference phase.}
\label{fig:arch}
\end{figure}

\subsection{Cascade Overview}
Let $\mathcal{E}$ be the set of candidate controls on a page and $\mathcal{K}$ the 54 canonical keys. Each key $k$ has an alias set $\mathcal{A}_k$. For a control $e \in \mathcal{E}$, the pipeline returns a key $\hat{k}\in\mathcal{K}$ or marks the control unrecognized, trying seven tiers in order and exiting at the first accepted decision (Fig.~\ref{fig:pipeline}). Throughout, $D$ denotes the set of unique tokens extracted from $e$, and $Q$ the token set of a reference alias.

\begin{figure}[t]
\centering
\figorbox{fig_pipeline.png}{0.98}{2.4cm}
\caption{Decision flow of the Hybrid Cascade Pipeline. Each tier either returns a key $\hat{k}$ or passes the control to the next tier; latency figures are per field.}
\label{fig:pipeline}
\end{figure}

\paragraph{Pass 0, Pass 1, and Pass 1.5: deterministic resolution.}
Pass 0 splits compound \texttt{autocomplete} values by whitespace so tokens such as \texttt{shipping given-name} map in constant time (below 0.1 ms) to 14 canonical keys, and it rejects non-identity guards (\texttt{off}, \texttt{new-password}, \texttt{one-time-code}). Pass 1 strips numeric row prefixes with \texttt{/\^{}[0-9]+[\_-]*/} when at least two alphabetic characters remain (\texttt{02frstname} becomes \texttt{frstname}), removes vendor prefixes, and expands 29 legacy abbreviations (for example \texttt{pers\_ssn} to \texttt{nik}, \texttt{workphon} to \texttt{work\_telephone}). Pass 1.5 handles split date \texttt{<select>} controls and excludes card expiry fields. When names are opaque it profiles option values in a fixed order: year (numeric options of at least 1900), then month (month names, or integers 1 to 12 with at most 13 options), then day (maximum value between 28 and 31 with 28 to 32 options). Month is tested before day because $[1,12]\subset[1,31]$.

\paragraph{Pass 2: tokenization, shortcuts, and scoped vetoes.}
Pass 2 builds the feature corpus $\text{name}+\text{id}+\text{aria-label}+\text{placeholder}+2\times\text{label\_text}$, where doubling the visible label keeps a strong signal for controls with generic names. Camel case is split and whole words are stored in $D$. Whole-word matching prevents substring errors: \texttt{ibukota} (capital city) never raises the maternal flag, and \texttt{pekerjaan} (occupation) never raises an office-contact rule. Seventeen deterministic shortcuts cover high-frequency keys such as email, phone, \texttt{nik}, and postal code. If none fires, scoped veto rules (Table~\ref{tab:veto}) suppress candidates only inside their own semantic domain, so that, for example, a home-phone cue vetoes mobile phone but leaves the domicile address intact.

\begin{table}[t]
\caption{Scoped cross-domain vetoes and Pass 3 context bonuses.}
\label{tab:veto}
\centering
\scriptsize
\begin{tabular}{p{2.5cm}p{2.7cm}p{2.6cm}p{3.6cm}}
\toprule
\textbf{Trigger tokens in $D$} & \textbf{Flag} & \textbf{Vetoed target} & \textbf{Redirect (bonus)} \\
\midrule
\texttt{mother}, \texttt{ibu} & \texttt{hasIbu} & personal \texttt{full\_name} & \texttt{mother\_name} ($+0.25$) \\
\texttt{father}, \texttt{ayah} & \texttt{hasAyah} & personal \texttt{full\_name} & \texttt{father\_name} ($+0.25$) \\
\texttt{emergency}, \texttt{darurat} & \texttt{hasDarurat} & \texttt{full\_name}, \texttt{phone} & \texttt{emergency\_contact\_*} ($+0.30$) \\
\texttt{office}, \texttt{kantor} & \texttt{hasKantor} & domicile \texttt{address} & \texttt{work\_address} ($+0.25$ if no domicile token) \\
\texttt{home}, \texttt{rumah} & \texttt{hasHome} & mobile and work phone only & \texttt{home\_phone} ($+0.35$) \\
\texttt{fax}, \texttt{telefax} & \texttt{hasFax} & all voice phone keys & \texttt{fax} ($+0.40$) \\
\bottomrule
\end{tabular}
\end{table}

\paragraph{Pass 2.5: query-normalized BM25.}
For verbose labels with $|D|>4$, character-level distances degrade through token dilution. Pass 2.5 scores each alias with Okapi BM25 using $k_1=1.2$, $b=0.30$, $\text{avgdl}=6.0$, and $\text{IDF}(q)=1$, normalized by the alias length $|Q|$:
\begin{equation}
\text{Score}_{\text{BM25}}=\min\!\left(\frac{1}{|Q|}\sum_{q\in Q\cap D}\text{IDF}(q)\cdot\frac{\text{TF}(q,D)\,(k_1+1)}{\text{TF}(q,D)+k_1\left(1-b+b\,\frac{|D|}{\text{avgdl}}\right)},\,1.0\right).
\label{eq:bm25}
\end{equation}
Because $D$ is a set, $\text{TF}=1$. For $5\le|D|\le 8$ the per-token term then lies between about 0.95 and 1.03, so the exit threshold $\tau=0.75$ corresponds to matching roughly three quarters of the alias tokens. An early parametrization ($b=0.75$, $\text{avgdl}=3.0$, divisor $1.5|Q|$, threshold 0.80) capped the score at about 0.52 for $|D|=5$ and could never fire; the values above are the recalibrated ones used in all reported results. Corpus-derived IDF remains future work.

\paragraph{Pass 3: clamped hybrid scoring.}
Remaining candidates receive a weighted combination of token cosine, Jaro-Winkler similarity between the control string $s_e$ and the alias string $s_a$, token overlap, and a context bonus $B(k,D)\in[0,0.40]$ from Table~\ref{tab:veto}:
\begin{equation}
\text{Score}_{\text{final}}(a,e)=\min\!\left(0.50\cos(D,Q)+0.35\,\text{JW}(s_e,s_a)+0.15\,\frac{|Q\cap D|}{|Q|}+B(k,D),\,1.0\right).
\label{eq:hybrid}
\end{equation}
The argmax key $\hat{k}$ is returned directly in the High zone ($\ge 0.85$) and the Medium zone ($[0.60,0.85)$). In the Low zone ($[0.55,0.60)$) it is accepted only if the margin over the runner-up satisfies $S_{(1)}-S_{(2)}\ge 0.10$. A score below $0.55$, or a Low-zone margin below $0.10$, escalates the control to Pass 4. The weights, zone limits, and bonuses were set manually and were not tuned on a validation set.

\paragraph{Pass 4: on-device Sentence-BERT.}
For implicit or narrative descriptions (for example ``Orang yang melahirkan pemohon''), the control is dispatched to the offscreen sandbox, which runs a quantized \texttt{int8} \texttt{all-MiniLM-L6-v2} encoder on ONNX Runtime WebAssembly. Weights and binaries are bundled in the extension package and run without external network requests. The 384-dimensional embedding is compared by cosine similarity with 54 precomputed anchor embeddings; if $\cos\ge 0.50$ the best anchor is assigned and the value is injected through framework-compatible prototype event dispatch, otherwise the control is marked unrecognized. The 0.50 threshold is uncalibrated and Pass 4 has no margin guard.

\section{Experimental Evaluation}
\subsection{Setup}
We evaluated on 5 live English-language benchmark pages (177 controls inspected): RoboForm All-Fields ($N{=}41$, legacy abbreviations), University of Michigan autofill suite ($N{=}54$, unlabelled W3C taxonomy), SelectorsHub ($N{=}41$, dynamic inputs and payment traps), GetAutoClicker ($N{=}22$, radio, checkbox, and textarea controls), and PasswordManager UK ($N{=}19$, table layout with all names obfuscated as \texttt{textfield*}). We annotated 64 target controls over 10 non-name attribute categories chosen for their non-cognate surface forms. Latency was measured on an Intel Core i5 (11th gen) with 8 GB RAM and Chromium 128 or newer. Precision in Table~\ref{tab:baseline} is computed over annotated target controls, and recall intervals are 95\% Wilson intervals. Annotation was performed by the authors without a second annotator, so inter-annotator agreement is not reported.

\subsection{Comparison with Baselines}
Table~\ref{tab:baseline} compares the full cascade with native Chromium autofill, a character and word n-gram TF-IDF logistic regression classifier, and the internal rule-only configuration (Passes 0 to 1.5). Native autofill resolves W3C controls (18 of 19 on UMich) but fails on obfuscated table layouts (0 of 12 on PasswordManager UK). The statistical classifier degrades on unlabelled W3C inputs (11 of 19) and on split date selects. The full cascade reaches 96.9\% recall with 100\% precision on the annotated set (F1 of 98.4\%), and 95.3\% of target controls resolve on the lexical path with p50 of 1.2 ms and p95 of 4.1 ms. The Pass 4 fallback costs 120 to 280 ms per field after a one-time WebAssembly initialization of 800 to 1,200 ms and 80 to 120 MB of offscreen memory. A form whose 10 fields all required Pass 4 would therefore take about 1.2 to 2.8 s, a case that did not occur in our data (1 of 64 target controls used Pass 4).

\begin{table}[t]
\caption{Measured comparison on the 64 annotated target controls.}
\label{tab:baseline}
\centering
\scriptsize
\begin{tabular}{p{3.2cm}cccp{1.5cm}p{2.2cm}}
\toprule
\textbf{Method} & \textbf{Resolved} & \textbf{Recall [95\% CI]} & \textbf{Prec.} & \textbf{Mean latency} & \textbf{Egress} \\
\midrule
Native Chromium autofill & 38/64 & 59.4\% [47.1, 70.5] & 100.0\% & 0.011 ms & none (local) \\
TF-IDF + logistic regression & 48/64 & 75.0\% [63.2, 84.0] & 98.0\% & 0.664 ms & none (local) \\
Rule-only (Pass 0 to 1.5) & 35/64 & 54.7\% [42.6, 66.3] & 100.0\% & $<0.001$ ms & none (local) \\
Full cascade & 62/64 & 96.9\% [89.3, 99.1] & 100.0\% & $<5$ ms (95.3\%)$^{*}$ & none during inference \\
\bottomrule
\end{tabular}
\\[2pt]
{\tiny $^{*}$Share of target controls resolved on the lexical path; Pass 4 adds 120 to 280 ms per field.}
\end{table}

\subsection{Per-Category Results and Ablation}
Table~\ref{tab:cat} lists resolution per category and site. The pipeline resolved 62 of 64 target controls (96.9\%), and 57 of 58 (98.3\%; CI [90.9, 99.7]) when the heterogeneous \texttt{website/misc} row is excluded. Auxiliary checks showed 5 of 5 email controls resolved, 18 of 19 (94.7\%; CI [75.4, 99.1]) obfuscated \texttt{textfield*} inputs resolved, and no false fill on 6 credential and card traps or on 1 date input without birth context. The two misses were \texttt{honorific-prefix} on UMich (absent from the 14-key autocomplete map) and \texttt{the\_date} on SelectorsHub, which was rejected because its label carries no birth context.

The cumulative ablation (Fig.~\ref{fig:ablation}) shows where resolution happens: Pass 0 resolves 28.1\%, Pass 1 and 1.5 raise this to 56.3\% (36/64), Pass 2 shortcuts and vetoes to 87.5\% (56/64), Pass 3 to 95.3\% (61/64), and Pass 4 to 96.9\% (62/64). Each tier adds coverage, and Passes 3 and 4 together resolve 6 of the 8 controls left after Pass 2.

\begin{figure}[t]
\centering
\figorbox{fig_ablation.png}{0.80}{1.6cm}
\caption{Cumulative share of the 64 target controls resolved after each tier of the cascade.}
\label{fig:ablation}
\end{figure}

\begin{table}[t]
\caption{Resolution of 10 non-name attribute categories across 5 benchmark sites ($N=177$ controls inspected, $n=64$ targets).}
\label{tab:cat}
\centering
\scriptsize
\begin{tabular}{p{1.7cm}p{3.5cm}ccccc c}
\toprule
\textbf{Key} & \textbf{Observed variants} & \textbf{Robo} & \textbf{UMich} & \textbf{SelHub} & \textbf{Clicker} & \textbf{PassMgr} & \textbf{Total} \\
\midrule
\texttt{organization} & \texttt{05\_company}, \texttt{organization}, \texttt{textfield*} & 1/1 & 1/1 & 4/4 & n/a & 1/1 & 7/7 \\
\texttt{occupation} & \texttt{06position}, \texttt{organization-title} & 1/1 & 1/1 & n/a & n/a & 1/1 & 3/3 \\
\texttt{phone} & \texttt{23cellphon}, \texttt{20homephon}, \texttt{tel-national} & 3/3 & 2/2 & 4/4 & n/a & 2/2 & 11/11 \\
\texttt{birth\_date} & \texttt{66mm}/\texttt{67dd}/\texttt{68yy}, \texttt{bday-*}, \texttt{the\_date} & 3/3 & 4/4 & 1/2 & n/a & 1/1 & 9/10 \\
\texttt{gender} & \texttt{60pers\_sex}, \texttt{sex}, radio group & 1/1 & 1/1 & n/a & 3/3 & n/a$^{\dagger}$ & 5/5 \\
\texttt{province} & \texttt{14adrstate}, \texttt{address-level1} & 1/1 & 1/1 & n/a & n/a & 1/1 & 3/3 \\
\texttt{city} & \texttt{13adr\_city}, \texttt{address-level2} & 1/1 & 1/1 & n/a & n/a & 1/1 & 3/3 \\
\texttt{postal\_code} & \texttt{16addr\_zip}, \texttt{postal-code} & 1/1 & 1/1 & n/a & n/a & 1/1 & 3/3 \\
\texttt{address} & \texttt{10address1/2}, \texttt{15\_country} & 3/3 & 5/5 & 1/1 & 1/1 & 3/3 & 13/13 \\
\texttt{website/misc}$^{\ddagger}$ & \texttt{25web\_site}, \texttt{68\_\_income}, \texttt{01\_\_\_title} & 3/3 & 1/2 & n/a & n/a & 1/1 & 5/6 \\
\midrule
\textbf{Total} & 35+ distinct surface patterns & 18/18 & 18/19 & 10/11 & 4/4 & 12/12 & \textbf{62/64} \\
\bottomrule
\end{tabular}
\\[2pt]
{\tiny $^{\dagger}$PassMgr UK has no gender field. $^{\ddagger}$Groups website, income, and title controls; UMich denominator 19 includes \texttt{honorific-prefix}.}
\end{table}

\subsection{Indonesian Portals}
To probe generalization beyond English pages, we ran the frozen pipeline on 5 live Indonesian portals (136 controls): Coretax DJP (47), SSCASN BKN (28), OSS BKPM (9), SMK Semen Gresik admission (31), and a localized registration simulation (21). All 38 of 38 available identity groups (name, \texttt{nik}, birth date, phone, address) were resolved. Combined with the English core biodata, 98 of 99 individual target sub-inputs were resolved (99.0\%; CI [94.5, 99.8]). The scoped vetoes \texttt{hasIbu} and \texttt{hasAyah} kept the personal name out of the mother-name field on Coretax and the father and mother fields on SMK Semen Gresik, and Pass 2.5 and Pass 4 resolved dynamically generated React identifiers (\texttt{input-145}, \texttt{input-253}) on OSS. These portals were not used to tune any parameter, but they were tested by the authors on their own accounts and without a second annotator, so we treat them as supplementary evidence.

\subsection{Threats to Validity}
\emph{In-sample bias.} The 29-entry abbreviation map follows the 8-character truncation convention seen on RoboForm, so RoboForm (18 targets) is treated as a development set. On the 4 held-out English sites (46 targets) the frozen pipeline reached 95.7\% recall (44/46; CI [85.5, 98.8]). \emph{Parameter tuning.} Pass 2.5 was recalibrated after an audit showed the original configuration could not fire, and the weights and thresholds of Pass 3 were set manually. \emph{Language coverage.} The Pass 4 encoder is trained on English sentence pairs; its behavior on Indonesian narrative labels rests on a small number of verified cases, and a multilingual encoder was not compared. \emph{Scale and setting.} The annotated set is small (64 targets), measured on one device, with category selection by the authors, and the Indonesian pages are a snapshot. \emph{Precision scope.} Precision is computed over annotated targets. A page-level audit of the 113 non-target controls found that generic checkbox and select fallbacks produced 24 unintended fills (page-level precision of 78.4\%), which motivates disabling blind fallbacks.

\section{Discussion: Privacy, Governance, and Readiness}
The architecture removes per-token inference cost and third-party inference egress, but it does not make the system cost-free or automatically compliant. Hosting the encrypted profile repository, backups, and dictionary maintenance when portals change remain recurring costs. Zero egress holds for inference only, because profile attributes still flow from the backend to the extension. A compliance-oriented design therefore also requires a legal basis, explicit consent, a data protection impact assessment, and data-subject rights. GovConnect also does not implement data exchange between government systems; it is a client-side layer that complements such exchange, and responsibility for wrongly filled values on tax or population documents must stay with the user through review before submission.

The principal threats are phishing portals that induce autofill, hidden-field harvesting, third-party page scripts that read filled values, excessive extension permissions, and tampering with model or WebAssembly assets. Planned mitigations are a domain allowlist, visible-field-only filling, minimal permissions, and integrity checks on bundled assets. Table~\ref{tab:audit} summarizes the boundary conditions found during the readiness analysis.

\begin{table}[t]
\caption{Boundary conditions and readiness status of the reference implementation.}
\label{tab:audit}
\centering
\scriptsize
\begin{tabular}{p{2.6cm}p{2.9cm}p{2.0cm}p{4.0cm}}
\toprule
\textbf{Component} & \textbf{Boundary condition} & \textbf{Status} & \textbf{Resolution or next step} \\
\midrule
Pass 3 scoring & Unbounded score ($\sim$1.40) & Resolved & Clamped with $\min(\cdot)$; margin guard on $[0.55,0.60)$ \\
Pass 2.5 BM25 & Cap of 0.52 made tier inactive & Recalibrated & $b{=}0.30$, $\text{avgdl}{=}6.0$, $\tau{=}0.75$; corpus IDF planned \\
Value injection & Silent overwrite, DOM desync & Open & Post-fill check (\texttt{el.value === target}) and non-empty overwrite guard \\
Generic fallbacks & 24 unintended fills on non-target widgets & Open & Disable blind checkbox and select fallback \\
Card expiry & Prefix stripping precedes expiry guard & Open & Apply guard before prefix stripping \\
Schema registry & Domain alias table not bound at runtime & Open & Bind backend mapping into Pass 0 and 1 \\
Composite controls & Joint fields such as \texttt{ttl} (place and date) & Open & Bipartite assignment, header proximity parsing \\
Pass 4 & No margin guard, uncalibrated 0.50 & Open & ROC analysis, multilingual encoder comparison \\
\bottomrule
\end{tabular}
\end{table}

\section{Conclusion and Future Work}
The Hybrid Cascade Pipeline provides preliminary evidence that an ordered combination of W3C lookup, deterministic normalization, scoped vetoes, query-normalized BM25, clamped hybrid scoring, and on-device Sentence-BERT can resolve heterogeneous web form controls accurately and quickly without cloud inference. On 5 English benchmarks it resolved 62 of 64 annotated controls (96.9\% recall) and outperformed native autofill and an n-gram classifier, and a supplementary test on 5 Indonesian portals showed full identity-group coverage. The evidence is limited by a small annotated set, single-annotator labeling, and manually set parameters. Future work comprises: post-fill verification and overwrite protection; ROC-based calibration of the Pass 4 threshold with a multilingual encoder; corpus-derived IDF for Pass 2.5; cascading administrative dropdowns, option-value mapping, and composite fields; a domain allowlist and a full threat model; and profile storage based on verifiable credentials [13].

\paragraph{Ethics and reproducibility.}
All tests used synthetic profiles on publicly accessible pages, and no payload was submitted to a production government system. Benchmark logs, fixtures, and the annotation sheet are preserved in the GovConnect evaluation repository (\url{https://github.com/govconnect/evaluation-data}).

\subsubsection*{Acknowledgments and disclosure.}
The authors thank the maintainers of FastAPI, ONNX Runtime Web, and Transformers.js, and the GovConnect development team. The authors declare no competing interests.

\begin{thebibliography}{13}
\bibitem{spbe} Hermanto, B., et al.: Electronic-Based Government System (SPBE) in Indonesia. J. Theor. Appl. Inf. Technol. 100(12), 4380--4392 (2022)
\bibitem{whatwg} WHATWG: HTML Living Standard, \S4.10.18: Form Controls (2026), \url{https://html.spec.whatwg.org/}
\bibitem{uupdp} Republic of Indonesia: UU No. 27/2022 tentang Pelindungan Data Pribadi. LNRI No. 196 (2022)
\bibitem{gdpr} European Union: Regulation (EU) 2016/679 (GDPR). OJ L 119, pp. 1--88 (2016)
\bibitem{rahm} Rahm, E., Bernstein, P.A.: A survey of schema matching. VLDB J. 10(4), 334--350 (2001)
\bibitem{jaro} Jaro, M.A.: Record-linkage methodology for census matching. J. Am. Stat. Assoc. 84(406), 414--420 (1989)
\bibitem{winkler} Winkler, W.E.: String comparator metrics in record linkage. In: Proc. ASA, pp. 354--359 (1990)
\bibitem{bm25} Robertson, S., Zaragoza, H.: The probabilistic relevance framework: BM25 and beyond. Found. Trends Inf. Retr. 3(4), 333--389 (2009)
\bibitem{chromium} Chromium Project: Autofill heuristics and form parsing infrastructure. Google (2024), \url{https://source.chromium.org/chromium/chromium/src/+/main:components/autofill/}
\bibitem{li} Li, G., et al.: Deep learning for web form understanding. In: Proc. ACM WWW, pp. 1120--1131 (2022)
\bibitem{sbert} Reimers, N., Gurevych, I.: Sentence-BERT: sentence embeddings using Siamese BERT-networks. In: Proc. EMNLP-IJCNLP, pp. 3982--3992 (2019)
\bibitem{minilm} Wang, W., et al.: MiniLM: deep self-attention distillation for task-agnostic compression of pre-trained transformers. In: NeurIPS 33, pp. 5776--5788 (2020)
\bibitem{vc} W3C: Verifiable Credentials Data Model v2.0. W3C Recommendation (2026), \url{https://www.w3.org/TR/vc-data-model-2.0/}
\end{thebibliography}

\end{document}
"""

with open('docs/iclamp/latex/govconnect_lncs_paper.tex', 'w', encoding='utf-8') as f:
    f.write(user_tex)

print("Saved user_tex to docs/iclamp/latex/govconnect_lncs_paper.tex")

