// createTables.js
import dotenv from 'dotenv';
dotenv.config();
import { poolDirect } from './db.js';

async function create() {
  const conn = await poolDirect.getConnection();
  try {
    // Table users
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(60) NOT NULL,
      email VARCHAR(120) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','staff') NOT NULL DEFAULT 'admin',
      is_active INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`);

    // Table events
    await conn.query(`CREATE TABLE IF NOT EXISTS events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      date_start DATETIME,
      date_end DATETIME,
      location VARCHAR(180),
      capacity INT,
      image_url VARCHAR(255),
      is_public INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;`);

    // Table reservations
    await conn.query(`CREATE TABLE IF NOT EXISTS reservations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_id INT NOT NULL,
      nom VARCHAR(80) NOT NULL,
      prenom VARCHAR(80) NOT NULL,
      email VARCHAR(120) NOT NULL,
      status ENUM('confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_reservation (event_id, email),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`);

    // Table inscriptions
    await conn.query(`CREATE TABLE IF NOT EXISTS inscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      event_id INT NOT NULL,
      date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) DEFAULT 'pending',
      UNIQUE KEY unique_inscription (user_id, event_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`);

    // Table payments
    await conn.query(`CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      event_id INT NOT NULL,
      amount DECIMAL(10,2) DEFAULT 0.00,
      status VARCHAR(20) DEFAULT 'pending',
      payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`);

    console.log('Tables creees / verifiees avec succes.');
  } catch (err) {
    console.error('Erreur lors de la creation des tables:', err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

create();