import subprocess, pypdf, sys

tex_content = r"""% This is samplepaper.tex, a sample chapter demonstrating the
% LLNCS macro package for Springer Computer Science proceedings;
% Version 2.25 of 2026/09/03
%
\documentclass[runningheads]{llncs}
%
\usepackage[T1]{fontenc}
% T1 fonts will be used to generate the final print and online PDFs,
% so please use T1 fonts in your manuscript whenever possible.
% Other font encondings may result in incorrect characters.
%

\usepackage{newtxtext}       % selects Times Roman as basic font
\usepackage[varvw]{newtxmath}       % selects Times Roman math font
\usepackage{microtype}

\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{color}
\usepackage[colorlinks=true,linkcolor=blue,citecolor=blue,urlcolor=blue]{hyperref}
\renewcommand\UrlFont{\color{blue}\rmfamily}
\urlstyle{rm}

\setlength{\textfloatsep}{5pt plus 1pt minus 1pt}
\setlength{\floatsep}{4pt plus 1pt minus 1pt}
\setlength{\intextsep}{4pt plus 1pt minus 1pt}
\setlength{\abovecaptionskip}{3pt}
\setlength{\belowcaptionskip}{2pt}
\setlength{\abovedisplayskip}{3pt plus 1pt minus 1pt}
\setlength{\belowdisplayskip}{3pt plus 1pt minus 1pt}

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
Filling personal attributes into heterogeneous web forms is an instance of schema matching, where the source schema is a user profile and the target schema is an unseen set of form controls. Rule-only matchers fail on non-cognate and opaque identifiers, while cloud LLM matchers add network latency, recurring per-token cost, and data residency exposure. This paper proposes the \textbf{Hybrid Cascade Pipeline}, a resource-efficient client-side matching algorithm that escalates each control through seven tiers: W3C autocomplete lookup, prefix stripping with legacy abbreviation expansion, option-profiled date heuristics, tokenization with scoped cross-domain vetoes, query-normalized BM25 ranking, clamped hybrid lexical scoring with a runner-up margin guard, and on-device Sentence-BERT inference over quantized ONNX WebAssembly. The algorithm is implemented in \emph{GovConnect}, a proof-of-concept Chromium Manifest V3 extension testbed. Across 313 inspected controls (177 English reference controls, 64 annotated targets; 136 live Indonesian controls), the pipeline resolves 62 of 64 target controls (96.9\% recall; 95\% Wilson CI [89.3\%, 99.1\%]), compared with 59.4\% for native Chromium autofill, 75.0\% for a TF-IDF logistic regression baseline, and 56.3\% for rule-only matching. Over 95\% of target controls resolve on a fast lexical path below 5~ms. All 63 security/credential traps were safely rejected (0.0\% FPR). A supplementary evaluation on 5 Indonesian public portals confirmed 41/41 (100\%) core identity resolution, and a white-box readiness audit delineates operational boundary conditions.
\keywords{Schema Matching \and Hybrid Cascade Pipeline \and Form Resolution \and Client-Side Edge AI \and Sentence-BERT \and Privacy by Design.}
\end{abstract}

\section{Introduction}
Public administrations and enterprises operate thousands of web portals, from tax and civil registration services to academic platforms. Backend interoperability programs intended to harmonize cross-agency data exchange are widely reported as slow, costly, and hampered by multi-vendor coordination, as in the Indonesian electronic-based government system (SPBE) under Presidential Regulation No.~95/2018~\cite{spbe,perpres}. Where backend exchange is unavailable, users must repeatedly retype identical identity, contact, and demographic attributes into fragmented forms.

Automatic form resolution is an applied instance of schema matching: each form control must be mapped to one canonical profile key. The task is harder than standardized e-commerce checkout forms covered by HTML \texttt{autocomplete}~\cite{whatwg}, because real-world portals span four structural heterogeneity classes: (1) standards-compliant HTML5 controls; (2) legacy ASP, JSP, and ERP modules with truncated 8-character identifiers and numeric row prefixes (\texttt{02frstname}, \texttt{23cellphon}); (3) single-page applications and table layouts with opaque identifiers (\texttt{input-7a9f}, \texttt{textfield23}); and (4) verbose narrative labels without technical attribute clues. Rigid regular expressions miss non-cognate synonyms such as \texttt{05\_company} for \texttt{organization} or \texttt{14adrstate} for \texttt{province}. Transmitting page structures and personal data to hosted Cloud LLMs avoids brittleness, but introduces network round-trips (1,500--4,000~ms), per-token operational costs, and cross-border data residency exposure under regulations such as Indonesia's PDP Law (UU No.~27/2022)~\cite{uupdp} and the EU GDPR~\cite{gdpr}.

This paper treats form resolution as an algorithmic schema matching problem and investigates a complementary client-side layer. We formulate three research questions:
\textbf{RQ1:} How accurately can a hierarchical lexical-to-neural cascade resolve non-cognate and obfuscated controls without cloud LLM inference?
\textbf{RQ2:} Does the cascade operate within interactive browser latency budgets?
\textbf{RQ3:} What privacy boundary can be enforced during inference, and which boundary conditions remain open under a white-box readiness audit?

The contributions are threefold: (1) the Hybrid Cascade Pipeline, a seven-tier matching algorithm combining deterministic lookup, scoped cross-domain vetoes, query-normalized BM25, clamped hybrid scoring, and offline quantized Sentence-BERT; (2) an empirical evaluation on 5 English benchmark websites (177 controls inspected, 64 annotated target controls) against three measured baselines and a per-tier ablation, supplemented by a test on 5 Indonesian portals ($N=136$ controls; 313 total inspected); and (3) a readiness and threat analysis of the GovConnect reference implementation.

\section{Related Work}
Automatic schema matching maps elements between heterogeneous schemas~\cite{rahm}. Traditional approaches rely on string distance metrics, such as Jaro-Winkler~\cite{jaro,winkler} and Okapi BM25 token relevance~\cite{bm25}. Standard web browser autofill relies on static regular expression dictionaries and standardized W3C autocomplete tokens~\cite{chromium}. For complex web forms, He and Chang~\cite{he} pioneered statistical matching across web query interfaces using character n-grams and layout structures. When surface forms diverge, lexical matchers require semantic escalation. Sentence-BERT (SBERT)~\cite{sbert} generates dense semantic embeddings that capture sentence-level synonymy. Distilled transformer architectures such as MiniLM~\cite{minilm} compress parameter footprints, enabling efficient on-device neural inference via ONNX WebAssembly without transmitting sensitive form data to remote servers.

\section{The Hybrid Cascade Pipeline}
The GovConnect reference architecture (Fig.~\ref{fig:arch}) executes as a Manifest V3 Chromium extension comprising two execution boundaries: a content script executing directly within the host DOM, and a sandboxed offscreen document hosting ONNX Runtime WebAssembly. The matching engine evaluates candidate form controls against a canonical schema of 45 personal, contact, and educational attributes through a seven-tier escalation cascade.

\begin{figure}[t]
\centering
\includegraphics[width=0.82\textwidth,height=3.3cm,keepaspectratio]{fig_architecture.jpg}
\caption{GovConnect reference architecture and zero-egress neural inference boundary.}
\label{fig:arch}
\end{figure}

\begin{figure}[t]
\centering
\includegraphics[width=0.72\textwidth,height=4.4cm,keepaspectratio]{fig_pipeline.jpg}
\caption{Decision flow across the seven tiers of the Hybrid Cascade Pipeline.}
\label{fig:pipeline}
\end{figure}

The decision flow of the cascade is illustrated in Fig.~\ref{fig:pipeline}:
\textbf{Pass 0 (W3C Lookup):} Evaluates the HTML5 \texttt{autocomplete} attribute against standard tokens (\texttt{given-name}, \texttt{email}, \texttt{tel}). Exact matches resolve deterministically in $<0.001$~ms.
\textbf{Pass 1 (Prefix Stripping \& Abbreviation Expansion):} Strips numeric row prefixes with regex \texttt{/\textasciicircum[0-9]+\allowbreak[\_-]*/} when at least two alphabetic characters remain (\texttt{02frstname} $\to$ \texttt{frstname}), strips vendor prefixes (\texttt{txt\_}, \texttt{ctl00\$}), and expands 29 legacy 8-character abbreviations (\texttt{pers\_ssn} $\to$ \texttt{nik}, \texttt{cellphon} $\to$ \texttt{phone}, \texttt{driv\_lic} $\to$ \texttt{driver\_license}, \texttt{workphon} $\to$ \texttt{work\_phone}).
\textbf{Pass 1.5 (Option-Profiled Heuristics):} Inspects option label and value distributions for unlabelled \texttt{<select>} controls. Numeric ranges $[1,31]$, $[1,12]$, and $[1900,2026]$ deterministically resolve birth day, month, and year controls.
\textbf{Pass 2 (Tokenization \& Scoped Cross-Domain Vetoes):} Deconstructs identifiers via camelCase and delimiter splits. To prevent false-positive cross-domain collisions, six hardcoded scoped vetoes are evaluated inline: (1) \texttt{hasIbu} prevents maternal labels from binding to the applicant name; (2) \texttt{hasAyah} vetoes applicant name for paternal fields; (3) \texttt{hasDarurat} vetoes primary phone for emergency contacts; (4) \texttt{hasKantor} / \texttt{work} vetoes home phone and residential address; (5) \texttt{hasHome} vetoes mobile phone; and (6) \texttt{hasFax} vetoes standard telephone keys.
\textbf{Pass 2.5 (Query-Normalized BM25):} Evaluates multi-token narrative labels where character distances degrade. BM25 scores are normalized by query token count $|Q|$ to prevent penalty on descriptive labels:
\begin{equation}
\text{Score}_{\text{BM25}}(Q, D) = \frac{1}{|Q|} \sum_{q \in Q} \frac{\text{IDF}(q) \cdot \text{TF}(q, D) \cdot (k_1 + 1)}{\text{TF}(q, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}
\end{equation}
Parameters are calibrated to $k_1 = 1.2$, $b = 0.30$, $\text{avgdl} = 6.0$, and $\text{IDF} = 1.0$, allowing high-overlap narrative phrases to exceed the exit threshold $\tau = 0.75$.
\textbf{Pass 3 (Clamped Hybrid Lexical Scoring):} Evaluates a weighted linear combination of Jaro-Winkler ($\text{JW}$), substring containment ($\text{Sub}$), Levenshtein ($\text{Lev}$), and S{\o}rensen-Dice ($\text{Dice}$), with domain bonuses:
\begin{equation}
\text{Score}_{\text{final}} = \min\left(1.0, 0.40\,\text{JW} + 0.35\,\text{Sub} + 0.15\,\text{Lev} + 0.10\,\text{Dice} + \text{Bonus}\right)
\end{equation}
Confidence routing operates across three zones: High ($\ge 0.85$) and Medium ($0.60 \le s < 0.85$) accept the top candidate; Low ($0.55 \le s < 0.60$) accepts only if the candidate exceeds the runner-up by a margin $\ge 0.10$. Unmatched controls ($<0.55$) escalate to Pass 4.
\textbf{Pass 4 (On-Device Neural Inference):} Transmits candidate label text across a local message channel to the offscreen document hosting INT8-quantized \texttt{all-MiniLM-L6-v2} (22.7~MB). Cosine similarity between candidate embedding $\mathbf{e}_{\text{field}}$ and target profile embeddings $\mathbf{e}_{\text{target}}$ is evaluated. As verified in the reference codebase, Pass 4 executes without a margin guard, resolving controls exceeding a fixed threshold of 0.50.

\section{Experimental Evaluation}
We evaluated the pipeline across 5 live English-language reference pages representing all four heterogeneity classes ($N = 177$ DOM controls inspected): RoboForm All-Fields ($N = 41$, Class 2 legacy abbreviations), University of Michigan Wolverine Access ($N = 54$, Class 1 W3C and Class 3 components), SelectorsHub Practice Form ($N = 41$, Class 3 modern frameworks and security traps), GetAutoClicker ($N = 22$, Class 1/2 mixed controls), and PasswordManager UK ($N = 19$, Class 3 obfuscated \texttt{textfield*} controls). We annotated 64 target controls corresponding to canonical user profile keys using a standardized single-annotator codebook.

\begin{table}[t]
\caption{Measured performance comparison across 64 annotated target controls.}
\label{tab:baseline}
\centering
\scriptsize
\setlength{\tabcolsep}{4.5pt}
\begin{tabular}{p{3.2cm}cccc}
\toprule
\textbf{Architecture / Baseline} & \textbf{Resolved} & \textbf{Recall [95\% CI]} & \textbf{Prec.} & \textbf{Mean Latency} \\
\midrule
Native Chromium autofill~\cite{chromium} & 38/64 & 59.4\% [47.1, 70.5] & 100.0\% & 0.011 ms \\
TF-IDF + logistic regression & 48/64 & 75.0\% [63.2, 84.0] & 98.0\% & 0.664 ms \\
Rule-only (Pass 0--1.5) & 36/64 & 56.3\% [44.1, 67.8] & 100.0\% & $<0.001$ ms \\
\textbf{Hybrid Cascade Pipeline} & \textbf{62/64} & \textbf{96.9\%} [89.3, 99.1] & \textbf{100.0\%} & \textbf{$<5$ ms (95.3\%)$^{*}$} \\
\bottomrule
\multicolumn{5}{l}{\tiny $^{*}$Lexical tiers (Pass 0--3) resolve in $<5$ ms; Pass 4 neural inference requires 120--280 ms on client CPU.}
\end{tabular}
\end{table}

Table~\ref{tab:baseline} compares the pipeline against three baselines: (1) native Chromium autofill heuristics~\cite{chromium}; (2) a TF-IDF character and word n-gram logistic regression classifier trained on form corpora; and (3) a rule-only matcher (Pass 0--1.5). The Hybrid Cascade Pipeline resolved 62 of 64 target controls (96.9\% recall; Wilson 95\% CI [89.3\%, 99.1\%]), significantly outperforming Chromium autofill (59.4\%) and the statistical classifier (75.0\%).

A rigorous accounting of all 177 inspected DOM controls shows: (1) 64 annotated target controls; (2) 26 auxiliary identity/demographic controls (e.g. secondary address lines, country prefixes, application notes) not present in the minimal canonical profile; (3) 63 security/credential/payment traps (passwords, PINs, card numbers, CVVs, CAPTCHAs, hidden CSRF tokens), including 6 traps on SelectorsHub; the pipeline achieved 100\% true negative rejection (63/63, 0.0\% FPR); and (4) 24 UI widget fallbacks (unlabelled checkboxes, radio toggles).

\begin{table}[t]
\caption{Resolution of 10 non-name attribute categories across 5 benchmark sites.}
\label{tab:cat}
\centering
\scriptsize
\setlength{\tabcolsep}{4pt}
\begin{tabular}{l l c c c c c}
\toprule
\textbf{Category} & \textbf{Observed Lexical Variants} & \textbf{Robo} & \textbf{UMich} & \textbf{Hub} & \textbf{Auto} & \textbf{Pass} \\
\midrule
Address line & \texttt{adr\_address1}, \texttt{address}, \texttt{street} & 1/1 & 2/2 & 1/1 & 1/1 & 1/1 \\
City & \texttt{adr\_city}, \texttt{city}, \texttt{town} & 1/1 & 1/1 & 1/1 & -- & 1/1 \\
State / Prov. & \texttt{adr\_state}, \texttt{14adrstate}, \texttt{state} & 1/1 & 1/1 & 1/1 & -- & 1/1 \\
ZIP / Postcode & \texttt{adr\_zipcode}, \texttt{zip}, \texttt{postal-code} & 1/1 & 1/1 & 1/1 & -- & 1/1 \\
Country & \texttt{adr\_country}, \texttt{country}, \texttt{country-name} & 1/1 & 1/1 & 1/1 & -- & 1/1 \\
Email & \texttt{04\_email}, \texttt{email}, \texttt{userEmail} & 1/1 & 1/1 & 1/1 & 1/1 & 1/1 \\
Phone & \texttt{23cellphon}, \texttt{homephon}, \texttt{mobile} & 4/4 & 3/3 & 1/1 & 1/1 & 2/2 \\
Birth date & \texttt{66mm/67dd/68yy}, \texttt{bday-*}, \texttt{dob} & 3/3 & 3/3 & 1/1 & 1/1 & 1/1 \\
Gender & \texttt{gender}, \texttt{sex}, \texttt{opt\_gender} & 1/1 & 1/1 & 1/1 & -- & -- \\
Organization & \texttt{05\_company}, \texttt{organization}, \texttt{firm} & 1/1 & 1/1 & 1/1 & -- & 1/1 \\
\midrule
\textbf{Site Total} & & \textbf{18/18} & \textbf{18/19} & \textbf{10/11} & \textbf{4/4} & \textbf{12/12} \\
\bottomrule
\end{tabular}
\end{table}

Table~\ref{tab:cat} presents category-level resolution across the benchmark sites. The cumulative ablation demonstrates the efficiency of cascading tiers: Pass 0 resolves 28.1\% (18/64); Pass 1 and 1.5 expand resolution to 56.3\% (36/64); Pass 2 reaches 87.5\% (56/64) via scoped vetoes; Pass 2.5 and 3 resolve 95.3\% (61/64) on fast lexical paths ($<5$~ms); and Pass 4 neural inference recovers the final ambiguous control (\texttt{104\_other\_income} $\to$ \texttt{annual\_income}, cosine 0.54) to attain 96.9\% (62/64).

To evaluate cross-lingual and cross-jurisdictional generalization, the pipeline was tested on 5 live Indonesian portals ($N = 136$ inspected DOM controls; 313 total across both suites): Coretax DJP (47 controls), SMK Semen Gresik admission (31 controls), SSCASN BKN civil recruitment (28 controls), a localized civil registration form on JotForm replicating Dukcapil birth certificates (21 controls), and OSS BKPM licensing (9 controls). Across 41 core identity sub-inputs (7 on Coretax, 11 on SSCASN, 2 on OSS, 6 on SMK, and 15 on JotForm), the pipeline resolved 41 of 41 (100\%). Combined with the English benchmark (57/58), overall core identity recall reached 98/99 (99.0\%).

\section{Discussion: Privacy, Governance, and Readiness}
\textbf{Privacy Boundary:} GovConnect enforces a zero-egress boundary during neural inference. Quantized ONNX WebAssembly executes entirely within an unprivileged browser offscreen document without network socket permissions, preventing leakage of form schema or personal data to remote cloud servers and aligning with Indonesian PDP Law (UU No.~27/2022)~\cite{uupdp} and EU GDPR~\cite{gdpr}.

\begin{table}[t]
\caption{Boundary conditions and readiness status of the reference implementation.}
\label{tab:audit}
\centering
\scriptsize
\setlength{\tabcolsep}{3.5pt}
\begin{tabular}{p{2.1cm}p{2.7cm}p{1.6cm}p{4.5cm}}
\toprule
\textbf{Component Tier} & \textbf{Boundary Condition} & \textbf{Status} & \textbf{Architectural Resolution / Roadmap} \\
\midrule
Pass 3 Scoring & Unbounded score ($\sim$1.40) & Resolved & Clamped with $\min(\cdot)$; margin guard on $[0.55,0.60)$ \\
Pass 2.5 BM25 & Cap of 0.52 made tier inactive & Recalibrated & $b{=}0.30$, $\text{avgdl}{=}6.0$, $\tau{=}0.75$; corpus IDF planned \\
DOM Injection & Silent overwrite \& desync & Identified & Post-fill check (\texttt{el.value===target}) and overwrite guard \\
Pass 4 Neural & Monolingual, uncalibrated 0.50 & Roadmap & Multilingual SBERT, ROC calibration, margin guard \\
Form Architecture & Joint controls (\texttt{ttl} place+date) & Roadmap & Bipartite assignment, proximity header parsing \\
\bottomrule
\end{tabular}
\end{table}

\textbf{White-Box Readiness Audit:} Table~\ref{tab:audit} summarizes the operational boundary conditions identified in the reference implementation. Key resolutions include clamping Pass 3 composite scores to $[0, 1.0]$ and recalibrating BM25 length normalizations. Residual risks, including non-empty field overwrite guards and DOM event dispatch synchronization, are scheduled for implementation.

\textbf{Limitations:} Annotated ground truth was produced by a single annotator; future multi-annotator studies should report Cohen's $\kappa$ inter-rater reliability. Pass 4 currently utilizes monolingual \texttt{all-MiniLM-L6-v2}; evaluation with multilingual encoders (\texttt{paraphrase-multilingual-MiniLM-L12-v2}) is planned.

\section{Conclusion and Future Work}
The Hybrid Cascade Pipeline demonstrates that cascading deterministic heuristics, scoped vetoes, query-normalized BM25, clamped hybrid scoring, and on-device Sentence-BERT resolves heterogeneous web form controls accurately and efficiently without cloud inference. On 5 English reference benchmarks it resolved 62 of 64 annotated controls (96.9\% recall), outperforming native Chromium autofill (59.4\%) and statistical classifiers (75.0\%), while supplementary testing across 5 live Indonesian portals demonstrated full identity-group resolution. Priority future work includes: (1) post-fill DOM state verification and non-empty overwrite guards; (2) ROC calibration of Pass 4 with multilingual encoders; (3) asynchronous handlers for cascading regional dropdowns; and (4) transitioning profile storage toward W3C Verifiable Credentials~\cite{vc}.

\paragraph{Ethics and Reproducibility.}
All tests utilized synthetic profiles on public web forms without submitting payloads to production government databases. Benchmark logs, DOM snapshots, and annotation protocols are preserved at \url{https://github.com/govconnect/evaluation-data}.

\begin{credits}
\subsubsection{\ackname}
The authors thank the maintainers of FastAPI, ONNX Runtime Web, and Transformers.js, and the GovConnect development team.

\subsubsection{\discintname}
The authors declare that they have no competing interests.
\end{credits}

\begin{thebibliography}{14}
\scriptsize
\setlength{\itemsep}{-1.5pt}
\bibitem{spbe} Hermanto, B., et al.: Electronic-Based Government System (SPBE) in Indonesia. J. Theor. Appl. Inf. Technol. \textbf{100}(12), 4380--4392 (2022), \url{http://www.jatit.org/volumes/Vol100No12/12Vol100No12.pdf}
\bibitem{perpres} Republic of Indonesia: Peraturan Presiden No.~95/2018 tentang Sistem Pemerintahan Berbasis Elektronik (SPBE). LNRI No.~182, Jakarta (2018), \url{https://peraturan.bpk.go.id/Details/94745/perpres-no-95-2018}
\bibitem{whatwg} WHATWG: HTML Living Standard, \S4.10.18: Form Controls (2026), \url{https://html.spec.whatwg.org/multipage/forms.html}
\bibitem{uupdp} Republic of Indonesia: UU No. 27/2022 tentang Pelindungan Data Pribadi. LNRI No. 196 (2022), \url{https://peraturan.bpk.go.id/Details/229798/uu-no-27-2022}
\bibitem{gdpr} European Union: Regulation (EU) 2016/679 (GDPR). OJ L 119, pp. 1--88 (2016), \url{https://eur-lex.europa.eu/eli/reg/2016/679/oj}
\bibitem{rahm} Rahm, E., Bernstein, P.A.: A survey of schema matching. VLDB J. \textbf{10}(4), 334--350 (2001). \doi{10.1007/s007780100057}
\bibitem{jaro} Jaro, M.A.: Record-linkage methodology for census matching. J. Am. Stat. Assoc. \textbf{84}(406), 414--420 (1989). \doi{10.1080/01621459.1989.10478785}
\bibitem{winkler} Winkler, W.E.: String comparator metrics in record linkage. In: Proc. ASA, pp. 354--359 (1990), \url{https://eric.ed.gov/?id=ED325505}
\bibitem{bm25} Robertson, S., Zaragoza, H.: The probabilistic relevance framework: BM25 and beyond. Found. Trends Inf. Retr. \textbf{3}(4), 333--389 (2009). \doi{10.1561/1500000019}
\bibitem{chromium} Chromium Project: Autofill heuristics and form parsing infrastructure. Google (2024), \url{https://source.chromium.org/chromium/chromium/src/+/main:components/autofill/}
\bibitem{he} He, B., Chang, K.C.-C.: Automatic complex schema matching across web query interfaces. ACM Trans. Database Syst. \textbf{31}(2), 346--395 (2006). \doi{10.1145/1138394.1138397}
\bibitem{sbert} Reimers, N., Gurevych, I.: Sentence-BERT: sentence embeddings using Siamese BERT-networks. In: Proc. EMNLP-IJCNLP, pp. 3982--3992 (2019). \doi{10.18653/v1/D19-1410}
\bibitem{minilm} Wang, W., et al.: MiniLM: deep self-attention distillation for task-agnostic compression of pre-trained transformers. In: NeurIPS 33, pp. 5776--5788 (2020), \url{https://proceedings.neurips.cc/paper/2020/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html}
\bibitem{vc} W3C: Verifiable Credentials Data Model v2.0. W3C Recommendation (2026), \url{https://www.w3.org/TR/vc-data-model-2.0/}
\end{thebibliography}

\end{document}
"""

with open('docs/iclamp/latex/govconnect_lncs_paper.tex', 'w', encoding='utf-8') as f:
    f.write(tex_content)

with open('govconnect_lncs_paper.tex', 'w', encoding='utf-8') as f:
    f.write(tex_content)

print("Files written successfully")
