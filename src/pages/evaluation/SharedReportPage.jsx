import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { reportApi } from '../../api/reportApi';
import ReportLayout from '../../components/report/ReportLayout';
import StateView from '../../components/report/StateView';
import FinalReportView from './FinalReportView';

/**
 * /shared/:token — 인증 불필요 공개 리포트 뷰.
 * 토큰 유효성 검증 후 FinalReportView를 공유 모드(isShared=true)로 렌더.
 */
export default function SharedReportPage() {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  useEffect(() => {
    if (!token) return;
    reportApi
      .getSharedReport(token)
      .then(({ normalized, expires_at }) =>
        setState({ status: 'ok', data: { report: normalized, expires_at } }),
      )
      .catch((err) => {
        const code = err?.response?.status;
        const msg =
          code === 410
            ? '공유 링크가 만료되었습니다.'
            : '유효하지 않은 공유 링크입니다.';
        setState({ status: 'error', data: null, error: msg });
      });
  }, [token]);

  if (state.status === 'loading') {
    return (
      <ReportLayout title="공유된 리포트" subtitle="">
        <StateView isLoading />
      </ReportLayout>
    );
  }

  if (state.status === 'error') {
    return (
      <ReportLayout title="공유된 리포트" subtitle="">
        <StateView isError error={{ message: state.error }} />
      </ReportLayout>
    );
  }

  const expiresDate = new Date(state.data.expires_at).toLocaleDateString('ko-KR');

  return (
    <ReportLayout
      title="공유된 면접 리포트"
      subtitle={`이 리포트는 ${expiresDate}까지 유효한 공유 링크입니다.`}
    >
      <FinalReportView report={state.data.report} isShared />
    </ReportLayout>
  );
}
