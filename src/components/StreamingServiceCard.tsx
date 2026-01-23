import { Check, Plus } from "lucide-react";

interface StreamingServiceCardProps {
  name: string;
  logo: string;
  color: string;
  connected: boolean;
  onToggle: () => void;
}

const StreamingServiceCard = ({
  name,
  logo,
  color,
  connected,
  onToggle,
}: StreamingServiceCardProps) => {
  return (
    <div
      onClick={onToggle}
      className={`service-card ${connected ? "connected" : ""}`}
      style={{
        ["--service-color" as string]: color,
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
          style={{ backgroundColor: color }}
        >
          {logo}
        </div>
        <div className="flex-1">
          <h3 className="font-display font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">
            {connected ? "Connected" : "Click to connect"}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
            connected
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          {connected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </div>
    </div>
  );
};

export default StreamingServiceCard;
