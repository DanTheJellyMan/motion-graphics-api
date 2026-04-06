import React from "react";
import NavBar from "./components/NavBar/NavBar.tsx";
import Workspace from "./components/Workspace.tsx";

export type Props = {
    children?: React.ReactNode;
    className?: string;
    key?: React.Key;
    [prop: string]: any;
};

export default function App(): any {
    return (
        <div className="flex flex-col  w-full h-full">
            <NavBar></NavBar>
            <Workspace></Workspace>
        </div>
    );
}