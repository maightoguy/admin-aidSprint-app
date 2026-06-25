import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

// Simple mockable realtime emitter
class MockRealtime {
  listeners: Record<string, ((payload: any) => void)[]> = {};
  on(event: string, cb: (payload: any) => void) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(cb);
    return () => {
      this.listeners[event] = this.listeners[event].filter((f) => f !== cb);
    };
  }
  emit(event: string, payload: any) {
    (this.listeners[event] || []).forEach((cb) => cb(payload));
  }
}

function RealtimeComponent({ realtime }: { realtime: MockRealtime }) {
  const [messages, setMessages] = React.useState<string[]>([]);

  React.useEffect(() => {
    const unsub = realtime.on("message", (p) => setMessages((s) => [...s, p.text]));
    return unsub;
  }, [realtime]);

  return (
    <div>
      <h3>Realtime</h3>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
      <button onClick={() => realtime.emit("message", { text: "Hello" })} aria-label="emit-hello">Emit</button>
    </div>
  );
}

describe("Realtime UI (mocked)", () => {
  it("receives events and updates the DOM", async () => {
    const rt = new MockRealtime();
    render(<RealtimeComponent realtime={rt} />);

    expect(screen.getByText("Realtime")).toBeTruthy();

    await userEvent.click(screen.getByLabelText("emit-hello"));
    expect(screen.getByText("Hello")).toBeTruthy();
  });
});
