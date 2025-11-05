
// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Importa o package do SQLite
const sqlite3 = require('sqlite3');

let esperas = {}

const recalc_loop = setInterval(async ()=>{
    const keys = Object.keys(esperas);
    for (let i=0; i < keys.length; i++) {
        esperas[keys[i]] = await recalcularEspera(keys[i]);
    }
}, 30000);

async function recalcularEspera(id) {
    try {
        const atracao_fetch = await fetch(`http://localhost:8000/Atracoes/${id}`);
        const fila_fetch = await fetch(`http://localhost:8000/Filas/${id}`);
        if (atracao_fetch.status == 200 && fila_fetch.status == 200) {
            atracao_data = await atracao_fetch.json();
            fila_data = await fila_fetch.json();
            let remaining_left = fila_data.pessoas / atracao_data.capacidade;
            let remaining_arredondado = ~~ remaining_left;
            // Isso significa que o resultado é fracionado, o que gera uma previsão imprecisa.
            if (remaining_arredondado < remaining_arredondado) {
                remaining_arredondado += 1
            }
            return remaining_arredondado * atracao_data.duracao
        } else {
            console.log('Erro ao recalcular tempo de espera da fila ' + id);
        }
    } catch (e) {
        console.error("Erro: " + e);
    }
}

/*
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
        (tempo time NOT NULL, id INTEGER PRIMARY KEY NOT NULL UNIQUE)`, 
        [], (err) => {
           if (err) {
              console.log('ERRO: não foi possível criar tabela.');
              throw err;
           }
      });    
*/

// Método HTTP GET /Esperas - retorna todos as esperas
app.get('/Esperas', (req, res, next) => {
    /*db.all(`SELECT * FROM esperas`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
    */
   try {
        if (esperas) {
            res.status(200).json(esperas);
        } else {
            throw Error("Erro ao obter dados de esperas.");
        }
    } catch (err) {
        console.log("Erro: " + err);
        res.status(500).send('Erro ao obter dados.');
    }
    
});

// Método HTTP GET /Esperas/:id - retorna esperas com base no id
app.get('/Esperas/:id', (req, res, next) => {
    /*
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
    */
    try {
        let result = esperas[req.params.id];
        if (result != undefined) {
            res.status(200).json(result);
        } else {
            console.log("Espera não encontrada.");
            res.status(404).json('Espera não encontrada.')
        }
    } catch (err) {
        console.log("Erro: " + err)
        res.status(500).send("Erro ao obter dados.")
    }
});

// Método HTTP POST /Esperas - cadastra uma nova espera
app.post('/Esperas', (req, res, next) => {
    /*
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
    */
    try {
        esperas[req.body.id] = Number(req.body.tempo);
        console.log('Espera cadastrada com sucesso!');
        res.status(200).send('Espera cadastrada com sucesso!');
    } catch (err) {
        console.log("Erro: " + err)
        res.status(500).send("Erro ao cadastrar espera.")
    }
});

// Método HTTP PATCH /Esperas/:id - altera uma espera
app.patch('/Esperas/:id', (req, res, next) => {
    /*
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
    */
   try {
        if (esperas[req.params.id]) {
            esperas[req.params.id] = req.body.tempo;
            console.log('Espera alterada com sucesso!');
            res.status(200).send('Espera alterada com sucesso!');
        } else {
            console.log("Espera não encontrada.");
            res.status(404).send('Espera não encontrada.');
        }
    } catch (err) {
        console.log("Erro: " + err)
        res.status(500).send("Erro ao alterar espera.")
    }
});

// Método HTTP DELETE /Esperas/:id - remove uma atração
app.delete('/Esperas/:id', (req, res, next) => {
    /*
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
   */
    try {
        if (esperas[req.params.id]) {
            delete esperas[req.params.id]
            res.status(200).send('Espera removida com sucesso!');
        } else {
            console.log("Espera não encontrada.");
            res.status(404).send('Espera não encontrada.');
        }
    } catch (err) {
        res.status(500).send('Erro ao remover espera.');
    }
});

// Inicia o Servidor na porta 8050
let porta = 8050;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});