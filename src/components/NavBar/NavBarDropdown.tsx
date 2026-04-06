import { Children } from "react";
import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import { Props } from "../../App.tsx";
import NavBarItem from "./NavBarDropdownItem.tsx";

export default function NavBarDropdown(props: Props) {
    return (
        <Menu>
            <MenuButton
                className="px-4 py-2 text-white outline-0 rounded-xl hover:bg-gray-500"
            >
                {Children.toArray(props.children)[0]}
            </MenuButton>

            <MenuItems
                className="flex flex-col gap-1 w-50 bg-gray-500 outline-0"
                anchor="bottom start"
                modal={false}
            >
                {Children.map(props.children, (child, i) => {
                    return (i === 0 ?
                        null :
                        <NavBarItem key={i}>{child}</NavBarItem>
                    );
                })}
            </MenuItems>
        </Menu>
    );
}