import { TERMS_CONTENT, TERMS_EFFECTIVE_DATE, TERMS_VERSION } from '../../constants/termsContent';

export default function TermsContentModal({ kind = 'terms', version = TERMS_VERSION, onClose }) {
  const content = TERMS_CONTENT[kind] || TERMS_CONTENT.terms;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-content-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-black/15 bg-white p-5 shadow-2xl sm:p-7">
        <div className="sticky top-0 z-10 -mx-1 flex items-start justify-between gap-4 bg-white px-1 pb-4">
          <div>
            <p className="text-xs font-black text-[#009900]">버전 {version || TERMS_VERSION} · 시행 {TERMS_EFFECTIVE_DATE}</p>
            <h2 id="terms-content-title" className="mt-1 text-2xl font-black text-[#253900]">{content.title}</h2>
            <p className="mt-2 text-sm leading-6 text-black/60">{content.summary}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-black/20 px-4 py-2 text-sm font-black text-[#253900] hover:bg-black/5"
          >
            닫기
          </button>
        </div>

        <div className="space-y-3">
          {content.sections.map(([title, body]) => (
            <section key={title} className="rounded-xl border border-black/10 bg-[#F7F8F6] p-4">
              <h3 className="font-black text-[#253900]">{title}</h3>
              <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-black/70">{body}</p>
            </section>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-[#08CB00]/35 bg-[#08CB00]/5 p-4 text-xs leading-5 text-black/65">
          문의: support@career.zip · 본 문서는 현재 Career.zip 서비스 구현을 기준으로 작성된 운영 약관입니다.
        </div>
      </div>
    </div>
  );
}
