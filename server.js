const dotenv = require('dotenv');
dotenv.config();
// morgan
const morgan = require('morgan');
// express library
const express = require('express');
const app = express();
// path built-in
const path = require('path');
// pool from pg
const {Pool} = require("pg");
const pool = new Pool({// Format: postgres://user:password@host:5432/database
    connectionString: process.env.DATABASE_URL, ...(process.env.NODE_ENV === 'production' ? {ssl: {rejectUnauthorized: false}} : {})});
//env
const {DATABASE_URL, NODE_ENV, PORT} = process.env;
// static file paths
app.use(express.static("public"));

// xu ly POST data tren url
app.use(express.urlencoded({extended: true}));
// data -> .json
app.use(express.json());
app.use(morgan('combined'));


// GET * from personnels
// app.get('/personnels', async (req, res) => {
//     pool.query('select * from personnels order by personnel_id desc', (err, data) => { // console.log(data);
//         const list = data.rows;
//         res.send(list);
//     });
// })

app.get('/get/info', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('select * from TABLE_NAME');
        res.send(result.rows);
        client.release();
    } catch (err) {
        console.error(err);
        res.send("Error " + err);
    }

});

//GET BY ID
app.get("/pets/:id", (req, res) => {
    const id = req.params.id;
    pool.query(`SELECT * FROM pets WHERE id = $1;`, [id]).then((data) => {
        const pet = data.rows[0];
        if (pet) {
            res.send(pet);
        } else {
            res.sendStatus(404);
        }
    });
});



// DELETE by id
app.delete('/remove/:id', (req, res, next) => {
    const id = req.params.id;
    pool.query("delete from TABLE_NAME where ID = $1", [id]).then((data) => {
        if (data.rows.length === 0) {
            res.sendStatus(404);
        } else {
            res.sendStatus(204);
        }
    });
});


// ADD personnels
app.post('/personnels/add', (req, res) => {
    const {name, position, status} = req.body;
    console.log(name, position, status);
    pool.query(`INSERT INTO personnels(name, position, status) VALUES($1, $2, $3) returning *;`, [
        name, position, status
    ], (data) => {});
    res.status(201).send('Success');
});

// UPDATE personnels
app.patch("/update/:id", (req, res) => {
    const personnel_id = Number(req.params.id);
    const {name, position, status} = req.body;
    if (Number.isNaN(personnel_id)) {
        res.status(400).send(`invalid id given "${
            req.params.id
        }"`);
    }
    pool.query(`
      UPDATE personnels
      SET name = COALESCE($1, name),
          position = COALESCE($2, position),
          status = COALESCE($3, status)
      WHERE personnel_id = $4
      returning *;
      `, [name, position, status, personnel_id]).then((result) => {
        if (result.rows.length === 0) {
            res.sendStatus(404);
        } else {
            res.send(result.rows[0]);
        }
    });
});


app.use((err, req, res, next) => {
    if (err) {
        res.sendStatus(500);
    }
})
app.use(function (req, res, next) {
    res.status(404);
})


app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`)
});

