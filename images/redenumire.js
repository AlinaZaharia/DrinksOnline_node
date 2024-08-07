var fs = require('fs');

fs.readdir('C:\\Users\\Lenovo\\Desktop\\Alexandru\\11.05 Magazin\\liquor-store\\public\\images', 'utf-8', (err, files) => {
  for (let folder of files){

    if (folder == 'redenumire.js') continue;
    fs.readdir('C:\\Users\\Lenovo\\Desktop\\Alexandru\\11.05 Magazin\\liquor-store\\public\\images\\' + folder, 'utf-8', (err, numeImagine) => {
      for (let nume of numeImagine){

        const numeNou = nume.replaceAll(' ', '').replaceAll(`0.`, '0').replaceAll('%', '')
        console.log(numeNou)
        fs.rename('C:\\Users\\Lenovo\\Desktop\\Alexandru\\11.05 Magazin\\liquor-store\\public\\images\\' + folder + '\\'+ nume, 'C:\\Users\\Lenovo\\Desktop\\Alexandru\\11.05 Magazin\\liquor-store\\public\\images\\' + folder + '\\'+ numeNou,  () => {
          console.log("\nFile Renamed!\n")})
      }
    })
  }
})
