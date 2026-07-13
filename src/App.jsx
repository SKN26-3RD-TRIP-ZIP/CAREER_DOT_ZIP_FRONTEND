import { Navigate, Routes, Route } from 'react-router-dom'
import * as Pages from './routes/pages.js'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Pages.HomePage />} />

      {/* 공유 리포트 — 인증 불필요 공개 라우트 */}
      <Route path="/shared/:token" element={<Pages.SharedReportPage />} />

      {/*
        보호 라우트(토큰만 필요, requireComplete=false): 하나의 ProtectedRoute 로 통합.
        그룹을 나눠 선언하면 그룹 간 이동마다 ProtectedRoute 가 리마운트되어
        인증 확인 로딩 화면이 반복 노출되므로, 반드시 하나의 Route 트리로 유지한다.
      */}
      <Route element={<Pages.ProtectedRoute />}>
        <Route element={<Pages.AppLayout />}>
          <Route path="/analysis" element={<Pages.SourceSelectionPage />} />
          <Route path="/analysis/source" element={<Pages.SourceSelectionPage />} />
          <Route path="/analysis/result" element={<Pages.ResultPage />} />
          <Route path="/analysis/questions" element={<Pages.ResultPage expanded />} />
        </Route>

        {/* 실제 구현된 리포트(평가) 페이지 — 세션별 */}
        <Route path="/report/*" element={<Pages.EvaluationRoutes />} />

        {/* 입력·면접 흐름 (P0 보호 라우트 완성) */}
        <Route path="/input/onboarding/:step" element={<Pages.OnboardingPage />} />
        <Route path="/input" element={<Pages.InputHomePage />} />
        {/* develop 기존 JD 입력 라우트 보존 */}
        <Route path="/jd" element={<Pages.JdManagementPage />} />
        <Route path="/input/jd-import" element={<Pages.JdImportPage />} />
        <Route path="/JD" element={<Pages.JdManagementPage />} />
        <Route path="/input/jd" element={<Pages.JdManagementPage />} />
        <Route path="/input/jd/new" element={<Pages.JdInputPage />} />
        <Route path="/input/jd/:jdId/edit" element={<Pages.JdInputPage />} />
        <Route path="/input/jd/:jdId/talent-profile" element={<Pages.TalentProfilePage />} />
        <Route path="/input/documents" element={<Pages.DocumentsInputPage />} />
        <Route path="/input/cover-letter-project" element={<Pages.CoverLetterProjectPage />} />
        <Route path="/input/session-setup" element={<Pages.SessionSetupPage />} />

        {/* 면접 설정 → 세션/질문 생성 진입 (QA P0: JD 저장 후 면접 설정 화면) */}
        <Route path="/session-setup" element={<Pages.SessionSetupPage />} />

        {/* develop 기존 면접 페이지 라우트 보존 */}
        <Route path="/interview" element={<Pages.VoiceInterviewPage />} />
        <Route path="/interview/setup" element={<Pages.SessionSetupPage />} />
        <Route path="/interview/question" element={<Pages.InterviewQuestionCheckPage />} />
        <Route path="/interview/chat" element={<Pages.ChatInterviewPage />} />
        <Route path="/interview/setup-check" element={<Pages.InterviewSetupCheckPage />} />
        <Route path="/interview/question-check" element={<Navigate to="/interview/question" replace />} />
        <Route path="/interview/question-packs" element={<Pages.QuestionPacksPage />} />

        {/* /profile 은 프로필 미완성 사용자가 작성하는 화면이므로 완료 요건 없이 토큰만 요구 */}
        <Route path="/profile" element={<Pages.ProfilePage />} />

        <Route path="/mypage/terms" element={<Pages.TermsManagementPage />} />

        {/* 소셜 간편가입 필수 약관 동의 화면 */}
        <Route path="/signup/social/terms" element={<Pages.SocialTermsPage />} />
      </Route>

      {/* 마이페이지 실제 면접 기록/리포트 조회 (prototype /mypage/* 와 분리): 프로필 완료 요건 필요 */}
      <Route element={<Pages.ProtectedRoute requireComplete />}>
        <Route path="/dashboard" element={<Pages.MyPage />} />
        <Route path="/mypage" element={<Pages.MyPage />} />
        <Route path="/mypage/growth" element={<Pages.GrowthDashboardPage />} />
        <Route path="/mypage/points" element={<Pages.PointsPage />} />
        <Route path="/mypage/interviews" element={<Pages.InterviewRecordsPage />} />
        <Route path="/mypage/profile-settings" element={<Pages.ProfileSettingsPage />} />
      </Route>

      {/* 실제 인증 연동 라우트 (프로토타입 /login,/signup 과 분리) */}
      <Route path="/auth/login" element={<Pages.AuthLoginPage />} />
      <Route path="/auth/reset-password" element={<Pages.ResetPasswordPage />} />
      <Route path="/auth/signup" element={<Pages.SignupPage />} />
      <Route path="/auth/signup/complete" element={<Pages.SignupCompletePage />} />
      <Route path="/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
      <Route path="/verify-email" element={<Pages.VerifyEmailPage />} />

      {/* 소셜 로그인 콜백: Backend 가 302 로 일회용 code 를 전달하는 Frontend 경로 */}
      <Route path="/oauth/callback" element={<Pages.OAuthCallbackPage />} />
      {/* 하위호환: 기존 provider 별 콜백 경로도 동일 페이지로 처리 */}
      <Route path="/auth/oauth/:provider/callback" element={<Pages.OAuthCallbackPage />} />

      {/* 어드민 라우트 */}
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<Pages.Login />} />
      <Route element={<Pages.PrivateRoute />}>
        <Route path="/admin/dashboard" element={<Pages.Dashboard />} />
        <Route path="/admin/members" element={<Pages.Members />} />
        <Route path="/admin/members/:userId" element={<Pages.MemberDetail />} />
        <Route path="/admin/points" element={<Pages.Points />} />
        <Route path="/admin/prompts" element={<Pages.Prompts />} />
        <Route path="/admin/audit-logs" element={<Pages.AuditLogs />} />
        <Route path="/admin/versions" element={<Pages.Versions />} />
        <Route
          path="/interview/setup-admin"
          element={<Pages.SessionSetupPage adminMode />}
        />
        <Route
          path="/interview/question-admin"
          element={<Pages.InterviewQuestionCheckPage adminMode />}
        />
        <Route
          path="/report-admin/*"
          element={<Pages.EvaluationRoutes adminMode />}
        />
      </Route>

      {/* fallback: 정의되지 않은 경로는 홈으로 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
