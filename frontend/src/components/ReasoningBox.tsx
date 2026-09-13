import { BrainCircuit } from "lucide-react";

interface ReasoningBoxProps {
  text: string;
}

export default function ReasoningBox({ text }: ReasoningBoxProps) {
  return (
    <div className="reasoning-box">
      <div className="reasoning-box__heading">
        <BrainCircuit size={18} strokeWidth={1.5} />
        <h2>Reasoning</h2>
      </div>
      <p className="reasoning-box__text">{text}</p>
    </div>
  );
}
