import { Props } from "../../App.tsx";
import Tool, { InputType } from "./Tool.tsx";

export default function ToolWindow(props: Props) {
    return (
        <div
            className="flex flex-row flex-wrap justify-start content-start gap-0  row-start-1 row-end-4 col-start-1 col-end-3 w-full h-full px-3 pt-2 pb-6 overflow-auto  border-4 border-green-800"
        >
            <Tool
                title="Basic Node"
                imgSrc="/tool-icons/basic-node.webp"
                inputs={[]}
            />

            <Tool
                title="Rectangle Node"
                imgSrc="/tool-icons/rect-node.webp"
                inputs={[]}
            />

            <Tool
                title="Filter Node"
                imgSrc="/tool-icons/filter-node.webp"
                inputs={[]}
            />
        </div>
    );
}