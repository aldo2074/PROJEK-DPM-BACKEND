// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    profileImage: {
        data: Buffer,      // Data biner gambar
        contentType: String, // Tipe MIME gambar (e.g., image/jpeg, image/png)
    },
});

module.exports = mongoose.model('User', userSchema);
