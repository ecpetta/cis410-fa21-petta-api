const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./dbConnectExec.js")
const pettaConfig = require("./config.js");

const app = express();
app.use(express.json());

app.listen(5000, () => {
    console.log('App is running on port 5000');
});

app.get("/hi", (req,res) => {
    res.send("Hello world.");
});

app.get("/", (req,res) => {
    res.send("API is running.");
});

// app.post();
// app.put();

app.post("/customers/login", async (req,res) => {
    // console.log('/customers/login called', req.body);

    //1. Data validation
    let email = req.body.email;
    let password = req.body.password;

    if(!email || !password) {
        return res.status(400).send("Bad request")
    }

    //2. Check that user exists in database
    let query = 
    `SELECT *
    FROM Customer
    WHERE customer_email = '${email}'`

    let result;
    try {
        result = await db.executeQuery(query);
    } catch (myError) {
        console.log("error in /customers/login", myError);
        return res.status(500).send();
    }


    // console.log("result", result);

    if(!result[0]) {
        return res.status(401).send("Invalid user credentials");
    }

    //3. Check password

    let user = result[0];

    if (!bcrypt.compareSync(password, user.password)) {
        console.log("Invalid password");
        return res.status(401).send("Invalid user credentials");
    }

    //4. Generate token

    let token = jwt.sign({pk:user.customer_id},pettaConfig.JWT,{expiresIn: "60 minutes"});
    // console.log("token", token);

    //5. Save token in database and send response

    let setTokenQuery = 
    `UPDATE Customer
    SET token = '${token}'
    WHERE customer_id = ${user.customer_id}`

    try{
        await db.executeQuery(setTokenQuery)

        res.status(200).send({
            token: token,
            user:{
                nameFirst: user.first_name,
                nameLast: user.last_name,
                email: user.customer_email,
                customer_id: user.customer_id
            }
        })
    } 
    catch(myError){
        console.log("error in setting user token", myError);
        res.status(500).send()
    }

});

app.post("/customers", async(req, res) => {
    // res.send("/contacts called");
    // console.log("request body", req.body)

    let nameFirst = req.body.nameFirst;
    let nameLast = req.body.nameLast;
    let phone = req.body.phone;
    let password = req.body.password;
    let email = req.body.email;

    if(!nameFirst || !nameLast || !email || !password){return res.status(400)
        .send("Bad request")};

    nameFirst = nameFirst.replace("'", "''");
    nameLast = nameLast.replace("'","''");

    let emailCheckQuery = `
    SELECT customer_email
    FROM Customer
    WHERE customer_email = '${email}'`;

    let existingUser = await db.executeQuery(emailCheckQuery);

    // console.log("existing user", existingUser);

    if(existingUser[0]){return res.status(409).send("duplicate email")};

    let hashedPassword = bcrypt.hashSync(password);

    let insertQuery = 
    `INSERT INTO customer(first_name, last_name, customer_phone, password, customer_email)
    VALUES ('${nameFirst}','${nameLast}','${phone}','${hashedPassword}','${email}')`;

    db.executeQuery(insertQuery)
        .then(()=>{res.status(201).send()})
        .catch((err)=>{
            console.log("error in POST /customer", err);
            res.status(500).send();
        })

})

app.get("/orders", (req,res) => {
    //get data from database
    db.executeQuery(`SELECT * FROM [dbo].[Order]`)
    .then((theResults) => { 
        res.status(200).send(theResults);
    })
    .catch((myError)=> {
        console.log(myError);
        res.status(500).send();
    })
});

app.get("/orders/:order_id", (req,res) => {
    let order_id = req.params.order_id;
    //console.log(order_id);
    let myQuery = `SELECT *
    FROM [dbo].[Order]
    WHERE order_id = ${order_id}`

    db.executeQuery(myQuery)
    .then((result) => {
        // console.log("result", result);
        if(result[0]) {
            res.send(result[0]);
        } else {
            res.status(404).send(`bad request`);
        }
    })
    .catch((err) => {
        console.log("Error in /orders/:order_id", err);
        res.status(500).send()
    });
});