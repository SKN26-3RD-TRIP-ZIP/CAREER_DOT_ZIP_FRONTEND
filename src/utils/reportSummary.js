export function getReportSummary(report) {
  return report?.summary ?? report?.raw_data?.summary ?? report ?? {};
}

export function getReportScoreSummary(report) {
  const summary = getReportSummary(report);
  return (
    summary?.score_summary ??
    report?.score_summary ??
    report?.raw_data?.summary?.score_summary ??
    {}
  );
}

export function getReportScoreDetail(report) {
  const summary = getReportSummary(report);
  return summary?.score_detail ?? report?.score_detail ?? {};
}

export function getReportMetadata(report) {
  const summary = getReportSummary(report);
  return summary?.evaluation_metadata ?? report?.evaluation_metadata ?? {};
}

export function getReportTriggeredTags(report) {
  const summary = getReportSummary(report);
  return summary?.dynamically_triggered_tags ?? report?.dynamically_triggered_tags ?? {};
}

export function getOverallScore(report, fallback = null) {
  return (
    report?.summary?.score_summary?.overall_score ??
    report?.score_summary?.overall_score ??
    report?.raw_data?.summary?.score_summary?.overall_score ??
    report?.overall_score ??
    fallback
  );
}
