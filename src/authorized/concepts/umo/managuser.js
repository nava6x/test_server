const { db } = require("../confic/firebaseConfic");

/**
 * Update `tid` in a given Firebase Realtime Database path with transaction safety.
 * @param {string} path - The database path to update.
 * @param {string|number} tid - The new transaction ID to be stored.
 * @returns {Promise<boolean>} - Returns `true` if update succeeds, `false` otherwise.
 */
async function updateTid(path, tid) {
    try {
        const ref = db.ref(path);
        
        const result = await ref.transaction((currentData) => {
            if (currentData) {
                return { ...currentData, tid }; // Merge new tid safely
            }
            return { tid }; // If no data exists, create new
        });

        if (result.committed) return true;
        else return false;
    } catch (error) {
        console.error("❌ Firebase updateTid error:", error);
        throw new Error("Failed to update tid");
    }
}

module.exports = { updateTid };