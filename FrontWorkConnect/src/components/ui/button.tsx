import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium cursor-pointer transition-[background-color,border-color,box-shadow,color,opacity] duration-[180ms] ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "rounded-md bg-primary text-primary-foreground shadow-soft hover:bg-[var(--brand-deep)] hover:shadow-[var(--shadow-hover)] active:opacity-90",
        destructive:
          "rounded-md bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 hover:shadow-[var(--shadow-hover)]",
        outline:
          "rounded-md border border-border bg-card text-foreground shadow-soft hover:border-primary/35 hover:bg-surface hover:shadow-[var(--shadow-hover)]",
        secondary:
          "rounded-md bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80 hover:shadow-[var(--shadow-hover)]",
        ghost:
          "rounded-md hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 transition-colors hover:text-[var(--brand-deep)] hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
