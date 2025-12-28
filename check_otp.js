const mongoose = require('mongoose');

async function main() {
    try {
        await mongoose.connect('mongodb://localhost:27017/ecommerce');
        // Using strict: false to access fields without defining full schema
        const userSchema = new mongoose.Schema({}, { strict: false });
        // Assuming collection name is 'users' based on Mongoose default naming convention for 'User' model
        const User = mongoose.model('User', userSchema, 'users');

        const user = await User.findOne({ email: '233000@students.au.edu.pk' });
        if (user) {
            console.log(`OTP for ${user.email}: ${user.emailVerificationOtp || 'No OTP found'}`);
        } else {
            console.log('User not found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

main();
