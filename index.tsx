import "./styles.css";
import * as React from "react";
import * as ReactDom from 'react-dom/client';
import App from "./src/App.tsx";

const root = document.querySelector("#root")! as HTMLElement;

ReactDom.createRoot(root).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);