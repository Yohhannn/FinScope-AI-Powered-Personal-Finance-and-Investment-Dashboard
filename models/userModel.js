const db = require("../config/db");

const UserModel = {
    // Find a user by email
    findByEmail: async (email) => {
        const query = 'SELECT * FROM "user" WHERE email = $1';
        const result = await db.query(query, [email]);
        return result.rows[0];
    },

    // Create a new user
    createUser: async (name, email, hashedPassword) => {
        const query = `
      INSERT INTO "user" (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING user_id, name, email, created_at
    `;
        const result = await db.query(query, [name, email, hashedPassword]);
        return result.rows[0];
    },
};

module.exports = UserModel;