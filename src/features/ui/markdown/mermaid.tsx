import { ThemeProvider } from '@/features/theme/theme-provider';
import * as React from 'react';
import { create } from 'zustand';
import html2canvas from "html2canvas";
import { useEffect, useState } from 'react';
import { Button } from '../button';
import { CheckIcon, ClipboardIcon } from 'lucide-react';

/**
 * We are loading Mermaid from the CDN (and spending all the work to dynamically load it
 * and strong type it), because the Mermaid dependencies (npm i mermaid) are too heavy
 * and would slow down development for everyone.
 *
 * If you update this file, also make sure the interfaces/type definitions and initialization
 * options are updated accordingly.
 */
const MERMAID_CDN_FILE: string = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';


interface MermaidAPI {
initialize: (config: any) => void;
render: (id: string, text: string, svgContainingElement?: Element) => Promise<{ svg: string, bindFunctions?: (element: Element) => void }>;
}

// extend the Window interface, to allow for the mermaid API to be found
declare global {
// noinspection JSUnusedGlobalSymbols
interface Window {
mermaid: MermaidAPI;
}
}

interface MermaidAPIStore {
mermaidAPI: MermaidAPI | null,
loadingError: string | null,
}

const useMermaidStore = create<MermaidAPIStore>()(
() => ({
mermaidAPI: null,
loadingError: null,
}),
);

let loadingStarted: boolean = false;
let loadingError: string | null = null;


function loadMermaidFromCDN() {
if (!loadingStarted) {
loadingStarted = true;
const script = document.createElement('script');
script.src = MERMAID_CDN_FILE;
script.defer = true;
script.onload = () => {
    useMermaidStore.setState({
    mermaidAPI: initializeMermaid(window.mermaid),
    loadingError: null,
    });
};
script.onerror = () => {
    useMermaidStore.setState({
    mermaidAPI: null,
    loadingError: `Script load error for ${script.src}`,
    });
};
document.head.appendChild(script);
}
}

function initializeMermaid(mermaidAPI: MermaidAPI): MermaidAPI {
mermaidAPI.initialize({
startOnLoad: false,

// style configuration
htmlLabels: true,
securityLevel: 'loose',
theme: 'base',
themeVariables: {
    'primaryColor': '#0b0080',
    'primaryTextColor': '#fff',
    'primaryBorderColor': '#5ac4bd',
    'lineColor': "#fff",
    'textColor': "#fff",
    'secondaryColor': "#5ac4bd",
    'tertiaryColor': '#a3d8d4',
},

// per-chart configuration
mindmap: { useMaxWidth: true },
flowchart: { useMaxWidth: true },
sequence: { useMaxWidth: true },
timeline: { useMaxWidth: true },
class: { useMaxWidth: true },
state: { useMaxWidth: true },
pie: { useMaxWidth: true },
er: { useMaxWidth: true },
gantt: { useMaxWidth: true },
gitGraph: { useMaxWidth: true },
});
return mermaidAPI;
}

function useMermaidLoader() {
const { mermaidAPI } = useMermaidStore();
React.useEffect(() => {
if (!mermaidAPI)
    loadMermaidFromCDN();
}, [mermaidAPI]);
return { mermaidAPI, isSuccess: !!mermaidAPI, isLoading: loadingStarted, error: loadingError };
}


export function RenderCodeMermaid(props: { mermaidCode: string }) {

// state
const [svgCode, setSvgCode] = React.useState<string | null>(null);
const hasUnmounted = React.useRef(false);
const mermaidContainerRef = React.useRef<HTMLDivElement>(null);

// external state
const { mermaidAPI, error: mermaidError } = useMermaidLoader();


// [effect] re-render on code changes
React.useEffect(() => {

if (!mermaidAPI)
    return;

const updateSvgCode = () => {
    const elementId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
    mermaidAPI
    .render(elementId, props.mermaidCode, mermaidContainerRef.current!)
    .then(({ svg }) => {
        if (mermaidContainerRef.current && !hasUnmounted.current) {
        setSvgCode(svg);
        // bindFunctions?.(mermaidContainerRef.current);
        }
    })
    .catch((error) =>
        console.warn('The AI-generated Mermaid code is invalid, please try again. Details below:\n >>', error.message),
    );
};

// strict-mode de-bounce, plus watch for unmounts
hasUnmounted.current = false;
const timeout = setTimeout(updateSvgCode, 0);
return () => {
    hasUnmounted.current = true;
    clearTimeout(timeout);
};
}, [mermaidAPI, props.mermaidCode]);

// render errors when loading Mermaid. for syntax errors, the Error SVG will be rendered in-place
if (mermaidError)
return <div>Error: {mermaidError}</div>;

// eslint-disable-next-line react-hooks/rules-of-hooks
const [isIconChecked, setIsIconChecked] = useState(false);
const handleDownloadImage = async () => {
const element = mermaidContainerRef.current;

if(element === null){
    return;
}
setIsIconChecked(true);
const canvas = await html2canvas(element);
const data = canvas.toDataURL('image/png');
const link = document.createElement('a');

link.href = data;
link.download = 'downloaded-image.jpg';

document.body.appendChild(link);
link.click();
document.body.removeChild(link);
};

// eslint-disable-next-line react-hooks/rules-of-hooks
useEffect(() => {
const timeout = setTimeout(() => {
    setIsIconChecked(false);
}, 2000);

return () => clearTimeout(timeout);
}, [isIconChecked]);

return (
<pre>
    <div className="flex items-center justify-end">
        <Button
        variant={"ghost"}
        size={"sm"}
        title="Export image"
        className="justify-right flex gap-2"
        onClick={handleDownloadImage}
        >
        <span className="text-xs text-muted-foreground">Exporter</span>
        {isIconChecked ? (
            <CheckIcon size={16} />
        ) : (
            <ClipboardIcon size={16} />
        )}
        </Button>
    </div>
    <div className="overflow-auto bg-blue-900"
    ref={mermaidContainerRef}
    dangerouslySetInnerHTML={{ __html: svgCode || 'Loading Diagram...' }}
    />
</pre>
);

}
