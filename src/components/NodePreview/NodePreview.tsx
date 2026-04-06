import { Props } from "../../App.tsx";

type NodePreviewProps = {

} & Props;

export default function NodePreview({ className }: NodePreviewProps) {
    return (
        <div
            className={`row-start-1 row-end-6 col-start-8 col-end-11  bg-orange-600 ${className}`}
        >

        </div>
    );
}