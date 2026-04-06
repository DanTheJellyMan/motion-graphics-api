import { Props } from "../../App.tsx";

type TimelineProps = {

} & Props;

export default function Timeline({ className, ...props }: TimelineProps) {
    return (
        <div
            className={`row-start-8 row-end-11 col-start-1 col-end-8  bg-purple-800 ${className}`}
            {...props}
        >

        </div>
    );
}