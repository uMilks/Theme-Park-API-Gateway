
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

// Cria a tabela esperas, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS esperas 
        (tempo time NOT NULL, id INTEGER PRIMARY KEY NOT NULL UNIQUE, 
        )`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela.');
              throw err;
           }
      });    

// Método HTTP GET /Esperas - retorna todos as esperas
app.get('/Esperas', (req, res, next) => {
    db.all(`SELECT * FROM esperas`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /Esperas/:id - retorna esperas com base no id
app.get('/Esperas/:id', (req, res, next) => {
    db.get( `SELECT * FROM esperas WHERE id = ?`, 
            req.params.id, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Espera não encontrada.");
            res.status(404).send('Espera não encontrada.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP POST /Esperas - cadastra uma nova espera
app.post('/Esperas', (req, res, next) => {
    db.run(`INSERT INTO esperas(tempo, id) VALUES(?,?)`, 
         [req.body.tempo, req.body.id], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao cadastrar espera.');
        } else {
            console.log('Espera cadastrada com sucesso!');
            res.status(200).send('Espera cadastrada com sucesso!');
        }
    });
});

// Método HTTP PATCH /Esperas/:id - altera uma espera
app.patch('/Esperas/:id', (req, res, next) => {
    db.run(`UPDATE esperas SET tempo = COALESCE(?,tempo) WHERE id = ?`,
           [req.body.tempo, req.params.id], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Espera não encontrada.");
                res.status(404).send('Espera não encontrada.');
            } else {
                res.status(200).send('Espera alterada com sucesso!');
            }
    });
});

// Método HTTP PATCH /Esperas/IO/:id - altera o tempo de uma espera
// TODO: Modificar o funcionamento desse PATCH de filas para esperas!
app.patch('/Esperas/IO/:id', (req, res, next) => {
    // Primeiro faz um SELECT tanto para checar se a espera existe como para pegar os dados dela.
    db.get( `SELECT * FROM esperas WHERE id = ?`, 
            req.params.id, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Espera não encontrada.");
            res.status(404).send('Espera não encontrada.');
        } else {
            // req.body.inOut pode servir para adicionar tempo se for inserido uma pessoa na fila ou remover tempo se forem retiradas.
            // Se a fila tira pessoas o suficiente para negativar o tempo de espera,
            // ela zera o tempo para não deixar um número negativo passar.
            let tempo_alterado = result.tempo + req.body.inOut > 0 ? result.tempo + req.body.inOut : 0
            db.run(`UPDATE esperas SET tempo = COALESCE(?,tempo) WHERE id = ?`,
                [tempo_alterado, req.params.id], function(err) {
                    if (err){
                        res.status(500).send('Erro ao alterar dados.');
                    } else {
                        res.status(200).send('Espera alterada com sucesso!');
                    }
            });
        }
    });
});

//Método HTTP DELETE /Esperas/:id - remove uma atração
app.delete('/Esperas/:id', (req, res, next) => {
    db.run(`DELETE FROM esperas WHERE id = ?`, req.params.id, function(err) {
      if (err){
         res.status(500).send('Erro ao remover espera.');
      } else if (this.changes == 0) {
         console.log("Espera não encontrada.");
         res.status(404).send('Espera não encontrada.');
      } else {
         res.status(200).send('Espera removida com sucesso!');
      }
   });
});

// Inicia o Servidor na porta 8050
let porta = 8050;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});