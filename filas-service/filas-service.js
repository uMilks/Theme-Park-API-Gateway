
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

// Cria a tabela filas, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS filas 
        (pessoas NUMERIC NOT NULL, id INTEGER PRIMARY KEY NOT NULL UNIQUE)`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela.');
              throw err;
           }
      });    

// Método HTTP GET /Filas - retorna todos as filas
app.get('/Filas', (req, res, next) => {
    db.all(`SELECT * FROM filas`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /Filas/:id - retorna filas com base no id
app.get('/Filas/:id', (req, res, next) => {
    db.get( `SELECT * FROM filas WHERE id = ?`, 
            req.params.id, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Fila não encontrada.");
            res.status(404).send('Fila não encontrada.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP POST /Filas - cadastra uma nova fila
app.post('/Filas', (req, res, next) => {
    db.run(`INSERT INTO filas(pessoas, id) VALUES(?,?)`, 
         [req.body.pessoas, req.body.id], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao cadastrar fila.');
        } else {
            console.log('Fila cadastrada com sucesso!');
            res.status(200).send('Fila cadastrada com sucesso!');
        }
    });
});

// Método HTTP PATCH /Filas/:id - altera uma fila
app.patch('/Filas/:id', (req, res, next) => {
    db.run(`UPDATE filas SET pessoas = COALESCE(?,pessoas) WHERE id = ?`,
           [req.body.pessoas, req.params.id], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Fila não encontrada.");
                res.status(404).send('Fila não encontrada.');
            } else {
                res.status(200).send('Fila alterada com sucesso!');
            }
    });
});

// Método HTTP PATCH /Filas/IO/:id - altera o número de pessoas numa fila
app.patch('/Filas/IO/:id', (req, res, next) => {
    // Primeiro faz um SELECT tanto para checar se a fila existe como para pegar os dados dela.
    db.get( `SELECT * FROM filas WHERE id = ?`, 
            req.params.id, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Fila não encontrada.");
            res.status(404).send('Fila não encontrada.');
        } else {
            // req.body.inOut pode servir para adicionar uma pessoa se for inserido 1 ou remover pessoas se for inserido -30.
            // se a atração tira mais pessoas do que tem na fila (caso o código da atração tire 30 pessoas de uma vez ao invés de uma por uma),
            // ela zera o número de pessoas para não deixar um número negativo passar.
            let inOut = Number(req.body.inOut);
            let pessoas_alteradas = result.pessoas + inOut > 0 ? result.pessoas + inOut : 0
            db.run(`UPDATE filas SET pessoas = COALESCE(?,pessoas) WHERE id = ?`,
                [pessoas_alteradas, req.params.id], function(err) {
                    if (err){
                        res.status(500).send('Erro ao alterar dados.');
                    } else {
                        res.status(200).send('Fila alterada com sucesso!');
                    }
            });
        }
    });
});

// Método HTTP DELETE /Filas/:id - remove uma fila
app.delete('/Filas/:id', (req, res, next) => {
    db.run(`DELETE FROM filas WHERE id = ?`, req.params.id, function(err) {
      if (err){
         res.status(500).send('Erro ao remover fila.');
      } else if (this.changes == 0) {
         console.log("Fila não encontrada.");
         res.status(404).send('Fila não encontrada.');
      } else {
         res.status(200).send('Fila removida com sucesso!');
      }
   });
});

// Inicia o Servidor na porta 8060
let porta = 8060;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});