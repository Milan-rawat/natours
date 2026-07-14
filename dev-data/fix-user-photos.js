const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

mongoose
    .connect(process.env.DATABASE_LOCAL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        family: 4,
    })
    .then(async () => {
        // Update all users whose photo doesn't already have the uploads/ prefix
        const users = await mongoose.connection
            .collection('users')
            .find({ photo: { $not: /^uploads\// } })
            .toArray();

        console.log('Users needing photo path update:', users.length);

        for (const u of users) {
            await mongoose.connection.collection('users').updateOne(
                { _id: u._id },
                { $set: { photo: `uploads/${u.photo}` } }
            );
            console.log(`Updated: ${u.email} -> uploads/${u.photo}`);
        }

        console.log('Done.');
        process.exit();
    });
