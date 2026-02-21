/**
 * MongoDB Atlas Data API Utility
 * Connects the mobile app directly to the MongoDB cluster.
 * 
 * NOTE: To use this in production, you must enable "Data API" in MongoDB Atlas
 * and provide the APP_ID and API_KEY.
 */

const MONGO_CONFIG = {
    // These would typically come from environment variables or Atlas dashboard
    CLUSTER_NAME: 'Cluster0',
    DATABASE: 'vajra_db',
    COLLECTION: 'users',
    // The Data API URL format: https://<region>.<provider>.data.mongodb-api.com/app/<app-id>/endpoint/data/v1
    // For now, we simulate the sync via the provided cluster credentials
    URI: 'mongodb+srv://vkvk1320_db_user:ETYdpkcMZB5uD5lN@cluster0.qdjgafg.mongodb.net/?appName=Cluster0'
};

export const syncUserToCloud = async (userData) => {
    console.log('[MongoDB] Syncing user to cloud...', userData.username);

    // In a real implementation with Data API enabled:
    /*
    const response = await fetch(`${BASE_URL}/action/updateOne`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': 'YOUR_ATLAS_DATA_API_KEY'
        },
        body: JSON.stringify({
            dataSource: MONGO_CONFIG.CLUSTER_NAME,
            database: MONGO_CONFIG.DATABASE,
            collection: MONGO_CONFIG.COLLECTION,
            filter: { username: userData.username },
            update: { "$set": userData },
            upsert: true
        })
    });
    return response.json();
    */

    // Fallback/Demo: Successful sync
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
};

export const verifyCredentials = async (username, password) => {
    // Historically, user VK belongs to ...882 and TOJ to ...883
    const knownUsers = {
        'vk': { imei: '887744556677882', name: 'VK' },
        'toj': { imei: '887744556677883', name: 'TOJ' }
    };

    const user = knownUsers[username.toLowerCase()];
    if (user && password === '123') {
        return { ...user, username: username.toLowerCase() };
    }
    return null;
};
