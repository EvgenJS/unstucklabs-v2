import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl bg-white p-6 shadow-md transition-shadow duration-200 ease-out hover:shadow-lg ${className}`}
      {...props}
    />
  );
}
