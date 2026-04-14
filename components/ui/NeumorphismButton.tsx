'use client';

import { ReactNode } from "react";

interface NeumorphismButtonProps {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    type?: "button" | "submit" | "reset";
}

const NeumorphismButton = ({
    children,
    onClick,
    className = "",
    type = "button",
}: NeumorphismButtonProps) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`
                px-6 py-3 rounded-full w-full
                flex items-center justify-center gap-2 
                text-[#05293C] cursor-pointer text-sm font-semibold
                shadow-[-5px_-5px_10px_rgba(255,_255,_255,_0.8),_5px_5px_10px_rgba(0,_0,_0,_0.15)]
                transition-all duration-300
                hover:shadow-[-1px_-1px_5px_rgba(255,_255,_255,_0.6),_1px_1px_5px_rgba(0,_0,_0,_0.2),inset_-2px_-2px_5px_rgba(255,_255,_255,_1),inset_2px_2px_4px_rgba(0,_0,_0,_0.15)]
                hover:text-[#0553BA]
                hover:scale-[1.02]
                active:scale-[0.98]
                ${className}
            `}
        >
            <span>{children}</span>
        </button>
    );
};

export default NeumorphismButton;
