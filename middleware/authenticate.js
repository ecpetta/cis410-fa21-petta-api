const jwt = require("jsonwebtoken");
const db = require("../dbConnectExec.js");
const pettaConfig = require("../config.js")

const auth = async(req,res,next)=>{
    // console.log("in the middleware", req.header("Authorization"));
    // next();

    try{
        //1. decode token

        let myToken = req.header("Authorization").replace("Bearer ", "");
        // console.log("token", myToken);

        let decoded = jwt.verify(myToken, pettaConfig.JWT);
        console.log(decoded);

        let customer_id = decoded.pk;

        //2. compare token with database

        let query = 
        `SELECT customer_id, first_name, last_name,customer_phone,customer_email
        FROM Customer
        WHERE customer_id = ${customer_id} and token = '${myToken}'`;

        let returnedUser = await db.executeQuery(query);
        console.log("returned user", returnedUser);

        //3. save user info in the request
        if(returnedUser[0]){
            req.contact = returnedUser[0];
            next();
        }
        else{
            return res.status(401).send("Invalid credentials");
        }
    }
    catch(err){
        console.log(err);
        return res.status(401).send("invalid credentials");
    }
}

module.exports = auth;