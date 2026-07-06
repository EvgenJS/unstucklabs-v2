import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const base =
  "inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold cursor-pointer transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-accent text-on-primary hover:opacity-90 hover:-translate-y-0.5",
  secondary: "bg-transparent text-primary border-2 border-primary hover:bg-primary/5",
};

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
