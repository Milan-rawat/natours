const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const Review = require('../models/reviewModel');
const User = require('../models/userModel');

mongoose
    .connect(process.env.DATABASE_LOCAL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        family: 4,
    })
    .then(async () => {
        const reviews = await Review.find().lean();
        const userIds = (await User.find().lean()).map((u) => u._id.toString());

        const orphaned = reviews.filter(
            (r) => !r.user || !userIds.includes(r.user.toString())
        );
        console.log('Orphaned reviews found:', orphaned.length);

        if (orphaned.length > 0) {
            const ids = orphaned.map((r) => r._id);
            await Review.deleteMany({ _id: { $in: ids } });
            console.log('Deleted orphaned reviews.');
        } else {
            console.log('No cleanup needed.');
        }

        process.exit();
    });
