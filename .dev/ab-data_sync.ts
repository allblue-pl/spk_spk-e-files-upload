
import { DataScheme } from "ab-data";
import { abData_Espada_ECore_Types } from "ab-data_espada_ecore";
import abData_DBSync from 'ab-data_db-sync';

(async () => {
    let scheme = new DataScheme(1, false);

    abData_Espada_ECore_Types(scheme);

    await abData_DBSync.sync_TS_Async(scheme, {
        abDataFSPath: `./ab-data`,
        dataPaths: [],
        libFSPath: `../.`,
    });
        })()
    .then(() => {
        console.log('Done.');
    })
    .catch((e) => {
        console.error('Error');
        console.log(e);
    });
