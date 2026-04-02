import { useEffect, type ReactNode } from "react";
import { RequestDetailsLiveTrackerOverlay } from "./request-details-overlay";
import { RequestDetailsCore } from "./request-details-sidebar";
import { useRequestDetailsStore } from "./request-details.store";
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
    useRequestDetailsStore.setState({
      isMapOpen: true,
      selectedRequestId: activeRequest.id,
    });

    return () => {
      useRequestDetailsStore.setState({
        isMapOpen: false,
        selectedRequestId: null,
      });
    };
  }, []);

  return <RequestDetailsLiveTrackerOverlay requestId={activeRequest.id} />;
}

export default {
  title: "Dashboard/Request Details",
};

export function ActiveState() {
  return (
    <StoryFrame>
      <RequestDetailsCore
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
      <RequestDetailsCore
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
      <RequestDetailsCore
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
      <RequestDetailsCore
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
