const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/verifiedusers';

const userSchema = new mongoose.Schema({
     users: Object,
     SESSIONID: String
});

const User = mongoose.model('datasetofusers', userSchema);
async function getUsers(ncid) {
     try {
          await mongoose.connect(uri, {
               useNewUrlParser: true,
               useUnifiedTopology: true,
          });

          const users = await User.find({});
          for (const user of users) {
          
          if (user.users && user.users[ncid]) {
          return [true, user.users[ncid], user._id];
          }
          }
          return [false];
     } catch (error) {
          console.error('Error:', error.message);
          throw error;
     } finally {
          await mongoose.disconnect();
          console.log("\x1b[41m Mongoose disconnected by getUsers \x1b[0m")
     }
}

module.exports = { getUsers };