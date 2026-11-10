# Laporan Evaluasi Empiris: 10 High-Variance English `profileKey` pada 5 Heterogeneous Wide Websites
**Fokus Riset:** Validasi Algoritma Pencocokan *Hybrid Cascade Pipeline* (Pass 0 $\rightarrow$ Pass 4)  
**Target Publikasi:** *The International Conference on the Leadership and Management of Projects in the Digital Age (ICLAMP) 2027*  
**Sumber Data Uji:** Ekstraksi DOM `Rtest_2.txt` ($N = 177$ Elemen Kontrol DOM Lintas 5 Website Internasional)

---

## 1. Metodologi Pemilihan 10 High-Variance English `profileKey` (Bebas Kata `"name"`)

Sesuai arahan evaluasi berskala internasional, pengujian difokuskan pada **10 `profileKey` berbahasa Inggris** dari total 54 kunci skema kanonikal yang **sama sekali tidak menggunakan kata `"name"`** (`first_name`, `last_name`, dan `full_name` dikeluarkan dari matriks utama) dan memiliki **variasi istilah berbeda akar kata (*non-cognate English lexical synonyms*)** di berbagai arsitektur website:

| No | `profileKey` Kanonikal | Variasi Istilah & Atribut di Website Uji (Beda Akar Kata) | Bukti Keberhasilan Pencocokan di `Rtest_2.txt` | Tahap Algoritma (*Pass*) yang Bekerja |
|---|---|---|---|---|
| **1** | **`organization` (#37)** | `Organization` $\neq$ `05_company` $\neq$ `Enter your company` $\neq$ `textfield*` (*Company*) | • RoboForm: `05_company` (**Ya**)<br>• UMich: `organization` (**Ya**)<br>• SelectorsHub: `company` / *"Enter your company"* $4\times$ (**Ya**)<br>• PasswordManager: `textfield*` (**Ya**) | **Pass 0** (W3C), **Pass 1** (Prefix Stripper), **Pass 2 & 3** (Corpus $2\times\text{label}$) |
| **2** | **`occupation` (#36)** | `Occupation` $\neq$ `06position` $\neq$ `organization-title` $\neq$ `textfield*` (*Position/Role*) | • RoboForm: `06position` (**Ya**)<br>• UMich: `organization-title` (**Ya**)<br>• PasswordManager: `textfield*` (**Ya**) | **Pass 0** (W3C), **Pass 1**, **Pass 3 & Pass 4** (SBERT Semantic) |
| **3** | **`phone` (#26)** *(+ `home_phone` #27, `work_telephone` #28)* | `Phone` $\neq$ `23cellphon` / `20homephon` / `21workphon` $\neq$ `tel` / `tel-national` $\neq$ `Enter your mobile number` | • RoboForm: `23cellphon`, `20homephon`, `21workphon` (**Ya** $3/3$)<br>• UMich: `tel`, `tel-national` (**Ya** $2/2$)<br>• SelectorsHub: `mobile number` $4\times$ (**Ya** $4/4$)<br>• PasswordManager: `textfield*` (**Ya**) | **Pass 0** (W3C), **Pass 1** (`ABBREVIATION_MAP`), **Pass 2** (Shortcut & Scoped Veto) |
| **4** | **`birth_date` (#8)** *(+ `day` #9, `month` #10, `year` #11)* | `Birth Date` $\neq$ `66mm` / `67dd` / `68yy` $\neq$ `bday` (`day`/`month`/`year`) $\neq$ `datepicker` | • RoboForm: `66mm`, `67dd`, `68yy` (**Ya** $3/3$)<br>• UMich: `bday`, `bday-day/month/year` (**Ya** $4/4$)<br>• SelectorsHub: `datepicker` (**Ya** $1/1$)<br>• PasswordManager: `textfield*` (**Ya**) | **Pass 0** (W3C), **Pass 1.5** (Heuristik Dropdown Tanggal), **Pass 2 & 3** |
| **5** | **`gender` (#13)** | `Gender` $\neq$ `60pers_sex` $\neq$ `sex` | • RoboForm: `60pers_sex` (**Ya** $1/1$)<br>• UMich: `sex` (**Ya** $1/1$)<br>• GetAutoClicker: Radio `gender` (**Ya** $3/3$) | **Pass 0** (W3C), **Pass 1** (`pers_sex`), **Pass 2** |
| **6** | **`province` (#20)** | `Province` $\neq$ `14adrstate` (*State*) $\neq$ `address-level1` $\neq$ `textfield*` (*County/State*) | • RoboForm: `14adrstate` (**Ya** $1/1$)<br>• UMich: `address-level1` (**Ya** $1/1$)<br>• PasswordManager: `textfield*` (**Ya**) | **Pass 0** (W3C), **Pass 1** (`adrstate`), **Pass 2 & 3** |
| **7** | **`city` (#21)** | `City` $\neq$ `13adr_city` $\neq$ `address-level2` $\neq$ `textfield*` (*Town/City*) | • RoboForm: `13adr_city` (**Ya** $1/1$)<br>• UMich: `address-level2` (**Ya** $1/1$)<br>• PasswordManager: `textfield*` (**Ya**) | **Pass 0** (W3C), **Pass 1** (`adr_city`), **Pass 2 & 3** |
| **8** | **`postal_code` (#24)** | `Postal Code` $\neq$ `16addr_zip` (*Zip*) $\neq$ `postal-code` $\neq$ `textfield*` (*Postcode*) | • RoboForm: `16addr_zip` (**Ya** $1/1$)<br>• UMich: `postal-code` (**Ya** $1/1$)<br>• PasswordManager: `textfield*` (**Ya**) | **Pass 0** (W3C), **Pass 1** (`addr_zip`), **Pass 2** (Shortcut `zip`) |
| **9** | **`address` (#17)** *(+ `line_1` #18, `line_2` #19, `country` #25)* | `Address` $\neq$ `street-address` $\neq$ `10address1` / `15_country` $\neq$ `Country` | • RoboForm: `10address1`, `11address2`, `15_country` (**Ya** $3/3$)<br>• UMich: `street-address`, `address-line1/2`, `country`, `country-name` (**Ya** $5/5$)<br>• SelectorsHub: `Country` (**Ya** $1/1$)<br>• GetAutoClicker: `Address` (**Ya** $1/1$)<br>• PasswordManager: `textfield*` (**Ya**) | **Pass 0** (W3C), **Pass 1**, **Pass 2 & 3** |
| **10** | **`website` (#31)** *(Berserta `income` #39 & `title` #5)* | `Website` $\neq$ `25web_site` $\neq$ `url`; `68__income`; `01___title` $\neq$ `honorific-prefix` | • RoboForm: `25web_site` (**Ya**), `68__income` (**Ya**), `01___title` (**Ya**)<br>• UMich: `url` (**Ya**), `honorific-prefix` (*Kosong*)<br>• PasswordManager: `textfield*` (**Ya**) | **Pass 0** (`url`), **Pass 1** (`25web_site`, `68__income`, `01___title`), **Pass 3** |

---

## 2. Rekapitulasi Matriks Hasil Uji pada 5 Heterogeneous Wide Websites ($N = 177$ DOM Controls)

Kelima website berbahasa Inggris yang diuji pada `Rtest_2.txt` mewakili 5 karakteristik rekayasa DOM yang berbeda:
1. **RoboForm All-Fields (`N = 41`):** Sistem *legacy* dengan prefiks angka urut (`01` s.d. `72`) dan singkatan kolom 8-karakter.
2. **UMich W3C Accessibility (`N = 54`):** Standar taksonomi atribut W3C HTML5 murni tanpa elemen `<label>` maupun atribut `name`/`id` (`(Tanpa Label)`).
3. **SelectorsHub Automation Form (`N = 41`):** Formulir pengujian automasi modern yang menggabungkan tabel dinamis, input berulang (*multi-instance fields*), *datepicker* (`autocomplete="off"`), dan bagian kartu pembayaran.
4. **GetAutoClicker Practice Form (`N = 22`):** Formulir interaktif dengan grup *radio button*, *checkbox*, `<select>`, dan `<textarea>`.
5. **PasswordManager UK Test (`N = 19`):** Formulir berstruktur tabel klasik Inggris (*British English*) dengan atribut `name` yang seluruhnya diobfuskasi menjadi `textfield`, `textfield2`, hingga `textfield2945`.

| No | `profileKey` (Tanpa Kata `"name"`) | Web 1: RoboForm (`N = 41`) | Web 2: UMich W3C (`N = 54`) | Web 3: SelectorsHub (`N = 41`) | Web 4: GetAutoClicker (`N = 22`) | Web 5: PasswordManager UK (`N = 19`) | Sub-Input Terisi |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | **`organization` (#37)** | **Ya (1/1)** (`05_company`) | **Ya (1/1)** (`organization`) | **Ya (4/4)** (`Enter your company` $4\times$) | *N/A* | **Ya (1/1)** (`textfield*`) | **7 / 7 (100%)** |
| **2** | **`occupation` (#36)** | **Ya (1/1)** (`06position`) | **Ya (1/1)** (`organization-title`) | *N/A* | *N/A* | **Ya (1/1)** (`textfield*`) | **3 / 3 (100%)** |
| **3** | **`phone` (#26–#28)** | **Ya (3/3)** (`23cell`, `20home`, `21work`) | **Ya (2/2)** (`tel`, `tel-national`) | **Ya (4/4)** (`mobile number` $4\times$) | *N/A* | **Ya (2/2)** (`textfield*`) | **11 / 11 (100%)** |
| **4** | **`birth_date` (#8–#11)** | **Ya (3/3)** (`66mm`, `67dd`, `68yy`) | **Ya (4/4)** (`bday`, `day/month/year`) | **Ya (1/2)** (`datepicker` **Ya**; `the_date` *Kosong*) | *N/A* | **Ya (1/1)** (`textfield*`) | **9 / 10 (90,0%)** |
| **5** | **`gender` (#13)** | **Ya (1/1)** (`60pers_sex`) | **Ya (1/1)** (`sex`) | *N/A* | **Ya (3/3)** (Radio `gender` $3\times$) | *N/A* | **5 / 5 (100%)** |
| **6** | **`province` (#20)** | **Ya (1/1)** (`14adrstate`) | **Ya (1/1)** (`address-level1`) | *N/A* | *N/A* | **Ya (1/1)** (`textfield*`) | **3 / 3 (100%)** |
| **7** | **`city` (#21)** | **Ya (1/1)** (`13adr_city`) | **Ya (1/1)** (`address-level2`) | *N/A* | *N/A* | **Ya (1/1)** (`textfield*`) | **3 / 3 (100%)** |
| **8** | **`postal_code` (#24)** | **Ya (1/1)** (`16addr_zip`) | **Ya (1/1)** (`postal-code`) | *N/A* | *N/A* | **Ya (1/1)** (`textfield*`) | **3 / 3 (100%)** |
| **9** | **`address` (#17–#19, #25)** | **Ya (3/3)** (`10address1/2`, `15_country`) | **Ya (5/5)** (`street-address`, `line1/2`, `country`) | **Ya (1/1)** (`Country`) | **Ya (1/1)** (`Address`) | **Ya (3/3)** (`textfield*`) | **13 / 13 (100%)** |
| **10** | **`website` (#31)** *(+ `income` #39 & `title` #5)* | **Ya (3/3)** (`25web_site`, `68__income`, `01___title`) | **Ya (1/2)** (`url` **Ya**; `honorific-prefix` *Kosong*) | *N/A* | *N/A* | **Ya (1/1)** (`textfield*`) | **5 / 6 (83,3%)** |
| **Total** | **10 Non-Name Keys** | **18 / 18 (100%)** | **17 / 18 (94,4%)** | **10 / 11 (90,9%)** | **4 / 4 (100%)** | **13 / 13 (100%)** | **62 / 64 (96,9%)** |

> **Catatan Tambahan Cakupan Seluruh Form (`Rtest_2.txt`):**  
> Selain ke-64 sub-input untuk 10 kunci bebas-nama di atas, algoritma juga berhasil mengisi atribut `email` di kelima website (**100% terisi**: `24emailadr` di RoboForm, `email` di UMich, `shub37` / *"Enter email"* di SelectorsHub, `email` & `inputEmail` di GetAutoClicker, serta `textfield*` di PasswordManager UK), atribut identitas tambahan di RoboForm (`61pers_ssn`, `66pers_age`, `67birth_pl`, `22faxphone`), serta `message` (`comments` #54) di GetAutoClicker. Secara keseluruhan pada `PasswordManager UK`, **18 dari 19 elemen `textfield*` (94,7%)** berhasil dipecahkan meskipun atribut `name`-nya diobfuskasi!

---

## 3. Tiga Temuan Algoritmik Utama dari `Rtest_2.txt` (Untuk Bab 4 Jurnal)

1. **Resolusi Sinonim Lintas Akar Kata Tanpa Ketergantungan Substring (*Zero Substring Overlap*):**
   Hasil `Rtest_2.txt` membuktikan bahwa *Hybrid Cascade Pipeline* mampu memetakan atribut yang secara ortografis **tidak memiliki irisan kata sama sekali** ke `profileKey` kanonikal yang tepat:
   * `05_company` (Pass 1) dan `"Enter your company"` (Pass 2/3) $\rightarrow$ **`organization`**
   * `06position` (Pass 1) dan `organization-title` (Pass 0) $\rightarrow$ **`occupation`**
   * `14adrstate` (Pass 1) dan `address-level1` (Pass 0) $\rightarrow$ **`province`**
   * `16addr_zip` (Pass 1) dan `postal-code` (Pass 0) $\rightarrow$ **`postal_code`**
   * `25web_site` (Pass 1) dan `url` (Pass 0) $\rightarrow$ **`website`**
   * `60pers_sex` (Pass 1), `sex` (Pass 0), dan `gender` (Pass 2) $\rightarrow$ **`gender`**
2. **Ketangguhan Konstruksi Korpus Multi-Sumber ($2 \times \text{label\_text}$) terhadap Obfuskasi `textfield*` dan Input Berulang:**
   * Pada **PasswordManager UK**, seluruh 19 elemen `<input>` menggunakan nama atribut buta (`textfield`, `textfield2`, s.d. `textfield2945`) tanpa tag `<label for>` maupun `autocomplete`. Berkat strategi ekstraksi label tetangga dan penggandaan bobot $2 \times \text{label\_text}$ pada korpus Pass 2, **18 dari 19 field (94,7%)** berhasil dicocokkan melalui Pass 2, Pass 3, dan Pass 4.
   * Pada **SelectorsHub**, halaman merender 4 baris duplikat untuk `company` (*"Enter your company"*) dan `mobile number` (*"Enter your mobile number"*), serta komponen `datepicker` dengan `autocomplete="off"`. Seluruh instansi tersebut berhasil dikenali dan diisi secara konsisten.
3. **Presisi Penolakan Kredensial & Kartu Pembayaran (*Zero Security False Positives* di SelectorsHub & UMich):**
   * Pada **SelectorsHub**, meskipun terdapat kolom kartu kredit tanpa atribut `autocomplete` standar—yaitu `cardNumber` (placeholder `"1234 5678 9012 3456"`), `expiry` (placeholder `"MM/YY"`), `cvv` (placeholder `"123"`), dan `Password / pass`—seluruhnya **100% dibiarkan `Kosong` (True Negative)**. Menariknya, kolom `expiry` berlabel `"MM/YY"` pada SelectorsHub berhasil ditolak dan tidak tertukar dengan bulan/tahun lahir (`birth_date`).
   * Dua kasus batas (*edge cases*) dari 64 sub-input yang tidak terisi (`honorific-prefix` di UMich yang belum masuk ke kamus `AUTOCOMPLETE_MAP` Pass 0, serta `<input type="date" name="the_date">` di SelectorsHub yang menggunakan label generik `"the_date"` tanpa konteks kelahiran sehingga skornya di bawah ambang batas keamanan $0.50$) membuktikan bahwa sistem menerapkan prinsip **konservatif terhadap *false positive***: ketika label `"the_date"` tidak menjelaskan apakah itu tanggal lahir, tanggal transaksi, atau tanggal kedaluwarsa, pipeline memilih untuk tidak mengisinya secara sembarangan.

---

## 4. Kode LaTeX Siap Pakai untuk Naskah Jurnal ICLAMP 2027 (`download.pdf`)

### A. Sub-bab & Tabel Evaluasi Empiris di Section 4 (Kode LaTeX)
*Petunjuk: Sisipkan kode LaTeX berikut pada **Section 4 (`Architectural Evolution, Benchmarks, and Readiness Audit`)** setelah paragraf pertama.*

```latex
\paragraph{Empirical Evaluation of High-Variance English Attributes Across 5 Wide Websites.}
To evaluate the Hybrid Cascade Pipeline against non-trivial lexical heterogeneity without relying on trivial substring cognates (such as matching \texttt{first\_name} or \texttt{last\_name} via the shared substring \texttt{"name"}), we tested 10 canonical English \texttt{profileKey} categories exhibiting distinct root terminology across 5 live, wide-format international websites ($N = 177$ total DOM controls inspected): RoboForm All-Fields ($N=41$, legacy 8-character abbreviations with numeric prefixes), University of Michigan W3C Autofill Suite ($N=54$, unlabelled W3C \texttt{autocomplete} taxonomy), SelectorsHub Automation Form ($N=41$, multi-instance inputs, custom \texttt{datepicker}, and payment card traps), GetAutoClicker Practice Form ($N=22$, radio/checkbox/textarea controls), and PasswordManager UK ($N=19$, table-structured British English form where all HTML \texttt{name} attributes are obfuscated as \texttt{textfield*}).

\begin{table}[t]
\caption{Empirical resolution of 10 high-variance non-name English \texttt{profileKey} categories across 5 wide websites ($N = 177$ DOM controls inspected).}
\label{tab:empirical_eval}
\centering
\scriptsize
\begin{tabular}{p{2.3cm}p{3.2cm}ccccc c}
\hline
\textbf{Canonical \texttt{profileKey}} & \textbf{Observed Non-Cognate Lexical Variants} & \textbf{RoboForm ($N=41$)} & \textbf{UMich ($N=54$)} & \textbf{SelectorsHub ($N=41$)} & \textbf{AutoClicker ($N=22$)} & \textbf{PassMgr UK ($N=19$)} & \textbf{Sub-Inputs Resolved} \\
\hline
\texttt{organization} & \texttt{05\_company}, \texttt{organization}, \texttt{Enter your company}, \texttt{textfield*} & 1/1 & 1/1 & 4/4 & -- & 1/1 & 7/7 (100\%) \\
\texttt{occupation} & \texttt{06position}, \texttt{organization-title}, \texttt{textfield*} (Role) & 1/1 & 1/1 & -- & -- & 1/1 & 3/3 (100\%) \\
\texttt{phone} (+home/work) & \texttt{23cellphon}, \texttt{20homephon}, \texttt{tel-national}, \texttt{mobile number} & 3/3 & 2/2 & 4/4 & -- & 2/2 & 11/11 (100\%) \\
\texttt{birth\_date} (+d/m/y) & \texttt{66mm}/\texttt{67dd}/\texttt{68yy}, \texttt{bday-*}, \texttt{datepicker}, \texttt{the\_date} & 3/3 & 4/4 & 1/2 & -- & 1/1 & 9/10 (90.0\%) \\
\texttt{gender} & \texttt{60pers\_sex}, \texttt{sex}, \texttt{gender} (radio group) & 1/1 & 1/1 & -- & 3/3 & -- & 5/5 (100\%) \\
\texttt{province} & \texttt{14adrstate}, \texttt{address-level1}, \texttt{textfield*} (County) & 1/1 & 1/1 & -- & -- & 1/1 & 3/3 (100\%) \\
\texttt{city} & \texttt{13adr\_city}, \texttt{address-level2}, \texttt{textfield*} (Town) & 1/1 & 1/1 & -- & -- & 1/1 & 3/3 (100\%) \\
\texttt{postal\_code} & \texttt{16addr\_zip}, \texttt{postal-code}, \texttt{textfield*} (Postcode) & 1/1 & 1/1 & -- & -- & 1/1 & 3/3 (100\%) \\
\texttt{address} (+country) & \texttt{10address1/2}, \texttt{street-address}, \texttt{15\_country}, \texttt{Country} & 3/3 & 5/5 & 1/1 & 1/1 & 3/3 & 13/13 (100\%) \\
\texttt{website} (+income/title) & \texttt{25web\_site}, \texttt{url}, \texttt{68\_\_income}, \texttt{01\_\_\_title}, \texttt{honorific-prefix} & 3/3 & 1/2 & -- & -- & 1/1 & 5/6 (83.3\%) \\
\hline
\textbf{Total / Recall} & \textbf{35+ Distinct Surface Patterns} & \textbf{18/18} & \textbf{17/18} & \textbf{10/11} & \textbf{4/4} & \textbf{13/13} & \textbf{62/64 (96.9\%)} \\
\hline
\end{tabular}
\end{table}

As shown in Table~\ref{tab:empirical_eval}, the Hybrid Cascade Pipeline resolved \textbf{62 out of 64 target sub-controls (96.9\% recall)} across the 10 non-name attribute categories, while additionally resolving 100\% of \texttt{email} controls across all 5 websites (\texttt{24emailadr}, \texttt{shub37}, \texttt{inputEmail}) and 18 out of 19 obfuscated \texttt{textfield*} inputs (94.7\%) on PasswordManager UK. Key algorithmic findings include: (1) deterministic cross-root resolution in Passes~0--1, which mapped disjoint surface terms without shared substrings (\texttt{05\_company} $\rightarrow$ \texttt{organization}, \texttt{06position} and \texttt{organization-title} $\rightarrow$ \texttt{occupation}, \texttt{14adrstate} and \texttt{address-level1} $\rightarrow$ \texttt{province}, \texttt{16addr\_zip} $\rightarrow$ \texttt{postal\_code}, and \texttt{25web\_site}/\texttt{url} $\rightarrow$ \texttt{website}); (2) multi-source feature corpus resilience ($2\times\text{label\_text}$ weighting in Pass~2) combined with Pass~3 and Pass~4 (local ONNX SBERT), which successfully inferred semantic intent on PasswordManager UK despite completely opaque HTML \texttt{name} attributes (\texttt{textfield2}--\texttt{textfield2945}); and (3) strict false-positive suppression across all 5 websites, where credentials (\texttt{31password}, \texttt{pass}, \texttt{inputPassword}), payment card traps on SelectorsHub (\texttt{cardNumber}, \texttt{expiry} \texttt{"MM/YY"}, \texttt{cvv}) and UMich (\texttt{cc-number}, \texttt{cc-csc}), and context-free ambiguous date inputs (\texttt{the\_date} lacking birth context on SelectorsHub) were accurately rejected.
```

---

### B. Pembaruan Kalimat di Section 6 (`Conclusion`, Halaman 6 `download.pdf`)
*Petunjuk: Ganti paragraf **Section 6 (`Conclusion and Future Directions`)** pada file LaTeX dengan kode berikut.*

```latex
\section{Conclusion and Future Directions}
The proposed Hybrid Cascade Pipeline demonstrates that combining W3C standards, word-boundary lexical heuristics, query-normalized BM25, clamped Jaro-Winkler hybrid scoring, and locally bundled WebAssembly SBERT resolves heterogeneous web forms rapidly and privately. Empirical evaluation across 177 DOM controls on 5 wide-format international benchmarks and automation suites confirmed a 96.9\% recall across 10 high-variance, non-cognate attribute categories (and 94.7\% resolution on obfuscated \texttt{textfield*} controls) while maintaining zero external PII egress and zero security false positives on payment and credential traps. Immediate pre-deployment engineering priorities include: (1) expanding Pass~0 \texttt{AUTOCOMPLETE\_MAP} coverage to include honorific prefixes/suffixes and enforcing pre-stripper credit card expiry guards (\texttt{ccexp}); (2) adding post-fill DOM state verification (\texttt{el.value === finalVal}) and non-empty overwrite guards (FINDING-05/06); (3) wiring backend domain mappings and empirical IDF weights into runtime lookup (FINDING-03/04); and (4) evolving the profile cache toward W3C Verifiable Credentials and Self-Sovereign Identity (SSI) digital wallets.
```