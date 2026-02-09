import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                default: "bg-secondary text-white hover:bg-secondary-dark hover:scale-[1.02] shadow-sm hover:shadow-md",
                destructive:
                    "bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02]",
                outline:
                    "border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white hover:scale-[1.02] transition-all",
                secondary:
                    "bg-primary text-white hover:bg-primary-light hover:scale-[1.02]",
                ghost: "hover:bg-primary/10 hover:text-primary hover:scale-[1.02]",
                link: "text-primary underline-offset-4 hover:underline",
                gold: "bg-secondary text-white hover:bg-secondary-dark font-serif tracking-wider shadow-md hover:shadow-lg hover:scale-[1.02]",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
