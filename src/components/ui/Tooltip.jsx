import { cloneElement, isValidElement, useId, useState } from 'react';

export default function Tooltip({ text, children, className = '' }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  if (!text) return children ?? null;

  const triggerProps = {
    'aria-describedby': open ? id : undefined,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
    onKeyDown: (event) => {
      if (event.key === 'Escape') setOpen(false);
      if (isValidElement(children) && children.props.onKeyDown) children.props.onKeyDown(event);
    },
  };

  const trigger = isValidElement(children)
    ? cloneElement(children, {
        ...triggerProps,
        onMouseEnter: (event) => {
          setOpen(true);
          children.props.onMouseEnter?.(event);
        },
        onMouseLeave: (event) => {
          setOpen(false);
          children.props.onMouseLeave?.(event);
        },
        onFocus: (event) => {
          setOpen(true);
          children.props.onFocus?.(event);
        },
        onBlur: (event) => {
          setOpen(false);
          children.props.onBlur?.(event);
        },
      })
    : (
      <span tabIndex={0} {...triggerProps}>
        {children}
      </span>
    );

  return (
    <span className={`relative inline-flex ${className}`}>
      {trigger}
      {open && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-64 rounded-lg bg-[#253900] px-3 py-2 text-xs leading-5 text-[#EEEEEE] shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}
