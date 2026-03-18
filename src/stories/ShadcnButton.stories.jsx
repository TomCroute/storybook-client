import { Button } from '../components/ui/button';

export default {
  title: 'shadcn/Button',
  component: Button,
};

export const Primary = { args: { children: 'Button', variant: 'default' } };
export const Secondary = { args: { children: 'Button', variant: 'secondary' } };
export const Outline = { args: { children: 'Button', variant: 'outline' } };
export const Destructive = { args: { children: 'Button', variant: 'destructive' } };
export const Ghost = { args: { children: 'Button', variant: 'ghost' } };
