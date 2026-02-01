import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive" | "glass";
}

const variantStyles = {
  default: "border-l-muted-foreground/30",
  primary: "border-l-primary",
  success: "border-l-success",
  warning: "border-l-warning",
  destructive: "border-l-destructive shadow-destructive/10",
  glass: "border-l-primary bg-glass backdrop-blur-md border-none",
};

const iconStyles = {
  default: "text-muted-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default"
}: StatCardProps) {
  return (
    <Card
      variant="stat"
      className={cn(
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden relative",
        variant === "glass" ? variantStyles.glass : cn("border-l-4", variantStyles[variant])
      )}
    >
      {variant === "glass" && (
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
      )}
      <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", variant === "glass" ? "bg-primary/10" : "bg-muted/50")}>
          <Icon className={cn("h-4 w-4", iconStyles[variant === "glass" ? "primary" : variant])} />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-black tracking-tight">{value}</div>
        {description && (
          <CardDescription className="mt-1 font-medium text-muted-foreground/70">{description}</CardDescription>
        )}
        {trend && (
          <div className={cn(
            "mt-3 flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full w-fit",
            trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            <span className="text-[10px]">{trend.isPositive ? "▲" : "▼"}</span>
            {Math.abs(trend.value)}% <span className="text-[10px] opacity-70 font-medium lowercase">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
