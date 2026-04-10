import { useEffect, type ReactNode } from "react";
import { RequestsLiveTrackerOverlay } from "./requests-overlay";
import { RequestsCore } from "./requests-sidebar";
import { useRequestsStore } from "./requests.store";
import { userDetailsRecords } from "../user-details/user-details.data";

const storyUser = userDetailsRecords[0];
const activeRequest = storyUser.requestHistory[0];
const pendingRequest = storyUser.requestHistory[1];
const completedRequest = {
  ...storyUser.requestHistory[0],
  status: "Completed" as const,
  lifecycleStatus: "Completed" as const,
  etaLabel: "Completed",
};
const cancelledRequest = {
  ...storyUser.requestHistory[0],
  status: "Cancelled" as const,
  lifecycleStatus: "Cancelled" as const,
  etaLabel: "Cancelled",
};

function StoryFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      <div className="ml-auto max-w-[523px]">{children}</div>
    </div>
  );
}

function OverlayStory() {
  useEffect(() => {
    useRequestsStore.setState({
      isMapOpen: true,
      selectedRequestId: activeRequest.id,
    });

    return () => {
      useRequestsStore.setState({
        isMapOpen: false,
        selectedRequestId: null,
      });
    };
  }, []);

  return <RequestsLiveTrackerOverlay requestId={activeRequest.id} />;
}

export default {
  title: "Dashboard/Request Details",
};

export function ActiveState() {
  return (
    <StoryFrame>
      <RequestsCore
        request={activeRequest}
        customerName={storyUser.name}
        onOpenLiveTracker={() => undefined}
        onUpdateStatus={() => undefined}
      />
    </StoryFrame>
  );
}

export function PendingState() {
  return (
    <StoryFrame>
      <RequestsCore
        request={pendingRequest}
        customerName={storyUser.name}
        onOpenLiveTracker={() => undefined}
        onUpdateStatus={() => undefined}
      />
    </StoryFrame>
  );
}

export function CompletedState() {
  return (
    <StoryFrame>
      <RequestsCore
        request={completedRequest}
        customerName={storyUser.name}
        onOpenLiveTracker={() => undefined}
        onUpdateStatus={() => undefined}
      />
    </StoryFrame>
  );
}

export function CancelledState() {
  return (
    <StoryFrame>
      <RequestsCore
        request={cancelledRequest}
        customerName={storyUser.name}
        onOpenLiveTracker={() => undefined}
        onUpdateStatus={() => undefined}
      />
    </StoryFrame>
  );
}

export function MapOverlayState() {
  return <OverlayStory />;
}
