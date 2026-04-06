import { Props } from "../../App.tsx";
import { Button, Input, RadioGroup } from "@headlessui/react";

// Note: zustand will automatically import this enum and handle each type's component creation
export enum InputType {
    CHECKBOX,
    DROPDOWN_MENU,
    RADIO_GROUP,
    BUTTON,
    RANGE
};

type ToolInput = {
    type: InputType;
    value: any;
    options: Record<string, any>;
};

type ToolProps = {
    title: string;
    imgSrc: string;
    inputs: ToolInput[];
} & Props;

export default function Tool({ className, title, imgSrc, inputs, ...props }: ToolProps) {
    return (
        <Button
            className={`min-w-3 w-2/7 max-w-20 aspect-square p-2  bg-contain bg-no-repeat rounded-lg hover:backdrop-brightness-150 hover:cursor-pointer ${className}`}
            {...props}
        >
            <img
                className="w-full h-full"
                draggable={false}
                src={imgSrc}
            />
        </Button>
    );
}