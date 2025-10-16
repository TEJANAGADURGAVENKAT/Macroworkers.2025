import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Loader2, User } from "lucide-react";

export type PaymentStatus = "pending" | "pending_details" | "processing" | "completed" | "failed";

interface PaymentStatusTagProps {
  status: PaymentStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const PaymentStatusTag = ({ 
  status, 
  size = "md",
  showIcon = true 
}: PaymentStatusTagProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          label: "Payment Completed",
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
          emoji: "🟢"
        };
      case "processing":
        return {
          label: "Payment Processing",
          icon: Loader2,
          className: "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100",
          emoji: "🟡",
          animated: true
        };
      case "pending":
        return {
          label: "Pending Payment",
          icon: Clock,
          className: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100",
          emoji: "🟡"
        };
      case "pending_details":
        return {
          label: "Pending Details",
          icon: User,
          className: "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100",
          emoji: "🟣"
        };
      case "failed":
        return {
          label: "Payment Failed",
          icon: AlertCircle,
          className: "bg-red-100 text-red-800 border-red-300 hover:bg-red-100",
          emoji: "🔴"
        };
      default:
        return {
          label: "Unknown Status",
          icon: AlertCircle,
          className: "bg-gray-100 text-gray-800 border-gray-300",
          emoji: "⚪"
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4"
  };

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${sizeClasses[size]} flex items-center gap-1.5 font-medium`}
    >
      {showIcon && (
        <Icon 
          className={`${iconSizes[size]} ${config.animated ? 'animate-spin' : ''}`} 
        />
      )}
      <span>{config.emoji} {config.label}</span>
    </Badge>
  );
};

export default PaymentStatusTag;


