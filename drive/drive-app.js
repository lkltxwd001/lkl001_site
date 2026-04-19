'use strict';

const DriveModule = {
    init() {
        console.log('[lkl001] Drive Module Ready');
        // 未来在这里对接 API
    }
};

const AgentModule = {
    init() {
        console.log('[lkl001] Agent Module Ready');
    }
};

const DriveApp = {
    modules: [DriveModule, AgentModule],
    init() {
        // 打印版本信息，保持和你 app.js 一致的风格
        console.log(
            '%c lkl001_site · Drive v0.1.0 ',
            'background:#161c1a;color:#3d9970;font-family:monospace;padding:4px 8px;border-radius:4px'
        );
        this.modules.forEach(mod => mod.init());
    }
};

document.addEventListener('DOMContentLoaded', () => DriveApp.init());