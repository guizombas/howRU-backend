import sqlite from 'sqlite3'
import {open} from 'sqlite'
import ddlComands from './ddl.js'

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function connection(){
    const db = await open({
        filename: __dirname + '/database.sqlite',
        driver: sqlite.Database
    })
    
    return ddlComands(db)
}