
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const normalizeEmails = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[INFO] Connected to MongoDB');

        const users = await User.find({});
        console.log(`[INFO] Found ${users.length} users`);

        let updatedCount = 0;
        for (let user of users) {
            const lowerEmail = user.email.toLowerCase();
            if (user.email !== lowerEmail) {
                user.email = lowerEmail;
                await user.save();
                updatedCount++;
                console.log(`[OK] Updated user: ${user.name} (${user.email})`);
            }
        }

        console.log(`[SUCCESS] Migration finished. Updated ${updatedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error('[ERROR] Migration failed:', error);
        process.exit(1);
    }
};

normalizeEmails();
