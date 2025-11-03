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
        (email TEXT PRIMARY KEY NOT NULL, tipo INTEGER NOT NULL, dataEfetivacao DATE NOT NULL, usos INTEGER NOT NULL, usoMax INTEGER)`, 
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

// Método HTTP POST /Ingressos - adiciona um novo ingresso
app.post('/Ingressos', (req, res, next) => {
    data = req.body.dataEfetivacao;
    data_formatada = `${data[6]}${data[7]}${data[8]}${data[9]}-${data[3]}${data[4]}-${data[0]}${data[1]}`
    db.run(`INSERT INTO ingressos(email, tipo, dataEfetivacao, usos, usoMax) VALUES(?,?,?,?,?)`,
         [req.body.email, req.body.tipo, data_formatada, req.body.usos, req.body.usoMax], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao criar ingresso.');
        } else {
            console.log('Ingresso criado com sucesso!');
            res.status(200).send('Ingresso criado com sucesso!');
        }
    });
});

// Método HTTP PATCH /Ingressos/addUso/:email - adiciona um uso em um ingresso com base no email
app.patch('/Ingressos/addUso/:email', (req, res, next) => {
    // Primeiro pesquisa o ingresso, tanto para checar se existe quanto para pegar os dados do ingresso.
    // TODO: Talvez seja bom checar se o email existe nos cadastros?
    db.get( `SELECT * FROM ingressos WHERE email = ?`, 
            req.params.email, (err, result) => {
        if (err) { 
            console.log("Erro: "+err);
            res.status(500).send('Erro ao obter dados.');
        } else if (result == null) {
            console.log("Ingresso não encontrado.");
            res.status(404).send('Ingresso não encontrado.');
        } else {
            console.log(result)

            data_ingresso = createDate(result.dataEfetivacao);
            data_atual = createDate(new Date().toISOString());
            
            if (result.tipo == 1 && result.usos > result.usoMax) {
                console.log("Limite de usos atingido.");
                // Ver qual status HTTP usar aqui
                res.status(500).send('Limite de usos atingido.');
            }
            // Se o ingresso de tipo 2 não for usado no dia de efetivação, invalida o processo.
            else if (result.tipo == 2 && data_ingresso.getTime() != data_atual.getTime()) {
                console.log("Data de utilização inválida.");
                // Ver qual status HTTP usar aqui
                res.status(500).send('Data de utilização inválida.');
            }
            // Se a diferença de tempo em milissegundos entre as datas for menor que 31.536.000.000ms (365 dias), invalida o processo.
            else if (result.tipo == 3 && data_ingresso.getTime() - data_atual.getTime() < 31536000000) {
                console.log("Data de utilização inválida.");
                // Ver qual status HTTP usar aqui
                res.status(500).send('Data de utilização inválida.');
            }
            // Tudo certo aqui, chapa!
            else {
                db.run(`UPDATE ingressos SET usos = COALESCE(?,usos) WHERE email = ?`,
                    [result.usos + 1, req.params.email], function(err) {
                        if (err){
                            res.status(500).send('Erro ao alterar dados.');
                        } else {
                            res.status(200).send('Ingresso alterado com sucesso!');
                        }
                    }
                );
            }
        }
    });
    
});

// Método HTTP PATCH /Ingressos/:email - altera um ingresso com base no email
app.patch('/Ingressos/:email', (req, res, next) => {
    db.run(`UPDATE ingressos SET tipo = COALESCE (?,tipo), SET dataEfetivacao = COALESCE(?,dataEfetivacao), SET usos = COALESCE(?,usos), SET usoMax = (?,usoMax) WHERE email = ?`,
        [req.body.tipo, req.body.dataEfetivacao, req.body.usos, req.body.usoMax, req.params.email], function(err) {
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

function formatarISOdate(str) {
    str_formatada = '';
    for (let i=0; i<10; i++) {
        str_formatada += str[i];
    }
    return str_formatada
}

// Cria um objeto Date a partir de uma string no formato 'DD/MM/YYYY' (contando com as barras ou traços)
function createDate(str) {
    return new Date(`${data[6]}${data[7]}${data[8]}${data[9]}`,`${data[3]}${data[4]}` - 1,`${data[0]}${data[1]}`)
}

/* Funções que perderam a utilidade e provavelmente vão ser apagadas
function getStringFraction(str, start, end) {
    str_formatada = '';
    for (let i=start; i<=end; i++) {
        str_formatada += str[i];
    }
    return str_formatada
}

function isYearApart(date1, date2) {
    diffAno = getStringFraction(date1, 6, 9) - getStringFraction(date2, 6, 9)
    if (diffAno > 1 || diffAno < -1) {
        return true
    } else if (diffAno == 1) {
    // Significa que o date1 é após o date2.
        diffMes = getStringFraction(date1, 3, 4) - getStringFraction(date2, 3, 4)
        if (diffMes > 0) {
            return false
        } else if (diffMes) {
            return 1
        } else {

        }
    } else if (diffAno == -1){
    // Significa que o date2 é após o date1.
        
    } else {
        return false
    }
}
*/