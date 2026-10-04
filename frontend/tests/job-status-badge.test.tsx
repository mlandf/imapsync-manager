import { render, screen } from "@testing-library/react";

import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { I18nProvider } from "@/lib/i18n/context";

describe("JobStatusBadge", () => {
  it("renders the translated status", () => {
    render(
      <I18nProvider>
        <JobStatusBadge status="running" />
      </I18nProvider>,
    );
    expect(screen.getByText("Läuft")).toBeInTheDocument();
  });
});
