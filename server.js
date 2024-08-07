const express = require('express');
const cors = require('cors');
const {Client} = require('pg');

var bodyParser = require('body-parser');


// const Client = require('pg').Client//identica cu anterioara

//conectare la baza de date
 

const config = {
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'parola',
}

const client = new Client(config)//instantiere

let p_connect = client.connect();
// p_connect.then(() => {insertProdus()})

// async function insertProdus () {
//     for (let produs of produse){
//         console.log(produs)
//         const p_res = await client.query(
//         `insert into produse
//         select ${produs.id}, '${produs.name}', '${produs.type}', ${produs.alcohol_content}, ${produs.volume}, '${produs.price}', '${produs.origin_country}', ${produs.age}`)
        
        
//     }
// }

p_connect.then(() => {
    //incepe serverul web

    const PORT = 8000;
    const app = express();//instantiere

    app.use(cors());
    app.use(express.static('images'));
    app.use(bodyParser.json());

    app.get('/produse', (req, res) => {
               
        //res.send('La multi ani!'); pentru mesaje text
        let sql;
        let clauza;
        if (req.query.country) {
            let arrSplituit = req.query.country.split(',');
            let stringJoin = arrSplituit.join(`','`);
            let stringJoinStartEnd = `'` + stringJoin + `'`
            
            clauza = `where origin_country in (${stringJoinStartEnd})`
            
            if (req.query.pretMin && req.query.pretMax) {
                clauza += ` and price > ${req.query.pretMin} and price < ${req.query.pretMax}`

            }

            if (req.query.alcMin && req.query.alcMax){
                clauza += ` and alcohol_content > ${req.query.alcMin} and alcohol_content < ${req.query.alcMax}`
            }
        }
        
        if (!req.query.country && !req.query.pretMin && !req.query.pretMax) clauza = ''
        // if (req.query.country) string = `where origin_country = '${req.query.country}'`
        //     else string = '';
        if (req.query.page && req.query.page >= 1) {
            let criteriuOrdonare = 'id asc';
            if (req.query.sortare == 'nume_asc') 
                criteriuOrdonare = `case when name != '' then name end,
                    case when name = '' then 'zzzzz' end`;
            
            if (req.query.sortare == 'nume_desc')
                criteriuOrdonare = `case when name = '' then 'zzzzz' end desc,
                case when name != '' then name end desc`;
            
            if (['price_asc', 'price_desc'].includes(req.query.sortare))           
                criteriuOrdonare = req.query.sortare.replace('_', ' ');

           

            sql = `select 
            id, name, type, alcohol_content, volume, origin_country, age, price
            from produse ${clauza}
            order by ${criteriuOrdonare} limit ${req.query.pageSize} offset (${req.query.page} - 1)*${req.query.pageSize}`
        }

        else {
            if (req.query.id) {
                          
                clauza =  `where id in (${req.query.id})`
                console.log(clauza)
            }
            if (!req.query.id) clauza = ''
          sql = `select 
          id, name, type, alcohol_content, volume, origin_country, age, price
          from produse ${clauza}`
        }
        let p_res = client.query(sql)
        console.log(sql)
        p_res.then((r) => {
            res.send(r.rows)
        })
    })

    app.get('/proprietatiProduse', (req, res) => {

        let query_proprietati = `select distinct origin_country as proprietati, 'tara' as tip from produse
        union
        select min(price):: text, 'pret_min' as tip from produse
        union
        select max(price):: text, 'pret_max' as tip from produse
        union
        select min(alcohol_content):: text, 'alcool_min' as tip from produse
        union
        select max(alcohol_content):: text, 'alcool_max' as tip from produse`

        const proprietati = client.query(query_proprietati)
        .then((r) => {
            
            res.send(r.rows)})
    })

    app.get('/nrProduse', (req, res) => {
        let queryProduse = 'select count(id) from produse';
        let arrSplituit = req.query.country?.split(',');
        let stringTara = arrSplituit?.join(`','`);
        let selectProduseTara; 
        if (stringTara || req.query.pretMin || req.query.pretMax) queryProduse += ' where ';

        if (stringTara) {
            let stringJoinStartEnd = `'` + stringTara + `'`;
            selectProduseTara = `origin_country in (${stringJoinStartEnd}) and `;
            queryProduse += selectProduseTara;
        }

        if (req.query.pretMin){
            queryProduse += `price >= ${req.query.pretMin} and `
        }

        if (req.query.pretMax){
            queryProduse += `price <= ${req.query.pretMax} and `
        }

        if (req.query.alcMin){
            queryProduse += `alcohol_content >= ${req.query.alcMin} and `
        }

        if (req.query.alcMax){
            queryProduse += `alcohol_content <= ${req.query.alcMax} and `
        }

        if (queryProduse.endsWith(' and ')) {
            queryProduse = queryProduse.slice(0, -4)}

        const nrProduse = client.query(queryProduse)
       
        nrProduse.then(r => {
            res.send(r.rows[0].count)
        })
    })

    app.post('/dateClient', (req, res) => {
        console.log(req.body)
        // let queryClient =  `select nume, prenume, telefon, adresa, localitate, judet from clienti where email = '${req.query.email}'`
        // const dateClient = client.query(queryClient)
        // dateClient.then(r => {
            // res.send(r.rows[0])})
         res.send()       
    })

    app.post('/comenzi', (req, res) => {
        console.log(req.body[0]);
        let idClient;
        let verificareClient = `select id from clienti where email = '${req.body[0].email}'`;
        client.query(verificareClient).then(async (r) => {
            idClient = r.rows[0]?.id;
            console.log('Exista client?', r.rows[0]);
            
            if (r.rows.length == 0) { //cazul in care clientul nu exista
                let insertClient = `insert into clienti (nume, prenume, judet, localitate, adresa, email) 
                select '${req.body[0].nume}', '${req.body[0].prenume}', '${req.body[0].judet}', '${req.body[0].localitate}', '${req.body[0].adresa}', '${req.body[0].email}'`
                let rr = await client.query(insertClient);
                console.log('Inserare client', rr);
                                    
                let aflaIdClient = `select id from clienti where email = '${req.body[0].email}'`;
                let rrr = await client.query(aflaIdClient);
                console.log(rrr)//aici vad id-ul
                idClient = rrr.rows[0].id;
                console.log('id client nou', idClient)
               
            }
            
            let insert_summary = `insert into summary_comenzi (id_client) select ${idClient}`
            await client.query(insert_summary);
            let queryLastVal = 'select lastval()';

            let lastVal = await client.query(queryLastVal);
            console.log(lastVal.rows[0].lastval)
            let insert_details;
            for (let i of req.body[0].cos) {
                insert_details = `insert into details_comenzi (id_comanda, id_produs, cantitate)
                select ${lastVal.rows[0].lastval}, ${i.id}, ${i.cantitate}`;
            client.query(insert_details)
            }
            let IdsiPret = 'select id, price from produse where id in (7, 14)'
            let obiectIdsiPret = await client.query(IdsiPret)
            console.log('asta e', obiectIdsiPret)
        })
       
        res.send()
    })

    app.post('/login', (req, res) => {
        console.log(req.body);
        let verificareClient = `select nume, prenume from clienti where email = '${req.body.email}'`;
        let rez = client.query(verificareClient).then((r) => {
            console.log(r)
            if (r.rows[0]?.nume[0] && r.rows[0]?.prenume[0]) {
                let inNume = r.rows[0]?.nume[0];
                let inPrenume = r.rows[0]?.prenume[0];
                console.log(inPrenume, inNume)
                res.send(`Clientul exista: ${inPrenume}${inNume}`)
            }
            else res.send('Clientul nu exista');
        })
    })

    app.post('/register', (req, res) => {
        console.log(req.body);
        let verificareClient = `select nume, prenume from clienti where email = '${req.body.email}'`;
        let rez = client.query(verificareClient).then((r) => {
            console.log(r)
            if (r.rows[0]?.nume[0] && r.rows[0]?.prenume[0]) {
                let inNume = r.rows[0]?.nume[0];
                let inPrenume = r.rows[0]?.prenume[0];
                console.log(inPrenume, inNume)
                res.send(`Clientul exista: ${inPrenume}${inNume}`)
            }
            else {
            let date = req.body;
            let insertClient = `insert into clienti (nume, prenume, localitate, adresa, email, judet, telefon, uid) select '${date.nume}', '${date.prenume}', '${date.localitate}', '${date.adresa}', '${date.email}', '${date.judet}', '${date.telefon}', '${date.uid}'`
            console.log(req.body)
            client.query(insertClient);
            let inNume = req.body.nume[0];
            let inPrenume = req.body.prenume[0];
            res.send(`Avatar: ${inPrenume}${inNume}`)
            }
        })
    })

    app.post('/insert_cos', (req, res) => {
            console.log(req.body)
       
            let verificareIdProdus = `select id_produs from produse_cos where id_produs = '${req.body.id}'`
            client.query(verificareIdProdus).then((r) => {
                // console.log(r)
                if (r.rows[0]?.id_produs) {
                    let updateCantitate =  `update produse_cos set cantitate = cantitate + 1 where id_produs = '${r.rows[0].id_produs}'`
                        client.query(updateCantitate).then((rr) => {
                            // console.log(rr)
                            if (rr.rowCount == 0) res.statusCode = 400
                        })
                    
                } else {
                    let inserareProdus = `insert into produse_cos (uid, id_produs, cantitate) select '${req.body.uid}', '${req.body.id}', '${req.body.cantitate}'`
                    client.query(inserareProdus).then((r) => {console.log(r)})
                } 
            })
            res.send()
    })

    app.post('/produse_cos', (req, res) => {
        console.log(req.body)
        let arrProduseCos = `select price, name, id_produs as id, cantitate 
        from produse_cos 
        join produse on produse.id = produse_cos.id_produs 
        where uid = '${req.body.uid}'`
        client.query(arrProduseCos)
            .then((r) => {
                console.log(r)
                res.send(r.rows)
            })
            .catch((error) => {
                console.log(error)
                res.statusCode = 400
                res.send("Eroare")
            })
       
    })

    app.post('/delete_produsCos', (req, res) => {
        console.log(req.body)
        
        let deleteProdusCos =  `delete from produse_cos where id_produs = '${req.body.id}' and uid = '${req.body.uid}'`
        client.query(deleteProdusCos).then((r) => {
            res.send('AM STERS')
        //     let arrProduseCos = `select price, name, id_produs as id, cantitate 
        //         from produse_cos 
        //         join produse on produse.id = produse_cos.id_produs 
        //         where uid = '${req.body.uid}'`
        //         console.log(arrProduseCos)
        //         client.query(arrProduseCos)
        //             .then((rr) => {
        //                 console.log(rr)
        //                 res.send(rr.rows)
        })
    
    })
        
    

    app.post('/IdProdusCosLocal', (req, res) => {
        console.log(req.body)
        let identificaIdProdus = `select id from produse where name = '${req.body.name}'`
        client.query(identificaIdProdus).then((r) => {
            console.log(r.rows[0].id)
            let idProdus = r.rows[0].id
            res.send(idProdus.toString())
        })
        .catch((error) => {
            console.log(error)
            res.statusCode = 500
            res.send("Eroare")
        })
    })
        

    app.listen(PORT, () => {
        console.log('Server listening on port ' + PORT)
    })
})


// client.end()










