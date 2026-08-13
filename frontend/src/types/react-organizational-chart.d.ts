declare module 'react-organizational-chart' {
  import { ReactNode } from 'react';

  interface TreeProps {
    label?: ReactNode;
    lineWidth?: string;
    lineColor?: string;
    lineBorderRadius?: string;
    nodePadding?: string;
    children?: ReactNode;
  }

  interface TreeNodeProps {
    label: ReactNode;
    children?: ReactNode;
  }

  export function Tree(props: TreeProps): JSX.Element;
  export function TreeNode(props: TreeNodeProps): JSX.Element;
}
