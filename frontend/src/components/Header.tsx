import { CircleCheck, CircleX, LoaderCircle, ScanSearch } from "lucide-react";
import type { ApiStatus } from "../types/detection";

interface HeaderProps {
  status: ApiStatus;
  modelName?: string;
}

function StatusIndicator({ status, modelName }: HeaderProps) {
  if (status === "checking") {
    return (
      <span className="status status--checking">
        <LoaderCircle className="status__icon status__icon--spin" size={16} strokeWidth={2} />
        Checking service
      </span>
    );
  }

  if (status === "online") {
    return (
      <span className="status status--online">
        <CircleCheck className="status__icon" size={16} strokeWidth={2} />
        Service online{modelName ? ` · ${modelName}` : ""}
      </span>
    );
  }

  return (
    <span className="status status--offline">
      <CircleX className="status__icon" size={16} strokeWidth={2} />
      Service unavailable
    </span>
  );
}

export default function Header({ status, modelName }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__mark">
          <ScanSearch size={26} strokeWidth={1.5} />
        </span>
        <div>
          <h1 className="header__title">Animal Detection Console</h1>
          <p className="header__subtitle">RT&#8209;DETR Object Detection Interface</p>
        </div>
      </div>
      <StatusIndicator status={status} modelName={modelName} />
    </header>
  );
}
