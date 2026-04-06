import NavBarDropdown from "./NavBarDropdown.tsx";

export default function NavBar() {
    // TODO: implement opening and closing based on which dropdown is hovered

    return (
        <div className="flex flex-row gap-1 px-5 py-1 bg-gray-600">
            <NavBarDropdown>
                <p>File</p>
                <p onClick={() => console.log("shaboingboing")}>Import</p>
                <p onClick={() => console.log("shaboingboing")}>Open Project</p>
                <p onClick={() => console.log("shaboingboing")}>Export</p>
                <p onClick={() => console.log("shaboingboing")}>Save Project</p>
            </NavBarDropdown>

            <NavBarDropdown>
                <p>Edit</p>
                <p onClick={() => console.log("shaboingboing")}>Undo</p>
                <p onClick={() => console.log("shaboingboing")}>Redo</p>
                <p onClick={() => console.log("shaboingboing")}>Cut</p>
                <p onClick={() => console.log("shaboingboing")}>Copy</p>
                <p onClick={() => console.log("shaboingboing")}>Paste</p>
            </NavBarDropdown>

            <NavBarDropdown>
                <p>View</p>
                <p onClick={() => console.log("shaboingboing")}>Zoom In</p>
                <p onClick={() => console.log("shaboingboing")}>Zoom Out</p>
                <p onClick={() => console.log("shaboingboing")}>Fullscreen</p>
            </NavBarDropdown>

            <NavBarDropdown>
                <p>Project Settings</p>
                <p onClick={() => console.log("shaboingboing")}>Graphic Size</p>
                <p onClick={() => console.log("shaboingboing")}>Repeat Count</p>
                <p onClick={() => console.log("shaboingboing")}>Duration</p>
                <p onClick={() => console.log("shaboingboing")}>View Box</p>
                <p onClick={() => console.log("shaboingboing")}>Preserve Aspec</p>
            </NavBarDropdown>
        </div>
    );
}