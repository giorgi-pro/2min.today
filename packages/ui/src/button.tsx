"use client";

import type { ReactNode } from "react";

type ButtonProps = {
  appName: string;
  className?: string;
  children?: ReactNode;
};

export function Button({ appName, className, children }: ButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        alert(`Hello from ${appName}!`);
      }}
    >
      {children}
    </button>
  );
}
