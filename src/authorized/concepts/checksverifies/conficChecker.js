const fs = require('fs').promises;
const path = require('path');
const userAgent = require('user-agent');

function browservalid(brw, browsers) {
    return browsers.includes(brw);
}

async function ConfigReq(JBDY) {
    try {
        const filePath = path.join('src', 'authorized', 'concepts', 'confic', 'authConfic.json');
        const { origin, uagent } = JBDY;
        const data = await fs.readFile(filePath, 'utf8');
        const Jdata = JSON.parse(data);
        const { origins, browsers } = Jdata;
        const agent = userAgent.parse(uagent);
        const browser = agent.name;

        const brwValid = browservalid(browser, browsers);
        if (!brwValid) {
            return false;
        }

        return origins.includes(origin);
    } catch (error) {
        console.error('Error in ConfigReq:', error);
        return false;
    }
}

module.exports = ConfigReq;