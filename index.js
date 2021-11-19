const express = require("express");

const db = require("./dbConnectExec.js")

const app = express();

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

app.get("/customers", (req,res) => {
    //get data from database
    db.executeQuery(`SELECT * FROM Customer`)
    .then((theResults) => { 
        res.status(200).send(theResults);
    })
    .catch((myError)=> {
        console.log(myError);
        res.status(500).send();
    })
});

app.get("/customers/:customer_id", (req,res) => {
    let customer_id = req.params.customer_id;
    //console.log(customer_id);
    let myQuery = `SELECT *
    FROM Customer
    WHERE customer_id = ${customer_id}`

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
        console.log("Error in /customers/:customer_id", err);
        res.status(500).send()
    });
});