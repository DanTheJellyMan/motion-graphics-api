import { Props } from "../App.tsx";
import ToolWindow from "./Tools/ToolWindow.tsx";
import ToolOptionsWindow from "./ToolOptions/ToolOptionsWindow.tsx";
import Timeline from "./Timeline/Timeline.tsx";
import GraphicPreview from "./GraphicPreview/GraphicPreview.tsx";
import NodePreview from "./NodePreview/NodePreview.tsx";
import NodeHierarchy from "./NodeHierarchy/NodeHierarchy.tsx";

export default function Workspace(props: Props) {
    return (
        <div
            className={`grid grid-rows-10 grid-cols-10  w-full h-full  bg-gray-700 ${props.className}`}
        >
            <ToolWindow></ToolWindow>
            <ToolOptionsWindow></ToolOptionsWindow>
            <Timeline></Timeline>
            <GraphicPreview></GraphicPreview>
            <NodePreview></NodePreview>
            <NodeHierarchy></NodeHierarchy>
        </div>
    );
}