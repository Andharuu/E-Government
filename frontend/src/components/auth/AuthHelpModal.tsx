import { useState } from 'react';
import { FontAwesome } from '../ui';

interface AuthHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export function AuthHelpModal({ isOpen, onClose, defaultEmail = '' }: AuthHelpModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [category, setCategory] = useState('login');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/complaints/public-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Gagal mengirim tiket bantuan');
      }

      const data = await res.json();
      setSuccessRef(data.reference_number || 'HLP-TERKIRIM');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessRef(null);
    setName('');
    setEmail(defaultEmail);
    setSubject('');
    setMessage('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="card page-enter relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="btn btn-ghost btn-icon btn-sm absolute right-3 top-3 text-ink-3"
          aria-label="Tutup"
        >
          <FontAwesome name="cross-small" className="text-[12px]" />
        </button>

        <div className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-4 pr-12">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-accent-text">
            <FontAwesome name="circle-info" className="text-[13px]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-ink">
              Pusat Bantuan & Layanan Warga
            </h3>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink-3">
              Pesan terhubung langsung ke database dan ditinjau oleh Admin GovConnect
            </p>
          </div>
        </div>

        {successRef ? (
          <div className="my-auto space-y-4 px-5 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-ok-line bg-ok-soft text-ok">
              <FontAwesome name="circle-check" className="text-[18px]" />
            </div>
            <div>
              <h4 className="text-[15px] font-semibold text-ink">
                Tiket Bantuan Berhasil Dibuat!
              </h4>
              <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-ink-3">
                Laporan kendala Anda telah disimpan ke sistem pengaduan dan akan segera ditindaklanjuti oleh petugas administrator.
              </p>
            </div>
            <div className="inline-block rounded-md border border-line bg-surface-2 px-3.5 py-2.5 text-[11px]">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-3">Nomor Tiket Pengaduan:</span>
              <strong className="mono text-[13px] font-semibold tracking-wider text-accent-text">{successRef}</strong>
            </div>
            <div className="pt-2">
              <button
                onClick={handleReset}
                className="btn btn-primary w-full sm:w-auto"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-md border border-danger-line bg-danger-soft px-3 py-2.5 text-[12px] text-danger">
                <FontAwesome name="circle-xmark" className="shrink-0 text-[13px]" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nama pemohon/warga..."
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email untuk tindak lanjut..."
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">
                Kategori Bantuan
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="select cursor-pointer"
              >
                <option value="login">Kendala Login & Akses Akun</option>
                <option value="ekstensi">Masalah Ekstensi Autofill</option>
                <option value="pelayanan">Pertanyaan Layanan Kependudukan</option>
                <option value="keamanan">Laporan Bug / Keamanan Data</option>
                <option value="teknis">Kendala Teknis Lainnya</option>
              </select>
            </div>

            <div>
              <label className="label">
                Subjek / Judul Kendala
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Contoh: Tidak dapat menerima email verifikasi"
                className="input"
              />
            </div>

            <div>
              <label className="label">
                Uraian Kendala
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Jelaskan secara singkat kendala yang Anda alami..."
                className="textarea resize-none"
              />
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
              <span className="text-[11px] text-ink-3">
                Data akan tersimpan di sistem pengaduan resmi GovConnect.
              </span>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary shrink-0"
              >
                {loading ? (
                  <>
                    <FontAwesome name="spinner" spin className="text-[12px]" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <FontAwesome name="paper-plane" className="text-[12px]" />
                    <span>Kirim Pesan Bantuan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
