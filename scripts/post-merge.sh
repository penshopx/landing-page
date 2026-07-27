#!/bin/bash
set -e

# Install dependencies
npm install

# NOTE: drizzle-kit push requires interactive TTY — jangan dipakai di sini.
# Semua DDL dijalankan idempotently oleh server saat startup (initDb / init functions).
# Schema baru dari task agents harus menggunakan executeSql DDL di server init, bukan drizzle push.
