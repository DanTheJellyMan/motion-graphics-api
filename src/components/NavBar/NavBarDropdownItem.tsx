import { MenuItem } from "@headlessui/react";
import { Props } from "../../App.tsx";

export default function NavBarItem(props: Props) {
    return (
        <MenuItem
            as="div"
            className={`text-white hover:backdrop-brightness-50 ${props.className}`}
            children={props.children}
        />
    );
}