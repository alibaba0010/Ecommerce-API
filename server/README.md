version: '3.9'

services:
main:
build:
context: .
target: development
ports: - ${PORT}:${PORT}
volumes: - ./src:/usr/src/app/src - /app/node_modules
env_file: - .env
command: npm run start:dev
depends_on: - mongo - redis
mongo:
image: mongo:5.0.2-focal
volumes: - mongo-data:/data/db
mongo-express:
image: mongo-express:0.54.0
ports: - 8081:8081
depends_on: - mongo
redis:
image: redis:6.2.5-alpine

volumes:
mongo-data:



const { response } = require('express');
var express = require('express');
var mysql = require('mysql');
const redis = require('redis');
const client = redis.createClient();

async function start() {

    await client.connect();

    function GetLatestPosts() {
        return new Promise(async function(resolve, reject) {
            const value = await client.get('indexitems');
            if (value != null) {
                resolve(JSON.parse(value));
            }
            else {
                var PostsList;
                mysqldb.getConnection(function (err, connection) {
                    var sql = "CALL PRC_GetPostsList()";
                    connection.query(sql, async function (err, data, fields) {
                        if (err) throw err;
                        PostsList = data[0];
                        await client.set('indexitems', JSON.stringify(PostsList));
                        await client.expire('indexitems', 86400);
                        resolve(PostsList);  
                    });
                });
            }
        })
    }
}

start()