// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Importa o package do SQLite
const sqlite3 = require('sqlite3');

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database('./dados.db', (err) => {
        if (err) {
            console.log('ERRO: não foi possível conectar ao SQLite.');
            throw err;
        }
        console.log('Conectado ao SQLite!');
    });

// Cria a tabela ingressos, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS ingressos
        (email TEXT PRIMARY KEY NOT NULL UNIQUE, tipo INTEGER NOT NULL, dataEfetivacao DATE NOT NULL, usos INTEGER NOT NULL, usoMax INTEGER)`, 
        [], (err) => {
            if (err) {
                console.log('ERRO: não foi possível criar tabela.');
                throw err;
            }
        });

// Método HTTP GET /Ingressos - retorna todos os ingressos
app.get('/Ingressos', (req, res, next) => {
    db.all(`SELECT * FROM ingressos`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /Ingressos/:email - retorna ingresso do cliente com base no email
app.get('/Ingressos/:email', (req, res, next) => {
    db.get( `SELECT * FROM ingressos WHERE email = ?`, 
            req.params.email, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Ingresso não encontrado.");
            res.status(404).send('Ingresso não encontrado.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP PATCH /Ingressos/addUso/:email - altera o número de usos em um ingresso com base no email
app.patch('/Ingressos/addUso/:email', (req, res, next) => {
    db.run(`UPDATE ingressos SET usos = COALESCE(?,usos) WHERE email = ?`,
           [req.body.usos, req.body.email], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Ingresso não encontrado.");
                res.status(404).send('Ingresso não encontrado.');
            } else {
                res.status(200).send('Ingresso alterado com sucesso!');
            }
    });
});

// Método HTTP PATCH /Ingressos/:email - altera um ingresso com base no email
app.patch('/Ingressos/:email', (req, res, next) => {
    db.run(`UPDATE ingressos SET tipo = COALESCE (?,tipo), SET dataEfetivacao = COALESCE(?,dataEfetivacao), SET usos = COALESCE(?,usos), SET usoMax = (?,usoMax) WHERE email = ?`,
           [req.body.tipo, req.body.dataEfetivacao, req.body.usos, req.body.usoMax, req.body.email], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Ingresso não encontrado.");
                res.status(404).send('Ingresso não encontrado.');
            } else {
                res.status(200).send('Ingresso alterado com sucesso!');
            }
    });
});

// Inicia o Servidor na porta 8090
let porta = 8090;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});