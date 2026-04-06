import { Props } from "../../App.tsx";

type NodeHierarchyProps = {

} & Props;

export default function NodeHierarchy({ className }: NodeHierarchyProps) {
    return (
        <div
            className={`row-start-6 row-end-11 col-start-8 col-end-11  bg-red-300 ${className}`}
        >

        </div>
    );
}