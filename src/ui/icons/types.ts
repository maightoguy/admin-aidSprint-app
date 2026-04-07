import type { ComponentType, SVGProps } from "react";

/** Standard props shared by all AidSprint SVG icon components. */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number;
  color?: string;
  className?: string;
}

/** Reusable component contract for centralized AidSprint icons. */
export type IconComponent = ComponentType<IconProps>;
