import { render, h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Layout, TerminalOutput, MduiTextField, MduiSelect } from "./components";
// import { Obj2Voxel } from "./obj2voxel";
import Dropzone from "react-dropzone";
/// <reference types="mdui/jsx.zh-cn.d.ts" />
function App() {
    const [output, setOutput] = useState("");
    const center_max_style = "width:100%;height:100%;display:flex;justify-content:center;align-items:center;"
    const [files, setFiles] = useState([]);
    const [downFiles, setDownFiles] = useState([]);
    const [resolution, setResolution] = useState(128);
    const [permutation, setPermutation] = useState("zxy");
    const [strat,setStrat] = useState("max");
    async function runCommandAndOutput(command) {
        // while(!ModulePatcher.isInited){}
        await new Promise((resolve, reject) => {
            setInterval(() => {
                if (ModulePatcher.isInited) {
                    resolve();
                }
            }, 1)
        });
        ModulePatcher._print = (msg) => {
            setOutput((output) => output + "[输出]" + msg + "\n");
        }
        ModulePatcher._printErr = (msg) => {
            setOutput((output) => output + "[错误]" + msg + "\n");
        }
        Module.callMain(command);
    };
    useEffect(() => { runCommandAndOutput(["--version"]) }, []);
    async function convert() {
        setOutput("");
        setDownFiles([]);
        await runCommandAndOutput(["--version"]);
        Module.FS.mkdirTree("/tmp");
        Module.FS.mkdirTree("/res");
        // clear the files in /tmp and /res
        let _files = Module.FS.readdir("/tmp");
        for (let file of _files) {
            if(file=="."||file=="..") continue;
            Module.FS.unlink("/tmp/"+file);
        }
        _files = Module.FS.readdir("/res");
        for (let file of _files) {
            if(file=="."||file=="..") continue;
            Module.FS.unlink("/res/"+file);
        }
        Module.FS.chdir("/");
        let objFiles = [];
        files.forEach((file) => {
            if (file.name.endsWith(".obj")) {
                objFiles.push(file.name);
            }
        });
        for (let file of files) {
            let data = new Uint8Array(await file.arrayBuffer());
            Module.FS.writeFile("/tmp/" + file.name, data);
        }
        for (let filename of objFiles) {
            let cmd=["/tmp/" + filename, "/res/" + filename.replace(".obj", ".vox"), "-r", `${resolution}`,"-s",strat,"-p",permutation, "-j", "0"];
            ModulePatcher.print(`正在转换 ${filename}`);
            ModulePatcher.print(`wasm> obj2voxel ${cmd.join(" ")}`);
            await runCommandAndOutput(cmd);
        }
        Module.FS.readdir("/res").forEach((file) => {
            if (file.endsWith(".vox")) {
                console.log(file);
                setDownFiles((old) => {
                    return [...old, file];
                });
            }
        });
        mdui.snackbar({
            message: "转换完成",
        })
    }
    function download(file) {
        let data = Module.FS.readFile("/res/" + file);
        let blob = new Blob([data.buffer]);
        let url = URL.createObjectURL(blob);
        let a = document.createElement("a");
        a.href = url;
        a.download = file;
        a.click();
        URL.revokeObjectURL(url);
    }
    return <Layout title={"在线obj转vox"}>
        <div class="mdui-prose">
            <p>将obj文件转换为vox文件，利用WebAssembly。你可以上传多个文件，如果你的模型有mtl也可以一同上传（但如果存在texture之类文件夹的话需要自行修改路径）</p>
            <hr style={"margin-top:0px;"} />
        </div>
        <div style={"padding: 32px;"}>
            <h3>Step1: 上传</h3>
            <mdui-card style="width: 100%;height: 100px;flex: 1;justify-content: center;align-items: center;">
                <Dropzone onDrop={acceptedFiles => {
                    // setFiles(files.concat(acceptedFiles))
                    // 需要去重，覆盖已有同名
                    acceptedFiles.forEach((file) => {
                        if (files.find((f) => f.name == file.name)) {
                            setFiles((old) => old.filter((f) => f.name != file.name));
                        }
                    });
                    setFiles((old) => old.concat(acceptedFiles));
                }}>
                    {({ getRootProps, getInputProps }) => (
                        <section style={center_max_style}>
                            <div {...getRootProps()} style={center_max_style}>
                                <input {...getInputProps()} />
                                <p style={center_max_style}>
                                    <mdui-icon name="upload"></mdui-icon>
                                    拖拽或点击此处上传文件(可上传多个)
                                </p>
                            </div>
                        </section>
                    )}
                </Dropzone>
            </mdui-card>
            <mdui-list>
                <mdui-list-subheader>已上传文件列表</mdui-list-subheader>
                {files.map(file => {
                    return <mdui-list-item>
                        {file.name}
                        <mdui-button-icon slot="end-icon" icon="delete" onClick={() => { setFiles(files.filter(f => f !== file)) }}></mdui-button-icon>
                    </mdui-list-item>
                })}
            </mdui-list>
            <h3>Step2: 配置</h3>
            <MduiTextField type="number" value={resolution} onChange={(e) => setResolution(e.target.value)} label="分辨率（-r[resolution]）" helper="分辨率，可以试试128,256,1024等[建议128，太大会卡]"></MduiTextField>
            <MduiTextField value={permutation} onChange={(e) => setPermutation(e.target.value)}abel="轴排列（-p[permutation]）" helper="xyz,xYz,zxy等等 大写=翻转 可以调试出满意结果"></MduiTextField>
            <MduiSelect value={strat} onChange={(e) => setStrat(e.target.value)} label="颜色策略（--strat）">
                <mdui-menu-item value="max">max（默认）</mdui-menu-item>
                <mdui-menu-item value="blend">blend（平滑，但可能会产生其它颜色）</mdui-menu-item>
            </MduiSelect>
            <h3>Step3: 转换</h3>
            <mdui-button full-width onClick={() => { convert() }}>开始转换</mdui-button>
            <mdui-list>
                <mdui-list-subheader>转换结果</mdui-list-subheader>
                {downFiles.map(file => {
                    return <mdui-list-item>
                        {file}
                        <mdui-button-icon slot="end-icon" icon="download" onClick={() => { download(file) }}></mdui-button-icon>
                    </mdui-list-item>
                })}
            </mdui-list>
            <div class="mdui-prose">
                <hr style={"margin: 0px;"}></hr>
                {/* <pre id="output"><code>{output}</code></pre> */}
                <TerminalOutput output={output}></TerminalOutput>
                <hr />
                <a href="https://github.com/tobylai-toby/OnlineObj2Voxel">Open-source on Github ↗</a>
            </div>
        </div>
    </Layout>
}

// @ts-ignore: some doc issues
render(<App />, document.body);