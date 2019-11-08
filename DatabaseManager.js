'use strict'
import * as SQLite from 'expo-sqlite';

const db  = SQLite.openDatabase('favorites_db.db');

class Database {
  getConnection() {
    return db;
  }
}

module.exports = new Database();