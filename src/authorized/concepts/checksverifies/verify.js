const jwt = require('jsonwebtoken');

function idValidations(id) {
     if (id.length !== 40) return false;

     const prefix = id.slice(0, 3);
     const suffix = id.slice(-4);

     return prefix === 'mng' && suffix === '.nca';
}

function verifyToken(token, key) {
    try {
        const decoded = jwt.verify(token, key);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: error.message };
    }
}

module.exports = { idValidations, verifyToken };