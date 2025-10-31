// UI 组件库入口文件
import type { ComponentProps } from '@little-guitar/types';

// 基础组件类型
export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export interface CardProps extends ComponentProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export interface ModalProps extends ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// 导出类型
export type { ButtonProps, CardProps, ModalProps };

// 导出组件（待实现）
export const Button = () => null;
export const Card = () => null;
export const Modal = () => null;