import bcrypt from "bcrypt";

//for hashing the password
export const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(12, (err, salt) => {
      if (err) {
        reject(err);
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          reject(err);
        } else {
          resolve(hash);
        }
      });
    });
  });
};

//for comparing the input password and hashed password in db
export const comparePassword = (password, hashed) => {
  return bcrypt.compare(password, hashed);
};
