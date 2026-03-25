import BaseComponent, { Attribute } from "./BaseComponent.ts";

type DefaultAttributes = keyof typeof CustomDropdown.defaultAttributes;

const CUSTOM_DROPDOWN_STYLES = `
    custom-dropdown {
        --dropdown-border-radius: 0.3rem;
        --value: "";

        position: relative !important;

        width: max-content;
        height: max-content !important;

        border-radius: var(--dropdown-border-radius);
        user-select: none !important;
    }
    custom-dropdown:has(.custom-dropdown-header:hover), custom-dropdown.expanded {
        backdrop-filter: brightness(80%);
    }
        
    custom-dropdown > .custom-dropdown-header {
        padding: 0.25rem 1.5rem;
        
        color: white;
    }

    custom-dropdown > .custom-dropdown-list {
        position: absolute !important;
        display: flex;
        flex-direction: column !important;
        gap: 0;

        width: 200px;
        padding: 0.25rem;

        list-style: none;
        background-color: white;
        border: 2px solid black;
        border-radius: var(--dropdown-border-radius);
        z-index: 999 !important;
    }
    custom-dropdown:not(.expanded) > .custom-dropdown-list, custom-dropdown > .custom-dropdown-list:empty {
        display: none !important;
    }

    custom-dropdown > .custom-dropdown-list > *:not(hr) {
        --list-item-height: 0.9em;

        display: flex;
        flex-direction: row;
        align-content: center;

        width: 100%;
        padding: 0.25rem 0.5rem 0.25rem 2rem;

        font-size: var(--list-item-height);
        border-radius: 0 !important;
    }
    custom-dropdown > .custom-dropdown-list > *:not(hr):hover {
        backdrop-filter: brightness(80%);
    }

    custom-dropdown > .custom-dropdown-list > hr {
        margin: 0.25rem 0 0.325rem 0 !important;
        user-select: none !important;
    }

    custom-dropdown > .custom-dropdown-list > custom-dropdown::after {
        width: calc(var(--list-item-height) * 2) !important;
        height: calc(var(--list-item-height) * 0.5) !important;

        content: "";
        background-image: url("https://upload.wikimedia.org/wikipedia/commons/9/96/Chevron-icon-drop-down-menu-WHITE.png") !important;
        background-size: contain !important;
        background-repeat: no-repeat !important;
        transform: translateX(33%) rotate(-90deg);
        filter: brightness(45%);
    }

    custom-dropdown > .custom-dropdown-list > custom-dropdown > .custom-dropdown-header {
        width: 100% !important;
        padding: 0 !important;

        color: black;
    }
    
    custom-dropdown > .custom-dropdown-list > custom-dropdown[enable-value-display = "true"] > .custom-dropdown-header::after,
    custom-dropdown > .custom-dropdown-list > custom-dropdown > .custom-dropdown-header:empty::after {
        content: "bruh";
        position: relative;
        right: 0;
    }

    custom-dropdown > .custom-dropdown-list > custom-dropdown > .custom-dropdown-list {
        left: 100% !important;
    }
`;

// TODO: remove all "nodeName" checks from the project and use Object.getPrototypeOf()
// TODO: add sub-dropdown behavior (like in GIMP) for nested dropdowns

export default class CustomDropdown extends BaseComponent {
    /* Behavior scenarios:
        .custom-dropdown-header.children.length === 0, value takes its position, regardless of the state of enable-value-display
        enable-value-display = "true", value is displayed
        enable-value-display = "false", toolbar-style dropdowns
    */
    public static override defaultAttributes = Object.freeze({
        "value": "",
        "enable-value-display": "false"
    });
    public static override observedAttributes: Readonly<DefaultAttributes[]> = Object.keys(CustomDropdown.defaultAttributes) as DefaultAttributes[];
    protected override attributeTesters: Readonly<Record<DefaultAttributes, (value: Attribute) => boolean>> = {
        "enable-value-display"(value) {
            value = value!.trim().toLowerCase();
            switch(value) {
                case "true": case "false":
                    return true;
                default:
                    return false;
            }
        },
        "value": (value) => {
            if (value === "") return true;

            const listItems = Array.from(this.querySelectorAll(".custom-dropdown-list > *:not(hr)"));
            for (const item of listItems) {
                if (item.textContent === value) return true;
            }
            return false;
        }
    };

    static {
        const style = document.createElement("style");
        style.id = "custom-dropdown-style";
        style.innerHTML = CUSTOM_DROPDOWN_STYLES;
        document.body.appendChild(style);

        document.body.addEventListener("click", (e) => {
            for (const dropdown of CustomDropdown.allDropdowns) {
                if (dropdown.contains(e.target as Node)) {
                    continue;
                }
                dropdown.classList.remove("expanded");
            }
        });
    }
    private static allDropdowns: CustomDropdown[] = [];

    public override connectedCallback(): void {
        super.connectedCallback();
        CustomDropdown.allDropdowns.push(this);
        this.initDropdownContainers();
        this.tabIndex = 0;
        
        const parent = this.parentElement!;
        const header = this.querySelector(".custom-dropdown-header") as HTMLElement;
        const list = this.querySelector(".custom-dropdown-list") as HTMLElement;
        const listItems = new Set(list.children) as Set<HTMLElement>;

        header.addEventListener("click", (e) => {
            this.classList.toggle("expanded");
        });

        header.addEventListener("mouseenter", (e) => {
            const siblingDropdowns = parent.querySelectorAll("custom-dropdown.expanded");
            if (siblingDropdowns.length === 0) {
                return;
            }
            siblingDropdowns.forEach((sibling) => {
                sibling.classList.remove("expanded");
            });
            this.classList.add("expanded");
        });

        list.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            console.log(target);
            if (listItems.has(target.parentElement!) && Object.getPrototypeOf(target.parentElement!)) {
            
            } else if (!listItems.has(target)) {
                return;
            }
            
            this.setAttribute("value", target.textContent);
            this.classList.remove("expanded");
        });
    }

    private initDropdownContainers(): void {
        const children = Array.from(this.children) as HTMLElement[];
        const headerIndex = children.findIndex((child) => child.classList.contains("custom-dropdown-header"));
        let header: HTMLElement;
        if (headerIndex === -1) {
            header = document.createElement("div");
            header.classList.add("custom-dropdown-header");
            this.appendChild(header);
        } else {
            header = children[headerIndex];
            children.splice(headerIndex, 1);
        }

        const listIndex = children.findIndex((child) => child.classList.contains("custom-dropdown-list"));
        let list: HTMLElement;
        if (listIndex === -1) {
            list = document.createElement("ul");
            list.classList.add("custom-dropdown-list");
            this.appendChild(list);
        } else {
            list = children[listIndex];
            children.splice(listIndex, 1);
        }

        // Handle sorting any other children
        const newChildrenParent = headerIndex !== -1 ? list : header;
        for (const child of children) {
            child.tabIndex = 0;
            newChildrenParent.appendChild(child);
        }
    }

    public override disconnectedCallback(): void {
        
    }

    public override attributeChangedCallback(name: string, oldValue: Attribute, newValue: Attribute): boolean | null {
        const isValid = super.attributeChangedCallback(name, oldValue, newValue);
        if (isValid !== true) return isValid;

        switch(name) {
            case "value":
                this.style.setProperty("--value", `'${newValue}'`, "important");
                break;
        }

        return true;
    }
}

customElements.define("custom-dropdown", CustomDropdown);