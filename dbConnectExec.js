const sql = require("mssql");
const pettaConfig = require("./config.js");

const config = {
    user: pettaConfig.DB.user,
    password: pettaConfig.DB.password,
    server: pettaConfig.DB.server,
    database: pettaConfig.DB.database,
};

async function executeQuery(aQuery) {
    let connection = await sql.connect(config);
    let result = await connection.query(aQuery);

    // console.log(result);
    return result.recordset;
}

// executeQuery(`SELECT *
// FROM Customer`);

module.exports = {executeQuery: executeQuery };