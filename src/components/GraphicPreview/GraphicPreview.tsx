import { Props } from "../../App.tsx";

type GraphicPreviewProps = {

} & Props;

export default function GraphicPreview({ className }: GraphicPreviewProps) {
    return (
        <div
            className={`row-start-1 row-end-8 col-start-3 col-end-8 bg-yellow-200 ${className}`}
        >

        </div>
    );
}