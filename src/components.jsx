import { useEffect, useRef } from 'preact/hooks';
export function Layout({ children, title }) {
    return <mdui-layout>
        <mdui-top-app-bar>
            <mdui-top-app-bar-title>{title}</mdui-top-app-bar-title>
        </mdui-top-app-bar>

        <mdui-layout-main style="min-height: 300px">{children}</mdui-layout-main>
    </mdui-layout>
}

export function TerminalOutput({ output }) {
    const outputRef = useRef(null);

    // 自动滚动到底部
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);  // 当 output 更新时触发

    return (
        <pre
            ref={outputRef}
            style={{
                height: '300px',
                overflowY: 'auto',
                padding: '10px',
                fontFamily: 'monospace',
            }}
        >
            {output}
        </pre>
    );
}

export function MduiTextField({onChange, ...props}) {
    const ref = useRef(null);
    useEffect(() => {
        ref.current.addEventListener('change', onChange);

        return () => {
            ref.current.removeEventListener('change', onChange);
        };
    }, []);
    return <mdui-text-field ref={ref} {...props}></mdui-text-field>
}
export function MduiSelect({onChange, ...props}) {
    const ref = useRef(null);
    useEffect(() => {
        ref.current.addEventListener('change', onChange);

        return () => {
            ref.current.removeEventListener('change', onChange);
        };
    }, []);
    return <mdui-select ref={ref} {...props}></mdui-select>
}