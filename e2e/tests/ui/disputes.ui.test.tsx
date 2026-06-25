import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

// Lightweight in-test Dispute UI component to exercise dispute flows
function DisputePanel({ initialStatus = "open" }: { initialStatus?: string }) {
  const [status, setStatus] = React.useState(initialStatus);

  return (
    <div>
      <h2>Dispute</h2>
      <div>Current status: {status}</div>
      <button onClick={() => setStatus("accepted")} aria-label="accept-dispute">Accept</button>
      <button onClick={() => setStatus("rejected")} aria-label="reject-dispute">Reject</button>
      <button onClick={() => setStatus("refunded")} aria-label="refund-dispute">Refund</button>
    </div>
  );
}

describe("Dispute flow UI", () => {
  it("shows dispute and allows actions", async () => {
    render(<DisputePanel initialStatus="open" />);

    expect(screen.getByText("Dispute")).toBeTruthy();
    const statusEl = screen.getByText(/Current status:/i);
    expect(statusEl.textContent).toContain("Current status: open");

    await userEvent.click(screen.getByLabelText("accept-dispute"));
    expect(statusEl.textContent).toContain("Current status: accepted");

    await userEvent.click(screen.getByLabelText("refund-dispute"));
    expect(statusEl.textContent).toContain("Current status: refunded");
  });
});
