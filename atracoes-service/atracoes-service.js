
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

// Cria a tabela atracoes, caso ela não exista
// duracao está em segundos
db.run(`CREATE TABLE IF NOT EXISTS atracoes 
        (nome TEXT NOT NULL, id INTEGER PRIMARY KEY NOT NULL UNIQUE, 
         capacidade INTEGER NOT NULL, duracao NUMERIC NOT NULL)`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela.');
              throw err;
           }
      });    

// Método HTTP GET /Atracoes - retorna todos as atracoes
app.get('/Atracoes', (req, res, next) => {
    db.all(`SELECT * FROM atracoes`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /Atracoes/:id - retorna atração com base no id
app.get('/Atracoes/:id', (req, res, next) => {
    db.get( `SELECT * FROM atracoes WHERE id = ?`, 
            req.params.id, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Atração não encontrada.");
            res.status(404).send('Atração não encontrada.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP POST /Atracoes - cadastra uma nova atração
app.post('/Atracoes', (req, res, next) => {
    db.run(`INSERT INTO atracoes(nome, id, capacidade, duracao) VALUES(?,?,?,?)`, 
         [req.body.nome, req.body.id, req.body.capacidade, req.body.duracao], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao cadastrar atração.');
        } else {
            console.log('Atração cadastrada com sucesso!');
            res.status(200).send('Atração cadastrada com sucesso!');
        }
    });
});

// Método HTTP PATCH /Atracoes/:id - altera uma atração
app.patch('/Atracoes/:id', (req, res, next) => {
    db.run(`UPDATE atracoes SET nome = COALESCE(?,nome), capacidade = COALESCE(?,capacidade), duracao = COALESCE(?,duracao) WHERE id = ?`,
           [req.body.nome, req.body.capacidade, req.body.duracao, req.params.id], function(err) {
            if (err){
                res.status(500).send('Erro ao alterar dados.');
            } else if (this.changes == 0) {
                console.log("Atração não encontrada.");
                res.status(404).send('Atração não encontrada.');
            } else {
                res.status(200).send('Atração alterada com sucesso!');
            }
    });
});

// Método HTTP DELETE /Atracoes/:id - remove uma atração
app.delete('/Atracoes/:id', async (req, res, next) => {
    fetch_del_fila = await fetch(`http://localhost:8000/Filas/${req.params.id}`, {
                method: "DELETE",
                headers: {'Content-Type': 'application/json'}
            });
    if (fetch_del_fila.status == 200 || fetch_del_fila.status == 404) {
        db.run(`DELETE FROM atracoes WHERE id = ?`, req.params.id, function(err) {
            if (err){
                res.status(500).send('Erro ao remover atração.');
            } else if (this.changes == 0) {
                console.log("Atração não encontrada.");
                res.status(404).send('Atração não encontrada.');
            } else {
                res.status(200).send('Atração removida com sucesso!');
            }
        });
    } else {
        res.status(500).send('Erro ao remover atração.');
    }
});

// Inicia o Servidor na porta 8070
let porta = 8070;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});