const { getUsers } = require("./concepts/checksverifies/baseChecker");
const { idValidations, verifyToken } = require("./concepts/checksverifies/verify");
const AReq = require('./concepts/checksverifies/conficChecker');
const { updateTid } = require('./concepts/umo/managuser');

async function CoreVerification(handshake, socketId) {
    try {
        const { "user-agent": userAgent, origin } = handshake.headers;
        const AREQSATE = await AReq({ uagent: userAgent, origin });

        if (!AREQSATE) {
            return [false, "Invalid request state"];
        }

        const { token, userinfo } = handshake.auth;
        const pid = userinfo[1];
        const visitorId = userinfo[2];
        const path = userinfo[3];

        if (pid.length < 7) {
            return [false, "Invalid pid length"];
        }

        const [STATE, BOD] = await getUsers(pid);
        if (!STATE) {
            return [false, "User not found"];
        }

        const { KEY, AGENT, VISITORID } = BOD;
        const body = verifyToken(token, KEY);

        if (!body.valid) {
            return [false, "Invalid token"];
        }

        const [ncid, apid] = body.decoded.iap;
        if (!idValidations(ncid)) {
            return [false, "Invalid ncid"];
        }

        if (apid !== pid) {
            return [false, "apid does not match pid"];
        }

        if (AGENT !== userAgent) {
            return [false, "User agent mismatch"];
        }

        if (VISITORID !== visitorId) {
            return [false, "Visitor ID mismatch"];
        }
        const savedState = await updateTid(path, socketId);
        if(savedState) return [true, pid, userAgent];
        else return [false, "Does not saved in umo database"];
    } catch (error) {
        console.error("CoreVerification error:", error);
        return [false, "Internal server error"];
    }
}

module.exports = CoreVerification;