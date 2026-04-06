import { Props } from "../App.tsx";

type WindowProps = Props & {
    gridArea: string;
};

/* DO NOT USE THIS COMPONENT */
export default function Window({ gridArea, ...props }: WindowProps) {
    const gaValues = gridArea.replaceAll(" ", "").split("/");

    return (
        <div
            className={`row-start-${gaValues[0]} col-start-${gaValues[1]} row-end-${gaValues[2]} col-end-${gaValues[3]}`}
            {...props}
        >

        </div>
    );
}