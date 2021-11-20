const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("./dbConnectExec.js")
const pettaConfig = require("./config.js");
const auth = require("./middleware/authenticate")

const app = express();
app.use(express.json());

//azurewebsites.net, colostate.edu
app.use(cors());
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
});

app.get("/hi", (req,res) => {
    res.send("Hello world.");
});

app.get("/", (req,res) => {
    res.send("API is running.");
});

// app.post();
// app.put();

app.post("/customers/logout", auth, (req,res) => {
    let query = 
    `UPDATE Customer 
    SET token = NULL 
    WHERE customer_id = ${req.customer.customer_id}`;

    db.executeQuery(query)
    .then(()=>{res.status(200).send()})
    .catch((err)=>{
        console.log("error in POST /customers/logout", err);
        res.status(500).send()
    })
})


app.post("/orders", auth, async (req,res) => {
    try{
        let order_id = req.body.order_id;
        let order_contents = req.body.order_contents;
        let order_total = req.body.order_total;
        let order_payment_method = req.body.order_payment_method

        if(!order_id || !order_contents || !order_total || !Number.isInteger(order_total) || !order_payment_method){return res.status(400).send("bad request")};

        order_contents = order_contents.replace("'","''");

        // console.log("order contents", order_contents);
        // console.log("here is the contact", req.contact);

        res.send("here is the response");
    }
    catch(err){
        console.log("error in POST /restaurants", err);
        res.status(500).send();
    }
})

app.get("/customers/me", auth, (req,res)=>{
    res.send(req.customer)
})

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

app.get("/restaurants", (req,res) => {
    //get data from database
    db.executeQuery(`SELECT * FROM [dbo].[Restaurant]`)
    .then((theResults) => { 
        res.status(200).send(theResults);
    })
    .catch((myError)=> {
        console.log(myError);
        res.status(500).send();
    })
});

app.get("/restaurants/:restaurant_id", (req,res) => {
    let order_id = req.params.order_id;
    //console.log(order_id);
    let myQuery = `SELECT *
    FROM [dbo].[Restaurant]
    WHERE restaurant_id = ${restaurant_id}`

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
        console.log("Error in /restaurants/:restaurant_id", err);
        res.status(500).send()
    });
});